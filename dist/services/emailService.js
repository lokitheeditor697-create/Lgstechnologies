"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCertificateEmail = exports.sendOfferLetterEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create a transporter using Gmail SMTP
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'lgstechnologiess@gmail.com',
        pass: (process.env.EMAIL_PASS || 'chvp ylpo vegq eajw').replace(/\s+/g, '')
    }
});
/**
 * Sends an email with the Offer Letter attached
 */
const sendOfferLetterEmail = async (studentEmail, studentName, domain, pdfBuffer, fileName) => {
    try {
        const mailOptions = {
            from: `"LGS Technologies" <${process.env.EMAIL_USER || 'lgstechnologiess@gmail.com'}>`,
            to: studentEmail,
            subject: `Your Offer Letter from LGS Technologies - ${domain} Internship`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563EB;">Welcome to LGS Technologies!</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Congratulations! We are thrilled to offer you the internship position for <strong>${domain}</strong>.</p>
          <p>Please find your official Offer Letter attached to this email.</p>
          <p>We are excited to have you on board and look forward to seeing your growth during this internship!</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>LGS Technologies Team</strong></p>
        </div>
      `,
            attachments: [
                {
                    filename: fileName,
                    content: Buffer.from(pdfBuffer)
                }
            ]
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Offer Letter email sent successfully:', info.messageId);
        return true;
    }
    catch (error) {
        console.error('Failed to send Offer Letter email:', error);
        return false; // We return false instead of throwing so it doesn't crash the main API response
    }
};
exports.sendOfferLetterEmail = sendOfferLetterEmail;
/**
 * Sends an email with the Certificate attached
 */
const sendCertificateEmail = async (studentEmail, studentName, domain, pdfBuffer, fileName) => {
    try {
        const mailOptions = {
            from: `"LGS Technologies" <${process.env.EMAIL_USER || 'lgstechnologiess@gmail.com'}>`,
            to: studentEmail,
            subject: `Congratulations! Your Certificate from LGS Technologies`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #16A34A;">Congratulations on Completing Your Internship!</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>You have successfully completed your <strong>${domain}</strong> internship at LGS Technologies!</p>
          <p>We are incredibly proud of your hard work and dedication. Please find your official Completion Certificate attached to this email.</p>
          <p>We wish you the best of luck in your future endeavors!</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>LGS Technologies Team</strong></p>
        </div>
      `,
            attachments: [
                {
                    filename: fileName,
                    content: pdfBuffer
                }
            ]
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Certificate email sent successfully:', info.messageId);
        return true;
    }
    catch (error) {
        console.error('Failed to send Certificate email:', error);
        return false;
    }
};
exports.sendCertificateEmail = sendCertificateEmail;
