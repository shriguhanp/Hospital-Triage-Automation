import React from 'react';

const VitalsTab = ({ profile, onUpdate }) => {
    const handleVitalChange = (field, value) => {
        onUpdate({
            vitals: {
                ...profile.vitals,
                [field]: parseFloat(value) || 0
            }
        });
    };

    const getVitalStatus = (field, value) => {
        const ranges = {
            systolicBP: { critical: [180, Infinity], warning: [140, 180], low: [0, 90] },
            diastolicBP: { critical: [120, Infinity], warning: [90, 120], low: [0, 60] },
            heartRate: { critical: [120, Infinity], warning: [100, 120], low: [0, 60] },
            spo2: { critical: [0, 92], warning: [92, 95] },
            temperature: { critical: [103, Infinity], warning: [100.4, 103], low: [0, 95] }
        };

        const range = ranges[field];
        if (!range) return 'normal';

        if (range.critical && value >= range.critical[0] && value <= range.critical[1]) return 'critical';
        if (range.warning && value >= range.warning[0] && value < range.warning[1]) return 'warning';
        if (range.low && value >= range.low[0] && value < range.low[1]) return 'critical';

        return 'normal';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return 'border-red-500 bg-red-50';
            case 'warning': return 'border-yellow-500 bg-yellow-50';
            default: return 'border-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Vitals</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Blood Pressure */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Blood Pressure (mmHg)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-2">Systolic (Top Number)</label>
                            <input
                                type="number"
                                value={profile.vitals?.systolicBP || ''}
                                onChange={(e) => handleVitalChange('systolicBP', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getStatusColor(getVitalStatus('systolicBP', profile.vitals?.systolicBP))
                                    }`}
                                placeholder="120"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-2">Diastolic (Bottom Number)</label>
                            <input
                                type="number"
                                value={profile.vitals?.diastolicBP || ''}
                                onChange={(e) => handleVitalChange('diastolicBP', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getStatusColor(getVitalStatus('diastolicBP', profile.vitals?.diastolicBP))
                                    }`}
                                placeholder="80"
                            />
                        </div>
                    </div>
                </div>

                {/* Heart Rate */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (bpm)
                    </label>
                    <input
                        type="number"
                        value={profile.vitals?.heartRate || ''}
                        onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getStatusColor(getVitalStatus('heartRate', profile.vitals?.heartRate))
                            }`}
                        placeholder="72"
                    />
                </div>

                {/* SpO2 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        SpO2 (%)
                    </label>
                    <input
                        type="number"
                        value={profile.vitals?.spo2 || ''}
                        onChange={(e) => handleVitalChange('spo2', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getStatusColor(getVitalStatus('spo2', profile.vitals?.spo2))
                            }`}
                        placeholder="98"
                        max="100"
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
                        value={profile.vitals?.temperature || ''}
                        onChange={(e) => handleVitalChange('temperature', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getStatusColor(getVitalStatus('temperature', profile.vitals?.temperature))
                            }`}
                        placeholder="98.6"
                    />
                </div>

                {/* Sugar Level */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Sugar (mg/dL)
                    </label>
                    <input
                        type="number"
                        value={profile.vitals?.sugarLevel || ''}
                        onChange={(e) => handleVitalChange('sugarLevel', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="100"
                    />
                </div>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Color Indicators:</p>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                        <span className="text-gray-600">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-50 rounded"></div>
                        <span className="text-gray-600">Warning</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-red-500 bg-red-50 rounded"></div>
                        <span className="text-gray-600">Critical</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VitalsTab;
