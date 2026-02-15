import React from 'react';

// Severity color mapping
const severityColors = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Emergency: 'bg-red-100 text-red-800 border-red-200'
};

const severityIcons = {
    Low: '●',
    Medium: '●',
    High: '●',
    Emergency: '●'
};

const QueueCard = ({
    appointment,
    type = 'patient', // 'patient' or 'doctor'
    onComplete,
    onCancel,
    isCurrentPatient
}) => {
    const {
        _id,
        userData,
        slotDate,
        slotTime,
        severity = 'Low',
        symptoms = '',
        queuePosition = 0,
        estimatedWait = 'N/A',
        priorityScore = 0,
        tokenNumber = 0
    } = appointment;

    const formatDate = (slotDate) => {
        if (!slotDate) return '';
        const [day, month, year] = slotDate.split('_');
        return `${day}/${month}/${year}`;
    };

    const getSeverityColor = () => severityColors[severity] || severityColors.Low;
    const getSeverityIcon = () => severityIcons[severity] || severityIcons.Low;

    return (
        <div className={`
            relative overflow-hidden rounded-xl border transition-all duration-300
            ${isCurrentPatient
                ? 'border-2 border-primary bg-primary/5 shadow-lg shadow-primary/20'
                : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
            }
        `}>
            {/* Priority indicator bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

            <div className="p-4 pl-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Queue Position */}
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                            ${isCurrentPatient ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}
                        `}>
                            {queuePosition || '-'}
                        </div>

                        {/* Patient Info */}
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {userData?.name || 'Unknown Patient'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Token: #{tokenNumber}
                            </p>
                        </div>
                    </div>

                    {/* Severity Badge */}
                    <div className={`
                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border
                        ${getSeverityColor()}
                    `}>
                        <span>{getSeverityIcon()}</span>
                        <span>{severity}</span>
                    </div>
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="text-sm font-medium text-gray-800">
                            {formatDate(slotDate)} at {slotTime}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Estimated Wait</p>
                        <p className="text-sm font-medium text-gray-800">{estimatedWait}</p>
                    </div>
                </div>


                {/* Symptoms */}
                {appointment.symptoms && appointment.symptoms.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Symptoms</p>
                        <div className="flex flex-wrap gap-1">
                            {appointment.symptoms.slice(0, 4).map((symptom, idx) => (
                                <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    {symptom}
                                </span>
                            ))}
                            {appointment.symptoms.length > 4 && (
                                <span className="text-xs text-gray-500">+{appointment.symptoms.length - 4} more</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Vitals (Doctor View) */}
                {type === 'doctor' && appointment.vitals && appointment.vitals.systolicBP && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Vitals</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 rounded p-2">
                                <span className="text-gray-600">BP:</span>
                                <span className="ml-1 font-medium text-gray-800">
                                    {appointment.vitals.systolicBP}/{appointment.vitals.diastolicBP}
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                                <span className="text-gray-600">SpO2:</span>
                                <span className="ml-1 font-medium text-gray-800">
                                    {appointment.vitals.spo2}%
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                                <span className="text-gray-600">HR:</span>
                                <span className="ml-1 font-medium text-gray-800">
                                    {appointment.vitals.heartRate} bpm
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                                <span className="text-gray-600">Temp:</span>
                                <span className="ml-1 font-medium text-gray-800">
                                    {appointment.vitals.temperature}°F
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Wound Image */}
                {appointment.woundImage && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Wound Image</p>
                        <img
                            src={appointment.woundImage}
                            alt="Wound"
                            className="h-20 w-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                            onClick={() => window.open(appointment.woundImage, '_blank')}
                        />
                    </div>
                )}

                {/* ML Severity Scores (Doctor View) */}
                {type === 'doctor' && appointment.finalSeverityScore > 0 && (
                    <div className="mb-3 bg-purple-50 rounded-lg p-2">
                        <p className="text-xs text-purple-700 font-medium mb-1">🤖 AI Severity Analysis</p>
                        <div className="text-xs">
                            <span className="text-gray-600">Final Score: </span>
                            <span className="font-bold text-primary">{appointment.finalSeverityScore}/100</span>
                        </div>
                    </div>
                )}


                {/* Priority Score */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Priority Score:</span>
                        <span className="text-sm font-semibold text-gray-700">{priorityScore}</span>
                    </div>

                    {/* Action Buttons (Doctor View Only) */}
                    {type === 'doctor' && (
                        <div className="flex gap-2">
                            {onComplete && (
                                <button
                                    onClick={() => onComplete(_id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                                >
                                    Complete
                                </button>
                            )}
                            {onCancel && (
                                <button
                                    onClick={() => onCancel(_id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    )}

                    {/* Status (Patient View) */}
                    {type === 'patient' && isCurrentPatient && (
                        <div className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg">
                            🎯 Your Turn
                        </div>
                    )}
                </div>
            </div>

            {/* Emergency Glow Effect */}
            {severity === 'Emergency' && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 animate-pulse bg-primary/5 rounded-xl" />
                </div>
            )}
        </div>
    );
};

export default QueueCard;
