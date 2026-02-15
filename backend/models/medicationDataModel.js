import mongoose from 'mongoose';

const medicationDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // Medical Reports
    reports: [{
        fileName: String,
        fileUrl: String,
        description: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],

    // Medical Conditions
    conditions: [{
        condition: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],

    // Health Metrics History
    healthMetrics: [{
        bloodPressure: String,  // "120/80"
        heartRate: Number,
        temperature: Number,
        weight: Number,
        bloodSugar: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const medicationDataModel = mongoose.models.medicationdata || mongoose.model('medicationdata', medicationDataSchema);

export default medicationDataModel;
