import express from 'express';
import authUser from '../middleware/authUser.js';
import {
    generateInvoice,
    getInvoice,
    downloadInvoice,
    resendEmail,
    getPatientInvoices,
    updateInvoiceStatus
} from '../controllers/invoiceController.js';

const invoiceRouter = express.Router();

// Generate invoice for appointment
invoiceRouter.post('/generate', authUser, generateInvoice);

// Get invoice by appointment ID
invoiceRouter.get('/:appointmentId', authUser, getInvoice);

// Download invoice PDF
invoiceRouter.get('/download/:invoiceId', downloadInvoice);

// Resend invoice email
invoiceRouter.post('/resend-email', authUser, resendEmail);

// Get all invoices for a patient
invoiceRouter.get('/patient/:patientId', authUser, getPatientInvoices);

// Update invoice status
invoiceRouter.put('/update-status', authUser, updateInvoiceStatus);

export default invoiceRouter;
