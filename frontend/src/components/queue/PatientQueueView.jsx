import React, { useState, useEffect } from 'react';
import QueueCard from './QueueCard';
import usePriorityQueue from '../../hooks/usePriorityQueue';

const PatientQueueView = ({ userId }) => {
    const [queueStatuses, setQueueStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { fetchPatientQueueStatus, isConnected } = usePriorityQueue();

    useEffect(() => {
        const loadQueueStatus = async () => {
            setLoading(true);
            const statuses = await fetchPatientQueueStatus();
            setQueueStatuses(statuses);
            setLoading(false);
        };

        loadQueueStatus();

        // Refresh every 30 seconds
        const interval = setInterval(loadQueueStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchPatientQueueStatus]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (queueStatuses.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Active Appointments</h3>
                <p className="text-gray-500">You don't have any appointments in the queue.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Your Queue Status</h2>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-sm text-gray-500">
                        {isConnected ? 'Live' : 'Reconnecting...'}
                    </span>
                </div>
            </div>

            {/* Queue Cards */}
            <div className="space-y-4">
                {queueStatuses.map((status) => (
                    <div
                        key={status.appointmentId}
                        className="bg-white rounded-xl border border-gray-200 p-4"
                    >
                        {/* Doctor Info */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="font-semibold text-gray-900">{status.doctorName}</h3>
                                <p className="text-sm text-gray-500">
                                    {status.slotDate} at {status.slotTime}
                                </p>
                            </div>
                            <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/5 text-primary">
                                {status.severity}
                            </div>
                        </div>

                        {/* Queue Info */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Queue Position</p>
                                <p className="text-2xl font-bold text-primary">#{status.queuePosition || '-'}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Estimated Wait</p>
                                <p className="text-2xl font-bold text-gray-700">{status.estimatedWait || '-'}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Priority Score</p>
                                <p className="text-2xl font-bold text-gray-700">{status.priorityScore || '-'}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatientQueueView;
