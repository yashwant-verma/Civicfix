const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    secure: false, // use TLS
    requireTLS: true,
});

// ✅ Verify SMTP connection
transporter.verify((err, success) => {
    if (err) {
        console.error('❌ SMTP connection failed:', err);
    } else {
        console.log('✅ SMTP ready to send emails!');
    }
});

/**
 * Sends an email notification about a complaint status update.
 * @param {string} email - The recipient's email.
 * @param {string} complaintId - The ID of the complaint.
 * @param {string} newStatus - The new status of the complaint.
 */
exports.sendComplaintStatusUpdate = async (email, complaintId, newStatus) => {
    try {
        const info = await transporter.sendMail({
            from: `"CivicFix Admin" <${process.env.MAIL_USER}>`,
            to: email,
            subject: `Complaint #${complaintId} Status Update: ${newStatus}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #1e40af;">Your Complaint Has Been Updated!</h2>
                    <p>Dear Citizen,</p>
                    <p>The status for your complaint <strong>#${complaintId}</strong> has been changed to:
                    <strong style="color: #059669;">${newStatus}</strong></p>
                    <p>Thank you for using CivicFix to report issues in your city.</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
                    Please log in to the application to view full details.
                    </p>
                </div>
            `,
        });
        console.log(`✅ Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Error sending status update email to ${email}:`, error);
    }
};

// 🚨 NEW FEATURE: Send detailed complaint email to the specified department 🚨
/**
 * Sends a detailed complaint report to a specific department for action.
 * @param {string} targetEmail - The department's email address.
 * @param {object} complaint - The full complaint object, including nested location and citizen data.
 */
exports.sendDepartmentForwardingEmail = async (targetEmail, complaint) => {
    try {
        const citizenName = complaint.citizen?.name || 'N/A';
        const citizenEmail = complaint.citizen?.email || 'N/A';
        const citizenPhone = complaint.citizen?.phone || 'N/A';

        const locationAddress = complaint.location?.address || 'Address not provided';
        const locationCoords = `Lat: ${complaint.location?.latitude?.toFixed(4) || 'N/A'}, Lon: ${complaint.location?.longitude?.toFixed(4) || 'N/A'}`;
        
        const emailContent = `
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f7f7f7; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc3545; text-align: center;">🚨 ACTION REQUIRED: Citizen Complaint Forwarded 🚨</h2>
                    <hr style="border-top: 1px solid #ccc;">

                    <p><strong>Complaint ID:</strong> ${complaint._id.toString().substring(0, 8)}...</p>
                    <p><strong>Title:</strong> ${complaint.title}</p>
                    <p><strong>Category:</strong> ${complaint.category}</p>
                    <p><strong>Current Status:</strong> <strong style="color: #0d6efd;">${complaint.status}</strong></p>
                    <hr style="border-top: 1px solid #eee;">
                    
                    <h3>Problem Details:</h3>
                    <p><strong>Description:</strong> ${complaint.description}</p>
                    
                    <h3>Location:</h3>
                    <p><strong>Address:</strong> ${locationAddress}</p>
                    <p><strong>Coordinates:</strong> ${locationCoords}</p>
                    
                    <h3>Citizen Contact:</h3>
                    <p><strong>Name:</strong> ${citizenName}</p>
                    <p><strong>Email:</strong> ${citizenEmail}</p>
                    <p><strong>Phone:</strong> ${citizenPhone}</p>
                    
                    <h3>Photo Evidence:</h3>
                    ${complaint.image ? 
                        `<p><a href="${complaint.image}" target="_blank" style="color: #0d6efd; font-weight: bold;">Click to View Full Photo Evidence</a></p>
                         <img src="${complaint.image}" alt="Complaint Evidence" style="max-width: 100%; height: auto; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;">`
                        : '<p style="color: #6c757d;">No photo evidence provided by the citizen.</p>'}
                    <hr>
                    <p style="font-size: 0.9em; color: #6c757d; text-align: center;">**Action Item:** Please address this issue and ensure the internal status is updated on the Admin Panel.</p>
                </div>
            </body>
            </html>
        `;

        const info = await transporter.sendMail({
            from: `"CivicFix Forwarding" <${process.env.MAIL_USER}>`,
            to: targetEmail,
            subject: `[ACTION REQUIRED] Complaint #${complaint._id.toString().substring(0, 8)}: ${complaint.title}`,
            html: emailContent,
        });

        console.log(`✅ Department Email sent successfully to ${targetEmail}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Error sending department forwarding email to ${targetEmail}:`, error);
        throw new Error("Mail service failed for department forwarding.");
    }
};