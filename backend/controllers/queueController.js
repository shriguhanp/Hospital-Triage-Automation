import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import priorityEngine from "../services/priorityEngine.js";
import { getIO } from "../socketServer.js";

/**
 * Get priority queue for a specific doctor
 * Sorted by priority score (highest first)
 */
const getDoctorQueue = async (req, res) => {
    try {
        const { docId } = req.body;

        const appointments = await appointmentModel.find({
            docId,
            cancelled: false,
            isCompleted: false
        }).sort({ createdAt: -1 });

        // Sort by priority score
        const sortedAppointments = priorityEngine.sortByPriority(appointments);

        // Get doctor's avg consultation time
        const doctor = await doctorModel.findById(docId).select('avgConsultationTime');
        const consultationTime = doctor?.avgConsultationTime || 15;

        // Calculate queue position and ETA for each appointment
        const queueWithPositions = sortedAppointments.map((apt, index) => {
            const waitMinutes = index * consultationTime;
            return {
                ...apt.toObject(),
                queuePosition: index + 1,
                estimatedWait: waitMinutes <= 60
                    ? `${waitMinutes} min`
                    : `${Math.floor(waitMinutes / 60)}h ${waitMinutes % 60}m`
            };
        });

        res.json({
            success: true,
            queue: queueWithPositions,
            totalInQueue: queueWithPositions.length
        });

    } catch (error) {
        console.error('Error fetching doctor queue:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get patient's queue status for their appointments
 */
const getPatientQueueStatus = async (req, res) => {
    try {
        const { userId } = req.body;

        const appointments = await appointmentModel.find({
            userId,
            cancelled: false,
            isCompleted: false
        });

        const queueStatuses = await Promise.all(
            appointments.map(async (apt) => {
                console.log(`Checking queue for Apt: ${apt._id}, Date: ${apt.slotDate}`);
                const allAppointments = await appointmentModel.find({
                    docId: apt.docId,
                    slotDate: apt.slotDate, // Filter by the specific appointment date
                    cancelled: false,
                    isCompleted: false
                });
                console.log(`Found ${allAppointments.length} appointments for this date`);

                // Get doctor's consultation time
                const doctor = await doctorModel.findById(apt.docId).select('name avgConsultationTime');
                const consultationTime = doctor?.avgConsultationTime || 15;

                const { position, estimatedWait } = priorityEngine.getQueuePosition(
                    allAppointments,
                    apt._id,
                    consultationTime
                );

                return {
                    appointmentId: apt._id,
                    doctorName: doctor?.name || 'Unknown',
                    doctorId: apt.docId,
                    slotDate: apt.slotDate,
                    slotTime: apt.slotTime,
                    severity: apt.severity,
                    priorityScore: apt.priorityScore,
                    queuePosition: position,
                    estimatedWait,
                    tokenNumber: apt.tokenNumber
                };
            })
        );

        res.json({ success: true, queueStatuses });

    } catch (error) {
        console.error('Error fetching patient queue status:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Book appointment with priority scoring
 */
const bookWithPriority = async (req, res) => {
    try {
        const {
            userId,
            docId,
            slotDate,
            slotTime,
            severity = 'Low',
            symptoms = '',
            patientAge = 0,
            location = { lat: 0, lng: 0 },
            isEmergency = false
        } = req.body;

        const docData = await doctorModel.findById(docId).select("-password");

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }

        // Check availability status
        if (docData.availabilityStatus === 'Unavailable') {
            return res.json({ success: false, message: 'Doctor is currently unavailable' });
        }

        let slots_booked = docData.slots_booked || {};

        // Check slot availability
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' });
            }
            slots_booked[slotDate].push(slotTime);
        } else {
            slots_booked[slotDate] = [slotTime];
        }

        const userData = await userModel.findById(userId).select("-password");

        // Calculate priority score
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: { ...docData.toObject(), slots_booked: undefined },
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            tokenNumber: docData.currentTokenCount + 1,
            // Priority fields
            severity,
            symptoms,
            patientAge,
            location,
            isEmergency,
            priorityScore: 0 // Will be recalculated
        };

        // Calculate priority score
        appointmentData.priorityScore = priorityEngine.calculatePriorityScore(appointmentData);

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Update doctor's booked slots and token count
        await doctorModel.findByIdAndUpdate(docId, {
            slots_booked,
            currentTokenCount: docData.currentTokenCount + 1
        });

        // Emit socket event for real-time queue update
        try {
            const io = getIO();
            if (io) {
                io.to(docId).emit('queue_updated', {
                    docId,
                    appointment: newAppointment.toObject()
                });
            }
        } catch (socketError) {
            console.log('Socket not available, skipping real-time update');
        }

        res.json({
            success: true,
            message: 'Appointment Booked Successfully',
            appointmentId: newAppointment._id,
            priorityScore: newAppointment.priorityScore,
            tokenNumber: newAppointment.tokenNumber
        });

    } catch (error) {
        console.error('Error booking with priority:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Auto-book earliest available priority slot for emergency cases
 */
const autoBookEmergencySlot = async (req, res) => {
    try {
        const { userId, docId, severity, symptoms = '', patientAge = 0, location = { lat: 0, lng: 0 } } = req.body;

        const docData = await doctorModel.findById(docId).select("-password");

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }

        // Get all existing appointments for this doctor
        const existingAppointments = await appointmentModel.find({
            docId,
            cancelled: false,
            isCompleted: false
        });

        // Find earliest available slot
        const earliestSlot = priorityEngine.findEarliestPrioritySlot(docData, existingAppointments);

        if (!earliestSlot) {
            return res.json({ success: false, message: 'No available slots in the next 7 days' });
        }

        const userData = await userModel.findById(userId).select("-password");

        // Create appointment with high priority
        const isHighSeverity = severity === 'High' || severity === 'Emergency';

        const appointmentData = {
            userId,
            docId,
            userData,
            docData: { ...docData.toObject(), slots_booked: undefined },
            amount: docData.fees,
            slotTime: earliestSlot.slotTime,
            slotDate: earliestSlot.slotDate,
            date: Date.now(),
            tokenNumber: docData.currentTokenCount + 1,
            // Priority fields
            severity,
            symptoms,
            patientAge,
            location,
            isEmergency: isHighSeverity,
            priorityScore: isHighSeverity ? 100 : 50 // High priority for emergency
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Update doctor's slots
        const slots_booked = docData.slots_booked || {};
        if (slots_booked[earliestSlot.slotDate]) {
            slots_booked[earliestSlot.slotDate].push(earliestSlot.slotTime);
        } else {
            slots_booked[earliestSlot.slotDate] = [earliestSlot.slotTime];
        }

        await doctorModel.findByIdAndUpdate(docId, {
            slots_booked,
            currentTokenCount: docData.currentTokenCount + 1
        });

        // Emit socket event
        try {
            const io = getIO();
            if (io) {
                io.to(docId).emit('queue_updated', {
                    docId,
                    appointment: newAppointment.toObject()
                });
                io.to(userId).emit('emergency_booked', {
                    success: true,
                    appointment: newAppointment.toObject()
                });
            }
        } catch (socketError) {
            console.log('Socket not available');
        }

        res.json({
            success: true,
            message: 'Emergency slot booked successfully',
            appointment: newAppointment.toObject()
        });

    } catch (error) {
        console.error('Error auto-booking emergency slot:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Update appointment priority
 */
const updatePriority = async (req, res) => {
    try {
        const { appointmentId, severity, isEmergency } = req.body;

        const updateData = {};
        if (severity) updateData.severity = severity;
        if (isEmergency !== undefined) updateData.isEmergency = isEmergency;

        // Recalculate priority score
        const appointment = await appointmentModel.findById(appointmentId);
        if (appointment) {
            const updatedData = { ...appointment.toObject(), ...updateData };
            updateData.priorityScore = priorityEngine.calculatePriorityScore(updatedData);
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, updateData);

        // Emit socket event
        try {
            const io = getIO();
            if (io) {
                io.to(appointment.docId).emit('priority_updated', {
                    appointmentId,
                    ...updateData
                });
            }
        } catch (socketError) {
            console.log('Socket not available');
        }

        res.json({ success: true, message: 'Priority updated' });

    } catch (error) {
        console.error('Error updating priority:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get queue statistics for a doctor
 */
const getQueueStats = async (req, res) => {
    try {
        const { docId } = req.body;

        const appointments = await appointmentModel.find({
            docId,
            cancelled: false,
            isCompleted: false
        });

        const sortedQueue = priorityEngine.sortByPriority(appointments);

        // Count by severity
        const severityCounts = {
            Low: 0,
            Medium: 0,
            High: 0,
            Emergency: 0
        };

        let totalWaitMinutes = 0;
        sortedQueue.forEach((apt, index) => {
            if (severityCounts[apt.severity] !== undefined) {
                severityCounts[apt.severity]++;
            }
            totalWaitMinutes += index * 15;
        });

        const emergencyCount = appointments.filter(apt => apt.isEmergency).length;

        res.json({
            success: true,
            stats: {
                totalInQueue: appointments.length,
                severityCounts,
                emergencyCount,
                estimatedWait: `${Math.floor(totalWaitMinutes / 60)}h ${totalWaitMinutes % 60}m`,
                avgWaitPerPatient: appointments.length > 0 ? '15 min' : 'N/A'
            }
        });

    } catch (error) {
        console.error('Error fetching queue stats:', error);
        res.json({ success: false, message: error.message });
    }
};

export {
    getDoctorQueue,
    getPatientQueueStatus,
    bookWithPriority,
    autoBookEmergencySlot,
    updatePriority,
    getQueueStats
};
