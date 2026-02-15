/**
 * Health Intake Controller
 * Handles appointment booking with health data and ML severity prediction
 */

import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from 'cloudinary';
import { predictSeverity, analyzeWound, calculateFinalSeverity } from "../services/mlService.js";
import { getIO } from "../socketServer.js";

/**
 * Book appointment with health intake data
 * POST /api/healthintake/book-with-intake
 */
export const bookWithHealthIntake = async (req, res) => {
    try {
        const {
            userId,
            docId,
            slotDate,
            slotTime,
            // Health intake data
            symptoms,
            symptomDuration,
            existingDiseases,
            vitals,
            patientAge
        } = req.body;

        // Validate required fields
        if (!userId || !docId || !slotDate || !slotTime) {
            return res.json({ success: false, message: 'Missing required booking details' });
        }

        // Get doctor and user data
        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData || !docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }

        if (docData.availabilityStatus === 'Unavailable') {
            return res.json({ success: false, message: 'Doctor is currently unavailable' });
        }

        const userData = await userModel.findById(userId).select("-password");
        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Check slot availability
        let slots_booked = docData.slots_booked || {};
        if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
            return res.json({ success: false, message: 'Slot Not Available' });
        }

        // Update slots
        if (slots_booked[slotDate]) {
            slots_booked[slotDate].push(slotTime);
        } else {
            slots_booked[slotDate] = [slotTime];
        }

        // Assign token number
        const tokenNumber = docData.currentTokenCount + 1;

        // Step 1: Calculate structured severity score (if health data provided)
        let structuredScore = 0;
        let imageSeverityScore = 0;
        let finalSeverityScore = 0;
        let mlProcessed = false;
        let hasHealthIntake = false;

        if (vitals && vitals.systolicBP && vitals.spo2) {
            hasHealthIntake = true;

            try {
                // Call ML service for structured data prediction
                structuredScore = await predictSeverity(
                    vitals,
                    symptoms || [],
                    patientAge || userData.age || 0
                );
                mlProcessed = true;
            } catch (error) {
                console.error('ML prediction error:', error);
                structuredScore = 15; // Default low severity
            }
        }

        // Step 2: Calculate final severity (for now without image, will update separately)
        finalSeverityScore = structuredScore;

        // Determine severity category
        let severityCategory = 'Low';
        if (finalSeverityScore >= 76) severityCategory = 'Emergency';
        else if (finalSeverityScore >= 51) severityCategory = 'High';
        else if (finalSeverityScore >= 26) severityCategory = 'Medium';

        // Create appointment
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: { ...docData.toObject(), slots_booked: undefined },
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            tokenNumber,

            // Health intake data
            hasHealthIntake,
            symptoms: symptoms || [],
            symptomDuration: symptomDuration || '',
            existingDiseases: existingDiseases || [],
            vitals: vitals || {},
            patientAge: patientAge || 0,

            // ML scores
            structuredSeverityScore: structuredScore,
            imageSeverityScore: 0, // Will be updated when image is uploaded
            finalSeverityScore,
            mlProcessed,
            severity: severityCategory,
            priorityScore: finalSeverityScore
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Update doctor's slots and token count
        await doctorModel.findByIdAndUpdate(docId, {
            slots_booked,
            currentTokenCount: tokenNumber
        });

        // Emit WebSocket event for queue update
        try {
            const io = getIO();
            io.to(`queue_${docId}`).emit('queue_updated', {
                docId,
                appointment: newAppointment.toObject()
            });

            // Notify patient
            io.to(userId).emit('severity_calculated', {
                appointmentId: newAppointment._id,
                structuredScore,
                finalScore: finalSeverityScore,
                severity: severityCategory
            });
        } catch (socketError) {
            console.log('Socket not available for real-time update');
        }

        // Get queue position
        const allAppointments = await appointmentModel.find({
            docId,
            cancelled: false,
            isCompleted: false
        });

        // Sort by priority
        const sorted = allAppointments.sort((a, b) => {
            if (a.severity === 'Emergency' && b.severity !== 'Emergency') return -1;
            if (b.severity === 'Emergency' && a.severity !== 'Emergency') return 1;
            return (b.finalSeverityScore || 0) - (a.finalSeverityScore || 0);
        });

        const queuePosition = sorted.findIndex(apt => apt._id.toString() === newAppointment._id.toString()) + 1;
        const estimatedWait = queuePosition * 15; // 15 min per patient

        res.json({
            success: true,
            message: 'Appointment Booked Successfully',
            appointment: {
                _id: newAppointment._id,
                tokenNumber,
                slotDate,
                slotTime,
                severity: severityCategory,
                structuredSeverityScore: structuredScore,
                finalSeverityScore,
                queuePosition,
                estimatedWait: `${estimatedWait} min`
            }
        });

    } catch (error) {
        console.error('Error in bookWithHealthIntake:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Upload wound image and analyze severity
 * POST /api/healthintake/upload-wound
 */
export const uploadWoundImage = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const imageFile = req.file;

        if (!appointmentId) {
            return res.json({ success: false, message: 'Appointment ID required' });
        }

        if (!imageFile) {
            return res.json({ success: false, message: 'No image file provided' });
        }

        // Upload to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            resource_type: "image",
            folder: "wound_images"
        });

        const imageURL = imageUpload.secure_url;

        // Analyze wound with ML service
        let imageSeverityScore = 0;
        try {
            const analysis = await analyzeWound(imageFile.path);
            imageSeverityScore = analysis.score;
        } catch (error) {
            console.error('Wound analysis error:', error);
            imageSeverityScore = 25; // Default mild
        }

        // Get appointment
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Recalculate final severity
        const finalSeverityScore = calculateFinalSeverity(
            appointment.structuredSeverityScore,
            imageSeverityScore
        );

        // Update severity category
        let severityCategory = 'Low';
        if (finalSeverityScore >= 76) severityCategory = 'Emergency';
        else if (finalSeverityScore >= 51) severityCategory = 'High';
        else if (finalSeverityScore >= 26) severityCategory = 'Medium';

        // Update appointment
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            woundImage: imageURL,
            imageSeverityScore,
            finalSeverityScore,
            severity: severityCategory,
            priorityScore: finalSeverityScore
        });

        // Emit WebSocket for queue reshuffle
        try {
            const io = getIO();
            io.to(`queue_${appointment.docId}`).emit('queue_reshuffled', {
                docId: appointment.docId,
                reason: 'Severity updated with wound analysis'
            });
        } catch (socketError) {
            console.log('Socket not available');
        }

        res.json({
            success: true,
            message: 'Wound image uploaded and analyzed',
            imageURL,
            imageSeverityScore,
            finalSeverityScore,
            severity: severityCategory
        });

    } catch (error) {
        console.error('Error uploading wound image:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Upload medical reports (PDF/images)
 * POST /api/healthintake/upload-reports
 */
export const uploadMedicalReports = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const files = req.files;

        if (!appointmentId) {
            return res.json({ success: false, message: 'Appointment ID required' });
        }

        if (!files || files.length === 0) {
            return res.json({ success: false, message: 'No files provided' });
        }

        // Upload all files to Cloudinary
        const uploadPromises = files.map(file =>
            cloudinary.uploader.upload(file.path, {
                resource_type: "auto", // Auto-detect (image or PDF)
                folder: "medical_reports"
            })
        );

        const uploads = await Promise.all(uploadPromises);
        const reportURLs = uploads.map(upload => upload.secure_url);

        // Update appointment
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        const updatedReports = [...(appointment.medicalReports || []), ...reportURLs];

        await appointmentModel.findByIdAndUpdate(appointmentId, {
            medicalReports: updatedReports
        });

        res.json({
            success: true,
            message: `${reportURLs.length} medical report(s) uploaded successfully`,
            reportURLs
        });

    } catch (error) {
        console.error('Error uploading medical reports:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get severity analysis details for an appointment
 * GET /api/healthintake/severity-details/:appointmentId
 */
export const getSeverityDetails = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        res.json({
            success: true,
            details: {
                hasHealthIntake: appointment.hasHealthIntake,
                symptoms: appointment.symptoms,
                symptomDuration: appointment.symptomDuration,
                existingDiseases: appointment.existingDiseases,
                vitals: appointment.vitals,
                woundImage: appointment.woundImage,
                medicalReports: appointment.medicalReports,
                structuredSeverityScore: appointment.structuredSeverityScore,
                imageSeverityScore: appointment.imageSeverityScore,
                finalSeverityScore: appointment.finalSeverityScore,
                severity: appointment.severity,
                mlProcessed: appointment.mlProcessed
            }
        });

    } catch (error) {
        console.error('Error fetching severity details:', error);
        res.json({ success: false, message: error.message });
    }
};

export default {
    bookWithHealthIntake,
    uploadWoundImage,
    uploadMedicalReports,
    getSeverityDetails
};
