/**
 * Invoice Service
 * Handles PDF generation and email delivery for appointment invoices
 */

import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import invoiceModel from '../models/invoiceModel.js';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import { sendInvoiceEmail } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate invoice PDF for an appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateInvoicePDF = async (appointmentId) => {
    try {
        // Get appointment details
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Get patient and doctor details
        const patient = await userModel.findById(appointment.userId).select('-password');
        const doctor = await doctorModel.findById(appointment.docId).select('-password');

        // Get or create invoice record
        let invoice = await invoiceModel.findOne({ appointmentId });
        if (!invoice) {
            invoice = new invoiceModel({
                appointmentId,
                patientId: appointment.userId,
                doctorId: appointment.docId,
                appointmentDate: appointment.slotDate,
                appointmentTime: appointment.slotTime,
                patientName: patient.name,
                patientEmail: patient.email,
                patientPhone: patient.phone,
                patientAge: appointment.patientAge || 0,
                doctorName: doctor.name,
                doctorSpeciality: doctor.speciality,
                doctorHospital: doctor.hospital || '',
                priorityLevel: appointment.severity || 'LOW',
                priorityScore: appointment.finalSeverityScore || appointment.priorityScore || 0,
                queuePosition: 0, // Will be calculated
                amount: appointment.amount
            });
            await invoice.save();
        }

        // Calculate queue position
        const allAppointments = await appointmentModel.find({
            docId: appointment.docId,
            cancelled: false,
            isCompleted: false
        }).sort({ finalSeverityScore: -1, date: 1 });

        const queuePosition = allAppointments.findIndex(apt =>
            apt._id.toString() === appointmentId.toString()
        ) + 1;

        // Update invoice with queue position
        invoice.queuePosition = queuePosition;
        await invoice.save();

        // Create PDF
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('APPOINTMENT INVOICE', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(`Invoice #${invoice.invoiceNumber}`, { align: 'center' });
            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Priority Badge
            const priorityColors = {
                'LOW': '#10B981',
                'MEDIUM': '#F59E0B',
                'HIGH': '#F97316',
                'CRITICAL': '#EF4444'
            };
            const priorityColor = priorityColors[invoice.priorityLevel] || '#10B981';

            doc.fontSize(12).font('Helvetica-Bold').text('Priority Status:', 50, doc.y);
            doc.fontSize(16).fillColor(priorityColor).text(invoice.priorityLevel, 200, doc.y - 15);
            doc.fillColor('#000000');
            doc.fontSize(10).font('Helvetica').text(`Score: ${invoice.priorityScore}/100`, 200, doc.y);
            doc.moveDown(1.5);

            // Patient Information
            doc.fontSize(14).font('Helvetica-Bold').text('Patient Information', 50, doc.y);
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Name: ${invoice.patientName}`, 50, doc.y);
            doc.text(`Email: ${invoice.patientEmail}`, 50, doc.y);
            doc.text(`Phone: ${invoice.patientPhone || 'N/A'}`, 50, doc.y);
            if (invoice.patientAge > 0) {
                doc.text(`Age: ${invoice.patientAge} years`, 50, doc.y);
            }
            doc.moveDown(1);

            // Doctor Information
            doc.fontSize(14).font('Helvetica-Bold').text('Doctor Information', 50, doc.y);
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Name: Dr. ${invoice.doctorName}`, 50, doc.y);
            doc.text(`Speciality: ${invoice.doctorSpeciality}`, 50, doc.y);
            if (invoice.doctorHospital) {
                doc.text(`Hospital: ${invoice.doctorHospital}`, 50, doc.y);
            }
            doc.moveDown(1);

            // Appointment Details
            doc.fontSize(14).font('Helvetica-Bold').text('Appointment Details', 50, doc.y);
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Date: ${invoice.appointmentDate.replace(/_/g, '/')}`, 50, doc.y);
            doc.text(`Time: ${invoice.appointmentTime}`, 50, doc.y);
            doc.text(`Queue Position: #${invoice.queuePosition}`, 50, doc.y);
            doc.text(`Booking ID: ${appointment._id}`, 50, doc.y);
            doc.moveDown(1);

            // Payment Information
            doc.fontSize(14).font('Helvetica-Bold').text('Payment Information', 50, doc.y);
            doc.moveDown(0.5);

            // Table header
            const tableTop = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Description', 50, tableTop);
            doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });

            // Table line
            doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

            // Table content
            doc.fontSize(10).font('Helvetica');
            doc.text('Consultation Fee', 50, tableTop + 30);
            doc.text(`₹${invoice.amount}`, 400, tableTop + 30, { width: 100, align: 'right' });

            // Total line
            doc.moveTo(50, tableTop + 50).lineTo(550, tableTop + 50).stroke();

            // Total
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Total Amount', 50, tableTop + 60);
            doc.text(`₹${invoice.amount}`, 400, tableTop + 60, { width: 100, align: 'right' });

            doc.moveDown(3);

            // Footer
            doc.fontSize(8).font('Helvetica').fillColor('#666666');
            doc.text('This is a computer-generated invoice and does not require a signature.', 50, 700, { align: 'center' });
            doc.text('For any queries, please contact our support team.', 50, 715, { align: 'center' });

            // Booking date
            doc.text(`Generated on: ${new Date(invoice.bookingDate).toLocaleString()}`, 50, 750, { align: 'center' });

            doc.end();
        });
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        throw error;
    }
};

