import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import PatientQueueView from '../../components/queue/PatientQueueView';
import NearbyDoctors from '../../components/queue/NearbyDoctors';

const PatientQueue = () => {
    const { userData, doctors, token } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('queue');

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <div className="text-6xl mb-4">🔐</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Login Required</h2>
                    <p className="text-gray-500 mb-6">Please login to view your appointment queue.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Health Queue</h1>
                    <p className="text-gray-500">Track your appointments and queue position in real-time</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                            activeTab === 'queue' 
                                ? 'text-primary' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        My Queue
                        {activeTab === 'queue' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('nearby')}
                        className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                            activeTab === 'nearby' 
                                ? 'text-primary' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Nearby Doctors
                        {activeTab === 'nearby' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="grid gap-6">
                    {activeTab === 'queue' && (
                        <PatientQueueView userId={userData?._id} />
                    )}

                    {activeTab === 'nearby' && (
                        <NearbyDoctors doctors={doctors} limit={10} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientQueue;
