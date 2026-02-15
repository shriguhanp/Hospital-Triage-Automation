import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: true,
        unique: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: true
    },

    // Invoice Details
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    bookingDate: { type: Date, default: Date.now },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },

    // Patient Info (cached for invoice)
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, default: '' },
    patientAge: { type: Number, default: 0 },

    // Doctor Info (cached for invoice)
    doctorName: { type: String, required: true },
    doctorSpeciality: { type: String, default: '' },
    doctorHospital: { type: String, default: '' },

    // Priority Information
    priorityLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    priorityScore: { type: Number, default: 0 },
    queuePosition: { type: Number, default: 0 },

    // Payment
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'],
        default: 'PENDING'
    },
    paymentMethod: { type: String, default: '' },
    transactionId: { type: String, default: '' },

    // PDF Storage
    pdfUrl: { type: String, default: '' },
    pdfCloudinaryId: { type: String, default: '' },

    // Email Tracking
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    emailAttempts: { type: Number, default: 0 },
    lastEmailError: { type: String, default: '' },

    // Additional Info
    notes: { type: String, default: '' },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' }
}, {
    timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const prefix = process.env.INVOICE_PREFIX || 'INV';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.invoiceNumber = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

const invoiceModel = mongoose.models.invoice || mongoose.model("invoice", invoiceSchema);
export default invoiceModel;
