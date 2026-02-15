import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const DoctorQueue = () => {

    const { dToken } = useContext(DoctorContext);
    const { backendUrl, slotDateFormat, calculateAge } = useContext(AppContext);

    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchQueue = async () => {
        try {
            // Format selected date to D_M_YYYY for backend
            const dateObj = new Date(selectedDate);
            const day = dateObj.getDate();
            const month = dateObj.getMonth() + 1;
            const year = dateObj.getFullYear();
            const formattedDate = `${day}_${month}_${year}`;

            const { data } = await axios.post(backendUrl + '/api/doctor/today-queue', { date: formattedDate }, { headers: { dToken } });

            if (data.success) {
                setQueue(data.queue);
                setCurrentDate(data.date.replace(/_/g, '/'));
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

    // Trigger fetch when selectedDate changes
    useEffect(() => {
        if (dToken) {
            fetchQueue();
        }
    }, [selectedDate, dToken]);

    const completeAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/complete-appointment', { appointmentId }, { headers: { dToken } });
            if (data.success) {
                toast.success(data.message);
                fetchQueue();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/cancel-appointment', { appointmentId }, { headers: { dToken } });
            if (data.success) {
                toast.success(data.message);
                fetchQueue();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (dToken) {
            fetchQueue();
            // Set up interval to refresh queue every minute
            const interval = setInterval(fetchQueue, 60000);
            return () => clearInterval(interval);
        }
    }, [dToken]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Emergency': return 'bg-red-100 text-red-800 border-red-200';
            case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'Emergency': return '🔴';
            case 'High': return '🟠';
            case 'Medium': return '🟡';
            default: return '🟢';
        }
    };

    return (
        <div className='w-full max-w-6xl m-5'>
            <div className="flex justify-between items-center mb-5">
                <h1 className='text-3xl font-medium'>Patient Queue</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-300">
                        <span className="text-gray-600 font-medium text-sm">Date:</span>
                        <input
                            type="date"
                            className="outline-none text-gray-700 bg-transparent text-sm"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={fetchQueue}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Refresh Queue"
                    >
                        <img className="w-5" src={assets.upload_area} alt="Refresh" />
                    </button>
                </div>
            </div>

            <div className='bg-white border rounded shadow-sm max-h-[80vh] overflow-y-scroll'>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : queue.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                        <p className="text-xl">No patients in queue for today</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {queue.map((item, index) => (
                            <div
                                key={index}
                                className={`p-6 hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-blue-50/50' : ''}`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Left: Queue Position & Patient Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`
                                            flex flex-col items-center justify-center w-16 h-16 rounded-xl text-white font-bold shadow-sm
                                            ${index === 0 ? 'bg-primary' : 'bg-gray-400'}
                                        `}>
                                            <span className="text-xs font-normal opacity-80">Queue</span>
                                            <span className="text-2xl">#{item.queuePosition}</span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-800">{item.userData.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityColor(item.severity)}`}>
                                                    {getSeverityIcon(item.severity)} {item.severity}
                                                </span>
                                                {item.priorityScore > 0 && (
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        Score: {item.priorityScore}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p className="flex items-center gap-2">
                                                    <span>Age: {calculateAge(item.userData.dob)}</span>
                                                    <span>•</span>
                                                    <span>Wait: <span className="font-medium text-primary">{item.estimatedWait}</span></span>
                                                    <span>•</span>
                                                    <span>Slot: {item.slotTime}</span>
                                                </p>
                                                {item.symptoms && item.symptoms.length > 0 && (
                                                    <p className="text-red-500 text-xs">
                                                        Symptoms: {item.symptoms.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => completeAppointment(item._id)}
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                                        >
                                            <img className="w-4 h-4 brightness-0 invert" src={assets.tick_icon} alt="" />
                                            Complete
                                        </button>
                                        <button
                                            onClick={() => cancelAppointment(item._id)}
                                            className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <img className="w-4 h-4" src={assets.cancel_icon} alt="" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded text-sm border border-blue-100 flex items-start gap-2">
                <span className="text-xl">ℹ️</span>
                <p>
                    <strong>Queue ordering:</strong> Patients are ordered by medical severity score (Emergency cases first), then by waiting time.
                    <br />
                    The estimated wait time is calculated based on your average consultation time.
                </p>
            </div>
        </div>
    );
};

export default DoctorQueue;
