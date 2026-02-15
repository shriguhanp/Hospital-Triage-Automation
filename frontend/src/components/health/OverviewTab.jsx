import React from 'react';

const OverviewTab = ({ profile, onUpdate }) => {
    const handleChange = (field, value) => {
        onUpdate({ [field]: value });
    };

    // Auto-calculate BMI
    const handleHeightWeightChange = (field, value) => {
        const updates = { [field]: parseFloat(value) || 0 };

        if (field === 'height' || field === 'weight') {
            const height = field === 'height' ? parseFloat(value) : profile.height;
            const weight = field === 'weight' ? parseFloat(value) : profile.weight;

            if (height > 0 && weight > 0) {
                const heightInMeters = height / 100;
                updates.bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
            }
        }

        onUpdate(updates);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={profile.age || ''}
                        onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter your age"
                    />
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={profile.gender || 'Not Selected'}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="Not Selected">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Height */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                    </label>
                    <input
                        type="number"
                        value={profile.height || ''}
                        onChange={(e) => handleHeightWeightChange('height', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter height in cm"
                    />
                </div>

                {/* Weight */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                    </label>
                    <input
                        type="number"
                        value={profile.weight || ''}
                        onChange={(e) => handleHeightWeightChange('weight', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter weight in kg"
                    />
                </div>

                {/* BMI (readonly) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        BMI (Auto-calculated)
                    </label>
                    <input
                        type="text"
                        value={profile.bmi || 0}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                </div>

                {/* Blood Group */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group
                    </label>
                    <select
                        value={profile.bloodGroup || 'Unknown'}
                        onChange={(e) => handleChange('bloodGroup', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="Unknown">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                </div>

                {/* Pregnancy Status */}
                {profile.gender === 'Female' && (
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.pregnancyStatus || false}
                                onChange={(e) => handleChange('pregnancyStatus', e.target.checked)}
                                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-gray-700">Currently Pregnant</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverviewTab;
