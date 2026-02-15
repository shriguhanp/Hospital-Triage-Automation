import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { io } from 'socket.io-client';

// Socket connection singleton
let socket = null;

export const usePriorityQueue = (docId = null) => {
    const { backendUrl, token, userData } = useContext(AppContext);
    
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize socket connection
    useEffect(() => {
        if (!socket && backendUrl) {
            socket = io(backendUrl, {
                transports: ['websocket'],
                autoConnect: true
            });

            socket.on('connect', () => {
                console.log('🔌 Queue socket connected');
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                console.log('🔌 Queue socket disconnected');
                setIsConnected(false);
            });
        }

        return () => {
            if (socket) {
                socket.off('connect');
                socket.off('disconnect');
            }
        };
    }, [backendUrl]);

    // Join doctor's queue room (for doctors)
    const joinDoctorQueue = useCallback((doctorId) => {
        if (socket && doctorId) {
            socket.emit('join_doctor_queue', doctorId);
            console.log(`📡 Joined doctor queue: ${doctorId}`);
        }
    }, []);

    // Join patient's queue status room (for patients)
    const joinPatientQueue = useCallback((appointmentId) => {
        if (socket && appointmentId) {
            socket.emit('join_patient_queue', appointmentId);
            console.log(`📡 Joined patient queue: ${appointmentId}`);
        }
    }, []);

    // Fetch doctor queue
    const fetchDoctorQueue = useCallback(async () => {
        if (!docId || !token) return;

        setLoading(true);
        setError(null);
        
        try {
            const { data } = await axios.post(
                backendUrl + '/api/queue/doctor-queue',
                { docId },
                { headers: { token } }
            );
            
            if (data.success) {
                setQueue(data.queue);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [docId, token, backendUrl]);

    // Fetch patient's queue status
    const fetchPatientQueueStatus = useCallback(async () => {
        if (!token || !userData?._id) return;

        setLoading(true);
        setError(null);
        
        try {
            const { data } = await axios.post(
                backendUrl + '/api/queue/patient-queue-status',
                { userId: userData._id },
                { headers: { token } }
            );
            
            if (data.success) {
                return data.queueStatuses;
            } else {
                setError(data.message);
                return [];
            }
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [token, userData, backendUrl]);

    // Listen for queue updates
    useEffect(() => {
        if (!socket) return;

        const handleQueueUpdate = (data) => {
            console.log('📥 Queue updated:', data);
            if (docId && data.docId === docId) {
                setQueue(prev => {
                    const exists = prev.find(apt => apt._id === data.appointment._id);
                    if (exists) {
                        return prev.map(apt => 
                            apt._id === data.appointment._id ? data.appointment : apt
                        );
                    } else {
                        return [data.appointment, ...prev];
                    }
                });
            }
        };

        const handleQueueRemoved = (data) => {
            console.log('📥 Patient removed from queue:', data);
            if (docId && data.docId === docId) {
                setQueue(prev => prev.filter(apt => apt._id !== data.appointmentId));
            }
        };

        socket.on('queue_updated', handleQueueUpdate);
        socket.on('patient_removed', handleQueueRemoved);

        return () => {
            socket.off('queue_updated', handleQueueUpdate);
            socket.off('patient_removed', handleQueueRemoved);
        };
    }, [docId]);

    // Fetch queue on mount
    useEffect(() => {
        if (docId && token) {
            fetchDoctorQueue();
            joinDoctorQueue(docId);
        }
    }, [docId, token, fetchDoctorQueue, joinDoctorQueue]);

    return {
        queue,
        loading,
        error,
        isConnected,
        fetchDoctorQueue,
        fetchPatientQueueStatus,
        joinDoctorQueue,
        joinPatientQueue,
        socket
    };
};

// Hook for booking with priority
export const usePriorityBooking = () => {
    const { backendUrl, token, userData } = useContext(AppContext);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const bookWithPriority = async (bookingData) => {
        if (!token) {
            return { success: false, message: 'Please login first' };
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post(
                backendUrl + '/api/queue/book-with-priority',
                {
                    ...bookingData,
                    userId: userData._id
                },
                { headers: { token } }
            );

            return data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const autoBookEmergency = async (bookingData) => {
        if (!token) {
            return { success: false, message: 'Please login first' };
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post(
                backendUrl + '/api/queue/auto-book-emergency',
                {
                    ...bookingData,
                    userId: userData._id
                },
                { headers: { token } }
            );

            return data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        bookWithPriority,
        autoBookEmergency
    };
};

// Severity options
export const SEVERITY_OPTIONS = [
    { value: 'Low', label: 'Low', description: 'General consultation', color: 'green' },
    { value: 'Medium', label: 'Medium', description: 'Moderate symptoms', color: 'yellow' },
    { value: 'High', label: 'High', description: 'Serious condition', color: 'orange' },
    { value: 'Emergency', label: 'Emergency', description: 'Critical - immediate care needed', color: 'red' }
];

export default usePriorityQueue;
