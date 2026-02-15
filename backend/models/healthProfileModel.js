import mongoose from "mongoose";

const healthProfileSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },

    // Overview
    age: { type: Number, default: 0 },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Not Selected'], default: 'Not Selected' },
    height: { type: Number, default: 0 }, // in cm
    weight: { type: Number, default: 0 }, // in kg
    bmi: { type: Number, default: 0 }, // auto-calculated
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], default: 'Unknown' },
    pregnancyStatus: { type: Boolean, default: false },

    // Symptoms
    symptomTags: { type: [String], default: [] },
    painLevel: { type: Number, min: 0, max: 10, default: 0 },
    duration: {
        value: { type: Number, default: 0 },
        unit: { type: String, enum: ['minutes', 'hours', 'days', 'weeks'], default: 'hours' }
    },
    sudden: { type: Boolean, default: false },
    worsening: { type: Boolean, default: false },
    fever: { type: Boolean, default: false },
    bleeding: { type: Boolean, default: false },
    breathingDifficulty: { type: Boolean, default: false },

    // Vitals
    vitals: {
        systolicBP: { type: Number, default: 0 },
        diastolicBP: { type: Number, default: 0 },
        heartRate: { type: Number, default: 0 },
        spo2: { type: Number, default: 0 },
        temperature: { type: Number, default: 0 }, // in °F
        sugarLevel: { type: Number, default: 0 } // mg/dL
    },

    // Conditions (checkboxes)
    conditions: {
        diabetes: { type: Boolean, default: false },
        hypertension: { type: Boolean, default: false },
        asthma: { type: Boolean, default: false },
        heartDisease: { type: Boolean, default: false },
        kidneyDisease: { type: Boolean, default: false },
        cancer: { type: Boolean, default: false },
        strokeHistory: { type: Boolean, default: false }
    },

    // History
    surgeries: { type: [String], default: [] },
    recentHospitalization: { type: Boolean, default: false }, // within 6 months
    icuHistory: { type: Boolean, default: false },
    allergies: { type: [String], default: [] },
    pregnancyComplications: { type: [String], default: [] },

    // Medications
    medications: {
        bloodThinners: { type: Boolean, default: false },
        insulin: { type: Boolean, default: false },
        steroids: { type: Boolean, default: false },
        chemotherapy: { type: Boolean, default: false }
    },

    // Reports (Cloudinary URLs + Analysis)
    reports: {
        woundImages: [{
            url: String,
            analysis: Object,
            uploadedAt: { type: Date, default: Date.now }
        }],
        labReportPDFs: [{
            url: String,
            analysis: Object, // Placeholder for future PDF analysis
            uploadedAt: { type: Date, default: Date.now }
        }],
        xrayImages: [{
            url: String,
            analysis: Object,
            uploadedAt: { type: Date, default: Date.now }
        }],
        ecgCSVs: [{
            url: String,
            analysis: Object,
            uploadedAt: { type: Date, default: Date.now }
        }]
    },

    // Priority Score (readonly, calculated)
    priorityScore: { type: Number, default: 0, min: 0, max: 100 },
    priorityLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    colorCode: { type: String, default: '#10B981' }, // green for LOW

    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Auto-calculate BMI before saving
healthProfileSchema.pre('save', function (next) {
    if (this.height > 0 && this.weight > 0) {
        const heightInMeters = this.height / 100;
        this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }
    this.lastUpdated = Date.now();
    next();
});

const healthProfileModel = mongoose.models.healthProfile || mongoose.model("healthProfile", healthProfileSchema);
export default healthProfileModel;
