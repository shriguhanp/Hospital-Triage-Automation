import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import DoctorQueueView from '../../components/queue/DoctorQueueView';
import axios from 'axios';

const DoctorQueue = () => {
    const { backendUrl, token, userData } = useContext(AppContext);
    const [docId, setDocId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get doctor ID from user data
    useEffect(() => {
        const fetchDoctorId = async () => {
            if (userData?._id) {
                // Check if user is a doctor by checking their role or by fetching doctor profile
                try {
                    const { data } = await axios.post(
                        backendUrl + '/api/doctor/profile',
                        { docId: userData._id },
                        { headers: { token } }
                    );
                    if (data.success) {
                        setDocId(userData._id);
                    }
                } catch (error) {
                    console.error('Error fetching doctor profile:', error);
                }
            }
            setLoading(false);
        };

        fetchDoctorId();
    }, [userData, backendUrl, token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!docId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <div className="text-6xl mb-4">👨‍⚕️</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Doctor Access Only</h2>
                    <p className="text-gray-500">This page is for doctors to view their patient queue.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Queue</h1>
                    <p className="text-gray-500">Manage your patient queue with priority-based sorting</p>
                </div>

                {/* Queue View */}
                <DoctorQueueView docId={docId} />
            </div>
        </div>
    );
};

export default DoctorQueue;
