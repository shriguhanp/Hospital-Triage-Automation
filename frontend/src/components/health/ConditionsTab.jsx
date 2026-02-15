import React from 'react';

const ConditionsTab = ({ profile, onUpdate }) => {
    const handleConditionChange = (condition, checked) => {
        onUpdate({
            conditions: {
                ...profile.conditions,
                [condition]: checked
            }
        });
    };

    const conditions = [
        { id: 'diabetes', label: 'Diabetes' },
        { id: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
        { id: 'asthma', label: 'Asthma' },
        { id: 'heartDisease', label: 'Heart Disease' },
        { id: 'kidneyDisease', label: 'Kidney Disease' },
        { id: 'cancer', label: 'Cancer' },
        { id: 'strokeHistory', label: 'Stroke History' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Chronic Conditions</h2>
            <p className="text-gray-600">Select all conditions that apply to you</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conditions.map((condition) => (
                    <label
                        key={condition.id}
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <input
                            type="checkbox"
                            checked={profile.conditions?.[condition.id] || false}
                            onChange={(e) => handleConditionChange(condition.id, e.target.checked)}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />

                        <span className="text-sm font-medium text-gray-700">{condition.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default ConditionsTab;
