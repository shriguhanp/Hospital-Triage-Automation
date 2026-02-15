import React, { useState } from 'react';

const SymptomsTab = ({ profile, onUpdate }) => {
    const [newSymptom, setNewSymptom] = useState('');

    const commonSymptoms = [
        'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
        'Chest Pain', 'Shortness of Breath', 'Dizziness', 'Abdominal Pain',
        'Back Pain', 'Joint Pain', 'Muscle Ache', 'Sore Throat'
    ];

    const addSymptom = (symptom) => {
        if (!profile.symptomTags.includes(symptom)) {
            onUpdate({ symptomTags: [...profile.symptomTags, symptom] });
        }
    };

    const removeSymptom = (symptom) => {
        onUpdate({ symptomTags: profile.symptomTags.filter(s => s !== symptom) });
    };

    const addCustomSymptom = () => {
        if (newSymptom.trim() && !profile.symptomTags.includes(newSymptom.trim())) {
            onUpdate({ symptomTags: [...profile.symptomTags, newSymptom.trim()] });
            setNewSymptom('');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Symptoms</h2>

            {/* Common Symptoms */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Common Symptoms (Click to add)
                </label>
                <div className="flex flex-wrap gap-2">
                    {commonSymptoms.map((symptom) => (
                        <button
                            key={symptom}
                            onClick={() => addSymptom(symptom)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${profile.symptomTags.includes(symptom)
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {symptom}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Symptom */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Custom Symptom
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Type custom symptom"
                    />
                    <button
                        onClick={addCustomSymptom}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Selected Symptoms */}
            {profile.symptomTags.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Selected Symptoms
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {profile.symptomTags.map((symptom) => (
                            <div
                                key={symptom}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full"
                            >
                                <span className="text-sm font-medium">{symptom}</span>
                                <button
                                    onClick={() => removeSymptom(symptom)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pain Level */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Level: <span className="text-primary font-bold">{profile.painLevel}/10</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="10"
                    value={profile.painLevel || 0}
                    onChange={(e) => onUpdate({ painLevel: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>No Pain</span>
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                    <span>Worst</span>
                </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (Value)
                    </label>
                    <input
                        type="number"
                        value={profile.duration?.value || 0}
                        onChange={(e) => onUpdate({
                            duration: { ...profile.duration, value: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (Unit)
                    </label>
                    <select
                        value={profile.duration?.unit || 'hours'}
                        onChange={(e) => onUpdate({
                            duration: { ...profile.duration, unit: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                    </select>
                </div>
            </div>

            {/* Critical Symptoms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={profile.sudden || false}
                        onChange={(e) => onUpdate({ sudden: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Sudden Onset</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={profile.worsening || false}
                        onChange={(e) => onUpdate({ worsening: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Worsening</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
                    <input
                        type="checkbox"
                        checked={profile.fever || false}
                        onChange={(e) => onUpdate({ fever: e.target.checked })}
                        className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-600"
                    />
                    <span className="text-sm font-medium text-red-700">Fever</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
                    <input
                        type="checkbox"
                        checked={profile.bleeding || false}
                        onChange={(e) => onUpdate({ bleeding: e.target.checked })}
                        className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-600"
                    />
                    <span className="text-sm font-medium text-red-700">Bleeding</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50 md:col-span-2">
                    <input
                        type="checkbox"
                        checked={profile.breathingDifficulty || false}
                        onChange={(e) => onUpdate({ breathingDifficulty: e.target.checked })}
                        className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-600"
                    />
                    <span className="text-sm font-medium text-red-700">Breathing Difficulty</span>
                </label>
            </div>
        </div>
    );
};

export default SymptomsTab;