/**
 * Upload invoice PDF to Cloudinary
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} invoiceNumber - Invoice number for filename
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadInvoiceToCloudinary = async (pdfBuffer, invoiceNumber) => {
    try {
        // Create temporary file
        const tempDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, `${invoiceNumber}.pdf`);
        fs.writeFileSync(tempFilePath, pdfBuffer);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: 'raw',
            folder: 'invoices',
            public_id: invoiceNumber,
            format: 'pdf'
        });

        // Delete temporary file
        fs.unlinkSync(tempFilePath);

        return result;
    } catch (error) {
        console.error('Error uploading invoice to Cloudinary:', error);
        throw error;
    }
};

/**
 * Create complete invoice (generate PDF, upload, send email)
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - Invoice data with PDF URL
 */
export const createInvoice = async (appointmentId) => {
    try {
        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(appointmentId);

        // Get invoice record
        const invoice = await invoiceModel.findOne({ appointmentId });
        if (!invoice) {
            throw new Error('Invoice record not found');
        }

        // Upload to Cloudinary
        const uploadResult = await uploadInvoiceToCloudinary(pdfBuffer, invoice.invoiceNumber);

        // Update invoice with PDF URL
        invoice.pdfUrl = uploadResult.secure_url;
        invoice.pdfCloudinaryId = uploadResult.public_id;
        await invoice.save();

        // Send email
        try {
            await sendInvoiceEmail(
                invoice.patientEmail,
                invoice.patientName,
                invoice.invoiceNumber,
                invoice.pdfUrl,
                {
                    doctorName: invoice.doctorName,
                    appointmentDate: invoice.appointmentDate.replace(/_/g, '/'),
                    appointmentTime: invoice.appointmentTime,
                    amount: invoice.amount,
                    priorityLevel: invoice.priorityLevel,
                    queuePosition: invoice.queuePosition
                }
            );

            invoice.emailSent = true;
            invoice.emailSentAt = new Date();
            await invoice.save();
        } catch (emailError) {
            console.error('Error sending invoice email:', emailError);
            invoice.emailAttempts += 1;
            invoice.lastEmailError = emailError.message;
            await invoice.save();
        }

        return {
            success: true,
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            pdfUrl: invoice.pdfUrl,
            emailSent: invoice.emailSent
        };
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
};

/**
 * Get invoice by appointment ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} - Invoice data
 */
export const getInvoiceByAppointment = async (appointmentId) => {
    try {
        const invoice = await invoiceModel.findOne({ appointmentId });
        return invoice;
    } catch (error) {
        console.error('Error getting invoice:', error);
        throw error;
    }
};

/**
 * Resend invoice email
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<boolean>} - Success status
 */
export const resendInvoiceEmail = async (invoiceId) => {
    try {
        const invoice = await invoiceModel.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (!invoice.pdfUrl) {
            throw new Error('Invoice PDF not generated yet');
        }

        await sendInvoiceEmail(
            invoice.patientEmail,
            invoice.patientName,
            invoice.invoiceNumber,
            invoice.pdfUrl,
            {
                doctorName: invoice.doctorName,
                appointmentDate: invoice.appointmentDate.replace(/_/g, '/'),
                appointmentTime: invoice.appointmentTime,
                amount: invoice.amount,
                priorityLevel: invoice.priorityLevel,
                queuePosition: invoice.queuePosition
            }
        );

        invoice.emailSent = true;
        invoice.emailSentAt = new Date();
        invoice.emailAttempts += 1;
        await invoice.save();

        return true;
    } catch (error) {
        console.error('Error resending invoice email:', error);

        const invoice = await invoiceModel.findById(invoiceId);
        if (invoice) {
            invoice.emailAttempts += 1;
            invoice.lastEmailError = error.message;
            await invoice.save();
        }

        throw error;
    }
};

export default {
    generateInvoicePDF,
    uploadInvoiceToCloudinary,
    createInvoice,
    getInvoiceByAppointment,
    resendInvoiceEmail
};
