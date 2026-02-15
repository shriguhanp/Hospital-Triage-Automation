import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import OverviewTab from '../components/health/OverviewTab';
import SymptomsTab from '../components/health/SymptomsTab';
import VitalsTab from '../components/health/VitalsTab';
import ConditionsTab from '../components/health/ConditionsTab';
import HistoryTab from '../components/health/HistoryTab';
import MedicationsTab from '../components/health/MedicationsTab';
import ReportsTab from '../components/health/ReportsTab';
import PriorityScoreTab from '../components/health/PriorityScoreTab';

const Health = () => {
    const { backendUrl, token, userData } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [healthProfile, setHealthProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'symptoms', label: 'Symptoms' },
        { id: 'vitals', label: 'Vitals' },
        { id: 'conditions', label: 'Conditions' },
        { id: 'history', label: 'History' },
        { id: 'medications', label: 'Medications' },
        { id: 'reports', label: 'Reports' },
        { id: 'priority', label: 'Priority Score' }
    ];

    // Load health profile
    useEffect(() => {
        if (token && userData) {
            loadHealthProfile();
        }
    }, [token, userData]);

    const loadHealthProfile = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(
                `${backendUrl}/api/health/${userData._id}`,
                { headers: { token } }
            );

            if (data.success && data.profile) {
                setHealthProfile(data.profile);
                setLastUpdated(data.profile.lastUpdated);
            } else {
                // No profile exists yet, initialize empty profile
                setHealthProfile({
                    patientId: userData._id,
                    age: 0,
                    gender: 'Not Selected',
                    height: 0,
                    weight: 0,
                    bmi: 0,
                    bloodGroup: 'Unknown',
                    pregnancyStatus: false,
                    symptomTags: [],
                    painLevel: 0,
                    duration: { value: 0, unit: 'hours' },
                    sudden: false,
                    worsening: false,
                    fever: false,
                    bleeding: false,
                    breathingDifficulty: false,
                    vitals: {
                        systolicBP: 0,
                        diastolicBP: 0,
                        heartRate: 0,
                        spo2: 0,
                        temperature: 0,
                        sugarLevel: 0
                    },
                    conditions: {
                        diabetes: false,
                        hypertension: false,
                        asthma: false,
                        heartDisease: false,
                        kidneyDisease: false,
                        cancer: false,
                        strokeHistory: false
                    },
                    surgeries: [],
                    recentHospitalization: false,
                    icuHistory: false,
                    allergies: [],
                    pregnancyComplications: [],
                    medications: {
                        bloodThinners: false,
                        insulin: false,
                        steroids: false,
                        chemotherapy: false
                    },
                    reports: {
                        woundImages: [],
                        labReportPDFs: [],
                        xrayImages: [],
                        ecgCSVs: []
                    },
                    priorityScore: 0,
                    priorityLevel: 'LOW',
                    colorCode: '#10B981'
                });
            }
        } catch (error) {
            console.error('Error loading health profile:', error);
            toast.error('Failed to load health profile');
        } finally {
            setLoading(false);
        }
    };

    // Auto-save with debounce
    const handleUpdate = async (updates) => {
        try {
            setAutoSaving(true);
            const updatedProfile = { ...healthProfile, ...updates };
            setHealthProfile(updatedProfile);

            // Debounced save
            if (window.autoSaveTimeout) {
                clearTimeout(window.autoSaveTimeout);
            }

            window.autoSaveTimeout = setTimeout(async () => {
                try {
                    const { data } = await axios.put(
                        `${backendUrl}/api/health/update`,
                        { userId: userData._id, ...updatedProfile },
                        { headers: { token } }
                    );

                    if (data.success) {
                        setHealthProfile(data.profile);
                        setLastUpdated(data.profile.lastUpdated);
                        toast.success('Saved', { autoClose: 1000 });
                    }
                } catch (error) {
                    console.error('Error saving health profile:', error);
                    toast.error('Failed to save');
                } finally {
                    setAutoSaving(false);
                }
            }, 500);
        } catch (error) {
            console.error('Error updating health profile:', error);
            setAutoSaving(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Please login to access your health profile</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading health profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Health Profile</h1>
                <p className="text-gray-600 mt-2">
                    Manage your comprehensive health information for better care
                </p>

                {/* Auto-save indicator */}
                <div className="mt-4 flex items-center gap-4">
                    {autoSaving && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Saving...</span>
                        </div>
                    )}
                    {lastUpdated && !autoSaving && (
                        <div className="text-sm text-gray-500">
                            Last updated: {new Date(lastUpdated).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
                <div className="flex border-b">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >

                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                {activeTab === 'overview' && (
                    <OverviewTab profile={healthProfile} onUpdate={handleUpdate} />
                )}
                {activeTab === 'symptoms' && (
                    <SymptomsTab profile={healthProfile} onUpdate={handleUpdate} />
                )}
                {activeTab === 'vitals' && (
                    <VitalsTab profile={healthProfile} onUpdate={handleUpdate} />
                )}
                {activeTab === 'conditions' && (
                    <ConditionsTab profile={healthProfile} onUpdate={handleUpdate} />
                )}
                {activeTab === 'history' && (
                    <HistoryTab profile={healthProfile} onUpdate={handleUpdate} />
                )}
                {activeTab === 'medications' && (
                    <MedicationsTab profile={healthProfile} onUpdate={handleUpdate} />
                )}
                {activeTab === 'reports' && (
                    <ReportsTab profile={healthProfile} onUpdate={loadHealthProfile} />
                )}
                {activeTab === 'priority' && (
                    <PriorityScoreTab profile={healthProfile} />
                )}
            </div>
        </div>
    );
};

export default Health;
