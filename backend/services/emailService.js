/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials not configured. Emails will not be sent.');
        return null;
    }

    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Send invoice email with PDF attachment
 * @param {string} to - Recipient email
 * @param {string} patientName - Patient name
 * @param {string} invoiceNumber - Invoice number
 * @param {string} pdfUrl - Cloudinary PDF URL
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<boolean>} - Success status
 */
export const sendInvoiceEmail = async (to, patientName, invoiceNumber, pdfUrl, appointmentData) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('Email service not configured, skipping email send');
            return false;
        }

        const { doctorName, appointmentDate, appointmentTime, amount, priorityLevel, queuePosition } = appointmentData;

        // Priority badge colors
        const priorityColors = {
            'LOW': '#10B981',
            'MEDIUM': '#F59E0B',
            'HIGH': '#F97316',
            'CRITICAL': '#EF4444'
        };
        const badgeColor = priorityColors[priorityLevel] || '#10B981';

        // Email HTML template
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .priority-badge {
            display: inline-block;
            background: ${badgeColor};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 10px 0;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #6b7280;
        }
        .value {
            color: #111827;
        }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 Appointment Confirmed!</h1>
        <p>Your appointment has been successfully booked</p>
    </div>
    
    <div class="content">
        <p>Dear ${patientName},</p>
        
        <p>Thank you for booking an appointment with us. Your appointment has been confirmed and added to the priority queue.</p>
        
        <div style="text-align: center;">
            <span class="priority-badge">Priority: ${priorityLevel}</span>
        </div>
        
        <div class="info-box">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            
            <div class="info-row">
                <span class="label">Invoice Number:</span>
                <span class="value">${invoiceNumber}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Doctor:</span>
                <span class="value">Dr. ${doctorName}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${appointmentDate}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">${appointmentTime}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Queue Position:</span>
                <span class="value">#${queuePosition}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Consultation Fee:</span>
                <span class="value">₹${amount}</span>
            </div>
        </div>
        
        <p><strong>What's Next?</strong></p>
        <ul>
            <li>Your invoice is attached to this email</li>
            <li>You can track your queue position in real-time on our platform</li>
            <li>Please arrive 15 minutes before your scheduled time</li>
            <li>Bring a valid ID and any relevant medical reports</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="${pdfUrl}" class="cta-button">Download Invoice</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            <strong>Note:</strong> Your queue position is based on medical priority scoring. The position may change as new appointments are booked.
        </p>
    </div>
    
    <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} Healthcare Platform. All rights reserved.</p>
    </div>
</body>
</html>
        `;

        // Email options
        const mailOptions = {
            from: `"Healthcare Platform" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Appointment Confirmed - Invoice #${invoiceNumber}`,
            html: htmlContent,
            attachments: [
                {
                    filename: `Invoice_${invoiceNumber}.pdf`,
                    path: pdfUrl
                }
            ]
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Invoice email sent:', info.messageId);

        return true;
    } catch (error) {
        console.error('❌ Error sending invoice email:', error);
        throw error;
    }
};

/**
 * Send appointment reminder email
 * @param {string} to - Recipient email
 * @param {string} patientName - Patient name
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<boolean>} - Success status
 */
export const sendReminderEmail = async (to, patientName, appointmentData) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('Email service not configured, skipping reminder email');
            return false;
        }

        const { doctorName, appointmentDate, appointmentTime, queuePosition } = appointmentData;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #667eea;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
        }
        .content {
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🔔 Appointment Reminder</h2>
    </div>
    <div class="content">
        <p>Dear ${patientName},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
            <li><strong>Date:</strong> ${appointmentDate}</li>
            <li><strong>Time:</strong> ${appointmentTime}</li>
            <li><strong>Queue Position:</strong> #${queuePosition}</li>
        </ul>
        <p>Please arrive 15 minutes early.</p>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"Healthcare Platform" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Appointment Reminder',
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Reminder email sent');

        return true;
    } catch (error) {
        console.error('❌ Error sending reminder email:', error);
        throw error;
    }
};

export default {
    sendInvoiceEmail,
    sendReminderEmail
};
