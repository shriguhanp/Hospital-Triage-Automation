import React, { useState, useEffect } from 'react';
import QueueCard from './QueueCard';
import usePriorityQueue from '../../hooks/usePriorityQueue';
import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const DoctorQueueView = ({ docId }) => {
    const { backendUrl, token } = useContext(AppContext);
    const { queue, loading, isConnected, fetchDoctorQueue } = usePriorityQueue(docId);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Handle completing an appointment
    const handleComplete = async (appointmentId) => {
        try {
            await axios.post(
                backendUrl + '/api/doctor/complete-appointment',
                { docId, appointmentId },
                { headers: { token } }
            );
            // Refresh queue
            fetchDoctorQueue();
        } catch (error) {
            console.error('Error completing appointment:', error);
        }
    };

    // Handle cancelling an appointment
    const handleCancel = async (appointmentId) => {
        try {
            await axios.post(
                backendUrl + '/api/doctor/cancel-appointment',
                { docId, appointmentId },
                { headers: { token } }
            );
            // Refresh queue
            fetchDoctorQueue();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
        }
    };

    // Count by severity
    const getSeverityCounts = () => {
        const counts = { Emergency: 0, High: 0, Medium: 0, Low: 0 };
        queue.forEach(apt => {
            if (counts[apt.severity] !== undefined) {
                counts[apt.severity]++;
            }
        });
        return counts;
    };

    const severityCounts = getSeverityCounts();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">👨‍⚕️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Patients in Queue</h3>
                <p className="text-gray-500">There are no patients waiting for consultation.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats & Connection */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                    Patient Queue ({queue.length})
                </h2>
                <div className="flex items-center gap-4">
                    {/* Severity Badges */}
                    <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            🔴 {severityCounts.Emergency}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            🟠 {severityCounts.High}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            🟡 {severityCounts.Medium}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            🟢 {severityCounts.Low}
                        </span>
                    </div>
                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        <span className="text-sm text-gray-500">
                            {isConnected ? 'Live' : 'Reconnecting...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Queue List */}
            <div className="space-y-3">
                {queue.map((appointment, index) => (
                    <QueueCard
                        key={appointment._id}
                        appointment={appointment}
                        type="doctor"
                        isCurrentPatient={index === currentIndex}
                        onComplete={handleComplete}
                        onCancel={handleCancel}
                    />
                ))}
            </div>

            {/* Auto-sort notice */}
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-gray-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">
                        Queue is automatically sorted by priority score. Emergency cases are always shown first.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DoctorQueueView;
