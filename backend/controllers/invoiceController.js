/**
 * Invoice Controller
 * Handles invoice generation, retrieval, and email operations
 */

import invoiceModel from "../models/invoiceModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { createInvoice, getInvoiceByAppointment, resendInvoiceEmail } from "../services/invoiceService.js";

/**
 * Generate invoice for an appointment
 * POST /api/invoice/generate
 */
export const generateInvoice = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.json({ success: false, message: 'Appointment ID required' });
        }

        // Check if appointment exists
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Check if invoice already exists
        const existingInvoice = await invoiceModel.findOne({ appointmentId });
        if (existingInvoice) {
            return res.json({
                success: true,
                message: 'Invoice already exists',
                invoice: existingInvoice
            });
        }

        // Create invoice
        const invoiceData = await createInvoice(appointmentId);

        res.json({
            success: true,
            message: 'Invoice generated successfully',
            ...invoiceData
        });

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get invoice by appointment ID
 * GET /api/invoice/:appointmentId
 */
export const getInvoice = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const invoice = await getInvoiceByAppointment(appointmentId);

        if (!invoice) {
            return res.json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            invoice
        });

    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Download invoice PDF
 * GET /api/invoice/download/:invoiceId
 */
export const downloadInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await invoiceModel.findById(invoiceId);

        if (!invoice) {
            return res.json({ success: false, message: 'Invoice not found' });
        }

        if (!invoice.pdfUrl) {
            return res.json({ success: false, message: 'Invoice PDF not available' });
        }

        // Redirect to Cloudinary URL
        res.redirect(invoice.pdfUrl);

    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Resend invoice email
 * POST /api/invoice/resend-email
 */
export const resendEmail = async (req, res) => {
    try {
        const { invoiceId } = req.body;

        if (!invoiceId) {
            return res.json({ success: false, message: 'Invoice ID required' });
        }

        await resendInvoiceEmail(invoiceId);

        res.json({
            success: true,
            message: 'Invoice email resent successfully'
        });

    } catch (error) {
        console.error('Error resending invoice email:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get all invoices for a patient
 * GET /api/invoice/patient/:patientId
 */
export const getPatientInvoices = async (req, res) => {
    try {
        const { patientId } = req.params;

        const invoices = await invoiceModel.find({ patientId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            invoices
        });

    } catch (error) {
        console.error('Error fetching patient invoices:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Update invoice status (for payment tracking)
 * PUT /api/invoice/update-status
 */
export const updateInvoiceStatus = async (req, res) => {
    try {
        const { invoiceId, status, paymentMethod, transactionId } = req.body;

        if (!invoiceId || !status) {
            return res.json({ success: false, message: 'Invoice ID and status required' });
        }

        const invoice = await invoiceModel.findById(invoiceId);
        if (!invoice) {
            return res.json({ success: false, message: 'Invoice not found' });
        }

        invoice.status = status;
        if (paymentMethod) invoice.paymentMethod = paymentMethod;
        if (transactionId) invoice.transactionId = transactionId;

        await invoice.save();

        res.json({
            success: true,
            message: 'Invoice status updated',
            invoice
        });

    } catch (error) {
        console.error('Error updating invoice status:', error);
        res.json({ success: false, message: error.message });
    }
};

export default {
    generateInvoice,
    getInvoice,
    downloadInvoice,
    resendEmail,
    getPatientInvoices,
    updateInvoiceStatus
};
