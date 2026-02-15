import React from 'react';

const MedicationsTab = ({ profile, onUpdate }) => {
    const handleMedicationChange = (medication, checked) => {
        onUpdate({
            medications: {
                ...profile.medications,
                [medication]: checked
            }
        });
    };

    const medications = [
        { id: 'bloodThinners', label: 'Blood Thinners', description: 'e.g., Warfarin, Aspirin' },
        { id: 'insulin', label: 'Insulin', description: 'For diabetes management' },
        { id: 'steroids', label: 'Steroids', description: 'e.g., Prednisone, Cortisone' },
        { id: 'chemotherapy', label: 'Chemotherapy', description: 'Cancer treatment medications' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Current Medications</h2>
            <p className="text-gray-600">Select high-risk medications you are currently taking</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map((medication) => (
                    <label
                        key={medication.id}
                        className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <input
                            type="checkbox"
                            checked={profile.medications?.[medication.id] || false}
                            onChange={(e) => handleMedicationChange(medication.id, e.target.checked)}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary mt-1"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">

                                <span className="text-sm font-medium text-gray-900">{medication.label}</span>
                            </div>
                            <p className="text-xs text-gray-500">{medication.description}</p>
                        </div>
                    </label>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This information helps healthcare providers assess your medical priority and avoid drug interactions.
                </p>
            </div>
        </div>
    );
};

export default MedicationsTab;
