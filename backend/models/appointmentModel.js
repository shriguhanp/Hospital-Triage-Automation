import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    visibleToUser: { type: Boolean, default: true },

    // Medical Reports
    labReport: { type: String, default: '' },
    xRayImage: { type: String, default: '' },
    ecgData: { type: String, default: '' },
    woundImage: { type: String, default: '' },
    analysisData: { type: Object, default: {} },

    // Token & Priority fields
    tokenNumber: { type: Number, default: 0 },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Emergency'], default: 'Low' },
    priorityScore: { type: Number, default: 0 },
    patientAge: { type: Number, default: 0 },
    location: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    },

    // Health Intake Data for AI Triage
    hasHealthIntake: { type: Boolean, default: false },
    symptoms: { type: [String], default: [] }, // Changed to array
    symptomDuration: {
        type: String,
        enum: ['< 1 day', '1-3 days', '3-7 days', '> 7 days', ''],
        default: ''
    },
    existingDiseases: { type: [String], default: [] },
    vitals: {
        systolicBP: { type: Number, default: 0 },
        diastolicBP: { type: Number, default: 0 },
        spo2: { type: Number, default: 0 }, // SpO2 percentage
        heartRate: { type: Number, default: 0 },
        temperature: { type: Number, default: 0 } // in °F
    },
    woundImage: { type: String, default: '' }, // Cloudinary URL
    medicalReports: { type: [String], default: [] }, // Array of Cloudinary URLs

    // ML Severity Scores (0-100)
    structuredSeverityScore: { type: Number, default: 0 }, // From vitals + symptoms model
    imageSeverityScore: { type: Number, default: 0 }, // From wound image analysis
    finalSeverityScore: { type: Number, default: 0 }, // Weighted average
    mlProcessed: { type: Boolean, default: false }, // Flag to track if ML analysis completed

    // Health Profile Reference
    healthProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'healthProfile',
        default: null
    },

    // Other fields
    prescriptionId: { type: String, default: null },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    review: { type: String, default: '' }
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel