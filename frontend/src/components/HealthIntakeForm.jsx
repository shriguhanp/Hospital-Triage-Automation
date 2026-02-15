import React, { useState } from 'react';
import { SYMPTOM_OPTIONS, DISEASE_OPTIONS, DURATION_OPTIONS } from '../utils/healthIntakeConstants';
import { assets } from '../assets/assets';

const HealthIntakeForm = ({ onSubmit, onSkip }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        symptoms: [],
        symptomDuration: '',
        existingDiseases: [],
        vitals: {
            systolicBP: '',
            diastolicBP: '',
            spo2: '',
            heartRate: '',
            temperature: ''
        },
        woundImage: null,
        woundImagePreview: null
    });

    const [errors, setErrors] = useState({});

    // Handle symptom selection
    const toggleSymptom = (symptom) => {
        setFormData(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter(s => s !== symptom)
                : [...prev.symptoms, symptom]
        }));
    };

    // Handle disease selection
    const toggleDisease = (disease) => {
        setFormData(prev => ({
            ...prev,
            existingDiseases: prev.existingDiseases.includes(disease)
                ? prev.existingDiseases.filter(d => d !== disease)
                : [...prev.existingDiseases, disease]
        }));
    };

    // Handle vitals input
    const handleVitalChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            vitals: {
                ...prev.vitals,
                [field]: value
            }
        }));
    };

    // Handle wound image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5000000) { // 5MB limit
                setErrors({ ...errors, woundImage: 'Image size should be less than 5MB' });
                return;
            }
            setFormData(prev => ({
                ...prev,
                woundImage: file,
                woundImagePreview: URL.createObjectURL(file)
            }));
            setErrors({ ...errors, woundImage: null });
        }
    };

    // Validate current step
    const validateStep = () => {
        const newErrors = {};

        if (step === 1) {
            if (formData.symptoms.length === 0) {
                newErrors.symptoms = 'Please select at least one symptom';
            }
        }

        if (step === 2) {
            if (!formData.symptomDuration) {
                newErrors.symptomDuration = 'Please select symptom duration';
            }
        }

        if (step === 3) {
            const { systolicBP, diastolicBP, spo2, heartRate, temperature } = formData.vitals;
            if (!systolicBP || !diastolicBP || !spo2 || !heartRate || !temperature) {
                newErrors.vitals = 'Please fill in all vital signs';
            }
            // Range validation
            if (systolicBP && (systolicBP < 70 || systolicBP > 250)) {
                newErrors.systolicBP = 'Systolic BP should be between 70-250';
            }
            if (diastolicBP && (diastolicBP < 40 || diastolicBP > 150)) {
                newErrors.diastolicBP = 'Diastolic BP should be between 40-150';
            }
            if (spo2 && (spo2 < 70 || spo2 > 100)) {
                newErrors.spo2 = 'SpO2 should be between 70-100%';
            }
            if (heartRate && (heartRate < 30 || heartRate > 220)) {
                newErrors.heartRate = 'Heart rate should be between 30-220';
            }
            if (temperature && (temperature < 90 || temperature > 110)) {
                newErrors.temperature = 'Temperature should be between 90-110°F';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Next step
    const nextStep = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    // Previous step
    const prevStep = () => {
        setStep(step - 1);
        setErrors({});
    };

    // Submit form
    const handleSubmit = () => {
        if (step === 4 || validateStep()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`flex-1 text-center ${s === step ? 'text-primary font-semibold' : 'text-gray-400'}`}>
                            Step {s}
                        </div>
                    ))}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Step 1: Symptoms */}
            {step === 1 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Select Your Symptoms</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {SYMPTOM_OPTIONS.map((symptom) => (
                            <label key={symptom} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.symptoms.includes(symptom)}
                                    onChange={() => toggleSymptom(symptom)}
                                    className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm">{symptom}</span>
                            </label>
                        ))}
                    </div>
                    {errors.symptoms && <p className="text-primary text-sm mt-2">{errors.symptoms}</p>}
                </div>
            )}

            {/* Step 2: Duration & Diseases */}
            {step === 2 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Additional Information</h3>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">How long have you had these symptoms?</label>
                        <div className="space-y-2">
                            {DURATION_OPTIONS.map((duration) => (
                                <label key={duration} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="duration"
                                        checked={formData.symptomDuration === duration}
                                        onChange={() => setFormData({ ...formData, symptomDuration: duration })}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <span className="text-sm">{duration}</span>
                                </label>
                            ))}
                        </div>
                        {errors.symptomDuration && <p className="text-primary text-sm mt-2">{errors.symptomDuration}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Existing Medical Conditions (if any)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {DISEASE_OPTIONS.map((disease) => (
                                <label key={disease} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.existingDiseases.includes(disease)}
                                        onChange={() => toggleDisease(disease)}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <span className="text-sm">{disease}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Vitals */}
            {step === 3 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Vital Signs</h3>
                    <p className="text-sm text-gray-600 mb-4">Please enter your current vital signs. If you don't have a measurement device, provide your best estimate.</p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Systolic BP (mmHg)</label>
                                <input
                                    type="number"
                                    value={formData.vitals.systolicBP}
                                    onChange={(e) => handleVitalChange('systolicBP', e.target.value)}
                                    placeholder="120"
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                                {errors.systolicBP && <p className="text-primary text-xs mt-1">{errors.systolicBP}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Diastolic BP (mmHg)</label>
                                <input
                                    type="number"
                                    value={formData.vitals.diastolicBP}
                                    onChange={(e) => handleVitalChange('diastolicBP', e.target.value)}
                                    placeholder="80"
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                                {errors.diastolicBP && <p className="text-primary text-xs mt-1">{errors.diastolicBP}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">SpO2 - Oxygen Saturation (%)</label>
                            <input
                                type="number"
                                value={formData.vitals.spo2}
                                onChange={(e) => handleVitalChange('spo2', e.target.value)}
                                placeholder="98"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                            {errors.spo2 && <p className="text-primary text-xs mt-1">{errors.spo2}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Heart Rate (bpm)</label>
                            <input
                                type="number"
                                value={formData.vitals.heartRate}
                                onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                                placeholder="75"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                            {errors.heartRate && <p className="text-primary text-xs mt-1">{errors.heartRate}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Body Temperature (°F)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.vitals.temperature}
                                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                                placeholder="98.6"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                            {errors.temperature && <p className="text-primary text-xs mt-1">{errors.temperature}</p>}
                        </div>
                    </div>
                    {errors.vitals && <p className="text-primary text-sm mt-2">{errors.vitals}</p>}
                </div>
            )}

            {/* Step 4: Optional Image Upload */}
            {step === 4 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Upload Wound/Injury Image (Optional)</h3>
                    <p className="text-sm text-gray-600 mb-4">If you have any visible wound or injury, uploading an image can help in better assessment.</p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="wound-image-upload"
                        />
                        <label htmlFor="wound-image-upload" className="cursor-pointer">
                            {formData.woundImagePreview ? (
                                <div>
                                    <img src={formData.woundImagePreview} alt="Wound preview" className="max-h-64 mx-auto rounded-lg mb-2" />
                                    <p className="text-sm text-primary">Click to change image</p>
                                </div>
                            ) : (
                                <div>
                                    <img src={assets.upload_icon || '/upload-icon.svg'} alt="Upload" className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                    <p className="text-gray-600">Click to upload image</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                </div>
                            )}
                        </label>
                    </div>
                    {errors.woundImage && <p className="text-primary text-sm mt-2">{errors.woundImage}</p>}
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
                <div>
                    {step > 1 && (
                        <button
                            onClick={prevStep}
                            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Back
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onSkip}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Skip Health Intake
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                            Submit & Book Appointment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthIntakeForm;
