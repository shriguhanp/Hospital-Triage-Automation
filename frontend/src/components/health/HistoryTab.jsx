import React, { useState } from 'react';

const HistoryTab = ({ profile, onUpdate }) => {
    const [newSurgery, setNewSurgery] = useState('');
    const [newAllergy, setNewAllergy] = useState('');
    const [newComplication, setNewComplication] = useState('');

    const addItem = (field, value, setter) => {
        if (value.trim()) {
            onUpdate({ [field]: [...(profile[field] || []), value.trim()] });
            setter('');
        }
    };

    const removeItem = (field, index) => {
        onUpdate({ [field]: profile[field].filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Medical History</h2>

            {/* Surgeries */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Surgeries</label>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newSurgery}
                        onChange={(e) => setNewSurgery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem('surgeries', newSurgery, setNewSurgery)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Appendectomy (2020)"
                    />
                    <button
                        onClick={() => addItem('surgeries', newSurgery, setNewSurgery)}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        Add
                    </button>
                </div>
                {profile.surgeries?.length > 0 && (
                    <div className="space-y-2">
                        {profile.surgeries.map((surgery, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm">{surgery}</span>
                                <button
                                    onClick={() => removeItem('surgeries', index)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Allergies */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem('allergies', newAllergy, setNewAllergy)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Penicillin, Peanuts"
                    />
                    <button
                        onClick={() => addItem('allergies', newAllergy, setNewAllergy)}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        Add
                    </button>
                </div>
                {profile.allergies?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {profile.allergies.map((allergy, index) => (
                            <div key={index} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                                <span className="text-sm font-medium">{allergy}</span>
                                <button
                                    onClick={() => removeItem('allergies', index)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Hospitalization */}
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                    type="checkbox"
                    checked={profile.recentHospitalization || false}
                    onChange={(e) => onUpdate({ recentHospitalization: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Recent Hospitalization (within 6 months)</span>
            </label>

            {/* ICU History */}
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                    type="checkbox"
                    checked={profile.icuHistory || false}
                    onChange={(e) => onUpdate({ icuHistory: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">ICU History</span>
            </label>

            {/* Pregnancy Complications */}
            {profile.gender === 'Female' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pregnancy Complications</label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newComplication}
                            onChange={(e) => setNewComplication(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addItem('pregnancyComplications', newComplication, setNewComplication)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., Gestational diabetes"
                        />
                        <button
                            onClick={() => addItem('pregnancyComplications', newComplication, setNewComplication)}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Add
                        </button>
                    </div>
                    {profile.pregnancyComplications?.length > 0 && (
                        <div className="space-y-2">
                            {profile.pregnancyComplications.map((complication, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm">{complication}</span>
                                    <button
                                        onClick={() => removeItem('pregnancyComplications', index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HistoryTab;
