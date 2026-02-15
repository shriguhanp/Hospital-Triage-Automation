import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const DoctorTiming = () => {

    const { dToken } = useContext(DoctorContext);
    const { backendUrl } = useContext(AppContext);

    const [workingHours, setWorkingHours] = useState({});
    const [avgConsultationTime, setAvgConsultationTime] = useState(15);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const fetchData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/working-hours', { headers: { dToken } });
            if (data.success) {
                setWorkingHours(data.workingHours || {});
                setAvgConsultationTime(data.avgConsultationTime || 15);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDayChange = (day, field, value) => {
        setWorkingHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { data } = await axios.post(
                backendUrl + '/api/doctor/update-working-hours',
                {
                    workingHours,
                    avgConsultationTime
                },
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (dToken) {
            fetchData();
        }
    }, [dToken]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className='w-full max-w-4xl m-5'>
            <div className="flex justify-between items-center mb-5">
                <h1 className='text-3xl font-medium'>Timing Management</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-8 py-2 rounded-full text-white font-medium transition-colors ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                        }`}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            <div className='bg-white border rounded shadow-sm p-6 mb-6'>
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Consultation Settings</h2>
                <div className="flex items-center gap-4">
                    <label className="text-gray-600">Average Consultation Time (minutes):</label>
                    <input
                        type="number"
                        min="5"
                        max="60"
                        value={avgConsultationTime}
                        onChange={(e) => setAvgConsultationTime(Number(e.target.value))}
                        className="border rounded px-3 py-2 w-24 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <span className="text-sm text-gray-500">
                        Used to calculate patient wait times.
                    </span>
                </div>
            </div>

            <div className='bg-white border rounded shadow-sm overflow-hidden'>
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-700">Weekly Schedule</h2>
                </div>

                <div className="divide-y divide-gray-100">
                    {days.map((day) => {
                        const dayConfig = workingHours[day] || { isWorking: false, startTime: '09:00', endTime: '17:00' };

                        return (
                            <div key={day} className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between ${!dayConfig.isWorking ? 'opacity-60 bg-gray-50' : ''}`}>
                                <div className="flex items-center gap-4 min-w-[150px]">
                                    <input
                                        type="checkbox"
                                        id={`check-${day}`}
                                        checked={dayConfig.isWorking}
                                        onChange={(e) => handleDayChange(day, 'isWorking', e.target.checked)}
                                        className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                                    />
                                    <label htmlFor={`check-${day}`} className="font-medium text-gray-700 cursor-pointer select-none">
                                        {day}
                                    </label>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Start:</span>
                                        <input
                                            type="time"
                                            value={dayConfig.startTime}
                                            onChange={(e) => handleDayChange(day, 'startTime', e.target.value)}
                                            disabled={!dayConfig.isWorking}
                                            className="border rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">End:</span>
                                        <input
                                            type="time"
                                            value={dayConfig.endTime}
                                            onChange={(e) => handleDayChange(day, 'endTime', e.target.value)}
                                            disabled={!dayConfig.isWorking}
                                            className="border rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="w-24 text-right">
                                    <span className={`text-xs px-2 py-1 rounded-full ${dayConfig.isWorking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {dayConfig.isWorking ? 'Open' : 'Closed'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DoctorTiming;
