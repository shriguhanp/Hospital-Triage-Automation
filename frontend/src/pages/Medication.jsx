import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Medication = () => {
    const { backendUrl, token, userData } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('reports');

    // Medical Reports State
    const [reportFiles, setReportFiles] = useState([]);
    const [reportDescription, setReportDescription] = useState('');
    const [uploadedReports, setUploadedReports] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Medical Condition State
    const [condition, setCondition] = useState('');
    const [conditionHistory, setConditionHistory] = useState([]);
    const [savingCondition, setSavingCondition] = useState(false);

    // Health Tracking State
    const [healthMetrics, setHealthMetrics] = useState({
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        temperature: '',
        weight: '',
        bloodSugar: ''
    });
    const [healthHistory, setHealthHistory] = useState([]);
    const [savingMetrics, setSavingMetrics] = useState(false);

    // Fetch user's medical data on load
    useEffect(() => {
        if (token && userData?._id) {
            fetchMedicalData();
        }
    }, [token, userData]);

    const fetchMedicalData = async () => {
        try {
            const { data } = await axios.get(
                backendUrl + `/api/medication/user-data/${userData._id}`,
                { headers: { token } }
            );

            if (data.success) {
                setUploadedReports(data.reports || []);
                setConditionHistory(data.conditions || []);
                setHealthHistory(data.healthMetrics || []);
            }
        } catch (error) {
            console.error('Error fetching medical data:', error);
        }
    };

    // Handle report file selection
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setReportFiles(files);
    };

    // Upload medical reports
    const handleReportUpload = async () => {
        if (reportFiles.length === 0) {
            toast.warning('Please select at least one file');
            return;
        }

        setUploading(true);
        const formData = new FormData();

        reportFiles.forEach((file) => {
            formData.append('reports', file);
        });
        formData.append('description', reportDescription);
        formData.append('userId', userData._id);

        try {
            const { data } = await axios.post(
                backendUrl + '/api/medication/upload-reports',
                formData,
                {
                    headers: {
                        token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (data.success) {
                toast.success('Reports uploaded successfully!');
                setReportFiles([]);
                setReportDescription('');
                fetchMedicalData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload reports');
        } finally {
            setUploading(false);
        }
    };

    // Save medical condition
    const handleConditionSave = async () => {
        if (!condition.trim()) {
            toast.warning('Please enter your medical condition');
            return;
        }

        setSavingCondition(true);
        try {
            const { data } = await axios.post(
                backendUrl + '/api/medication/add-condition',
                {
                    userId: userData._id,
                    condition: condition.trim()
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Condition saved!');
                setCondition('');
                fetchMedicalData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save condition');
        } finally {
            setSavingCondition(false);
        }
    };

    // Save health metrics
    const handleMetricsSave = async () => {
        const { bloodPressure, heartRate, temperature, weight, bloodSugar } = healthMetrics;

        if (!bloodPressure.systolic && !heartRate && !temperature && !weight && !bloodSugar) {
            toast.warning('Please enter at least one health metric');
            return;
        }

        setSavingMetrics(true);
        try {
            const { data } = await axios.post(
                backendUrl + '/api/medication/add-health-metrics',
                {
                    userId: userData._id,
                    metrics: {
                        bloodPressure: bloodPressure.systolic ?
                            `${bloodPressure.systolic}/${bloodPressure.diastolic}` : null,
                        heartRate: heartRate ? Number(heartRate) : null,
                        temperature: temperature ? Number(temperature) : null,
                        weight: weight ? Number(weight) : null,
                        bloodSugar: bloodSugar ? Number(bloodSugar) : null
                    }
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Health metrics saved!');
                setHealthMetrics({
                    bloodPressure: { systolic: '', diastolic: '' },
                    heartRate: '',
                    temperature: '',
                    weight: '',
                    bloodSugar: ''
                });
                fetchMedicalData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save metrics');
        } finally {
            setSavingMetrics(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">

                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Login Required</h2>
                    <p className="text-gray-500">Please login to access medication tracking.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication & Health Tracker</h1>
                    <p className="text-gray-600">Manage your medical reports, track conditions, and monitor health metrics</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {['reports', 'conditions', 'tracking'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === tab
                                ? 'text-primary'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab === 'reports' ? 'Medical Reports' :
                                tab === 'conditions' ? 'Conditions' :
                                    'Health Tracking'}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Medical Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="grid gap-6">
                        {/* Upload Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Medical Reports</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Files (PDF, Images)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileSelect}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    {reportFiles.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            {reportFiles.length} file(s) selected
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={reportDescription}
                                        onChange={(e) => setReportDescription(e.target.value)}
                                        placeholder="E.g., Blood test results from Jan 2026"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={handleReportUpload}
                                    disabled={uploading || reportFiles.length === 0}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Reports'}
                                </button>
                            </div>
                        </div>

                        {/* Uploaded Reports List */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Medical Reports</h2>

                            {uploadedReports.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No reports uploaded yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {uploadedReports.map((report, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl"></span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{report.fileName || `Report ${idx + 1}`}</p>
                                                    <p className="text-sm text-gray-500">{report.description || 'No description'}</p>
                                                    <p className="text-xs text-gray-400">{new Date(report.uploadDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={report.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
                                            >
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Medical Conditions Tab */}
                {activeTab === 'conditions' && (
                    <div className="grid gap-6">
                        {/* Add Condition */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Medical Condition</h2>

                            <div className="space-y-4">
                                <textarea
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                    placeholder="Describe your medical condition, symptoms, or diagnosis..."
                                    rows={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />

                                <button
                                    onClick={handleConditionSave}
                                    disabled={savingCondition || !condition.trim()}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {savingCondition ? 'Saving...' : 'Save Condition'}
                                </button>
                            </div>
                        </div>

                        {/* Condition History */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Condition History</h2>

                            {conditionHistory.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No conditions recorded yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {conditionHistory.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
                                            <p className="text-sm text-gray-500 mb-1">
                                                {new Date(item.date).toLocaleString()}
                                            </p>
                                            <p className="text-gray-800">{item.condition}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Health Tracking Tab */}
                {activeTab === 'tracking' && (
                    <div className="grid gap-6">
                        {/* Add Metrics */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Health Metrics</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* Blood Pressure */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Blood Pressure (mmHg)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Systolic"
                                            value={healthMetrics.bloodPressure.systolic}
                                            onChange={(e) => setHealthMetrics({
                                                ...healthMetrics,
                                                bloodPressure: { ...healthMetrics.bloodPressure, systolic: e.target.value }
                                            })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                        <span className="flex items-center">/</span>
                                        <input
                                            type="number"
                                            placeholder="Diastolic"
                                            value={healthMetrics.bloodPressure.diastolic}
                                            onChange={(e) => setHealthMetrics({
                                                ...healthMetrics,
                                                bloodPressure: { ...healthMetrics.bloodPressure, diastolic: e.target.value }
                                            })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Heart Rate */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Heart Rate (bpm)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="75"
                                        value={healthMetrics.heartRate}
                                        onChange={(e) => setHealthMetrics({ ...healthMetrics, heartRate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>

                                {/* Temperature */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Temperature (°F)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="98.6"
                                        value={healthMetrics.temperature}
                                        onChange={(e) => setHealthMetrics({ ...healthMetrics, temperature: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>

                                {/* Weight */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="70"
                                        value={healthMetrics.weight}
                                        onChange={(e) => setHealthMetrics({ ...healthMetrics, weight: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>

                                {/* Blood Sugar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Blood Sugar (mg/dL)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={healthMetrics.bloodSugar}
                                        onChange={(e) => setHealthMetrics({ ...healthMetrics, bloodSugar: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleMetricsSave}
                                disabled={savingMetrics}
                                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {savingMetrics ? 'Saving...' : 'Save Metrics'}
                            </button>
                        </div>

                        {/* Health History */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Metrics History</h2>

                            {healthHistory.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No health metrics recorded yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {healthHistory.slice(0, 10).map((entry, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-2">
                                                {new Date(entry.date).toLocaleString()}
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                {entry.bloodPressure && (
                                                    <div>
                                                        <span className="text-gray-600">BP: </span>
                                                        <span className="font-medium text-gray-900">{entry.bloodPressure}</span>
                                                    </div>
                                                )}
                                                {entry.heartRate && (
                                                    <div>
                                                        <span className="text-gray-600">HR: </span>
                                                        <span className="font-medium text-gray-900">{entry.heartRate} bpm</span>
                                                    </div>
                                                )}
                                                {entry.temperature && (
                                                    <div>
                                                        <span className="text-gray-600">Temp: </span>
                                                        <span className="font-medium text-gray-900">{entry.temperature}°F</span>
                                                    </div>
                                                )}
                                                {entry.weight && (
                                                    <div>
                                                        <span className="text-gray-600">Weight: </span>
                                                        <span className="font-medium text-gray-900">{entry.weight} kg</span>
                                                    </div>
                                                )}
                                                {entry.bloodSugar && (
                                                    <div>
                                                        <span className="text-gray-600">Sugar: </span>
                                                        <span className="font-medium text-gray-900">{entry.bloodSugar} mg/dL</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Medication;
