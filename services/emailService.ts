import nodemailer from 'nodemailer';

const PHP_MAILER_URL = process.env.PHP_MAILER_URL || 'https://lgstechnologies.in/send_mail.php';

// Create fallback transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || 'lgstechnologiess@gmail.com',
    pass: (process.env.SMTP_PASS || process.env.EMAIL_PASS || 'chvp ylpo vegq eajw').replace(/\s+/g, '')
  }
});

/**
 * Sends an Offer Letter email via PHP Mailer (StackCP) with Nodemailer fallback
 */
export const sendOfferLetterEmail = async (
  studentEmail: string, 
  studentName: string, 
  domain: string, 
  pdfBuffer: Uint8Array, 
  fileName: string
) => {
  try {
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

    // 1. Primary: Send via StackCP PHP Mailer
    const response = await fetch(PHP_MAILER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: studentEmail,
        name: studentName,
        type: 'OFFER',
        domain: domain,
        filename: fileName,
        attachmentBase64: base64Pdf
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('PHP Mailer Offer Letter sent successfully:', data);
      return true;
    } else {
      console.warn('PHP Mailer response not OK, attempting Nodemailer fallback...');
    }
  } catch (phpErr) {
    console.error('PHP Mailer call failed, attempting Nodemailer fallback:', phpErr);
  }

  // 2. Fallback: Nodemailer
  try {
    const mailOptions = {
      from: `"LGS Technologies" <${process.env.SMTP_USER || 'lgstechnologiess@gmail.com'}>`,
      to: studentEmail,
      subject: `Your Offer Letter from LGS Technologies - ${domain} Internship`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563EB;">Welcome to LGS Technologies!</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Congratulations! We are thrilled to offer you the internship position for <strong>${domain}</strong>.</p>
          <p>Please find your official Offer Letter attached to this email.</p>
          <br/>
          <p>Best Regards,<br/><strong>LGS Technologies Team</strong></p>
        </div>
      `,
      attachments: [{ filename: fileName, content: Buffer.from(pdfBuffer) }]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Fallback Nodemailer Offer Letter sent:', info.messageId);
    return true;
  } catch (smtpErr) {
    console.error('Nodemailer fallback failed:', smtpErr);
    return false;
  }
};

/**
 * Sends a Certificate email via PHP Mailer (StackCP) with Nodemailer fallback
 */
export const sendCertificateEmail = async (
  studentEmail: string, 
  studentName: string, 
  domain: string, 
  pdfBuffer: Buffer, 
  fileName: string
) => {
  try {
    const base64Pdf = pdfBuffer.toString('base64');

    // 1. Primary: Send via StackCP PHP Mailer
    const response = await fetch(PHP_MAILER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: studentEmail,
        name: studentName,
        type: 'CERTIFICATE',
        domain: domain,
        filename: fileName,
        attachmentBase64: base64Pdf
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('PHP Mailer Certificate sent successfully:', data);
      return true;
    } else {
      console.warn('PHP Mailer response not OK, attempting Nodemailer fallback...');
    }
  } catch (phpErr) {
    console.error('PHP Mailer call failed, attempting Nodemailer fallback:', phpErr);
  }

  // 2. Fallback: Nodemailer
  try {
    const mailOptions = {
      from: `"LGS Technologies" <${process.env.SMTP_USER || 'lgstechnologiess@gmail.com'}>`,
      to: studentEmail,
      subject: `Congratulations! Your Certificate from LGS Technologies`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #16A34A;">Congratulations on Completing Your Internship!</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>You have successfully completed your <strong>${domain}</strong> internship at LGS Technologies!</p>
          <p>Please find your official Completion Certificate attached.</p>
          <br/>
          <p>Best Regards,<br/><strong>LGS Technologies Team</strong></p>
        </div>
      `,
      attachments: [{ filename: fileName, content: pdfBuffer }]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Fallback Nodemailer Certificate sent:', info.messageId);
    return true;
  } catch (smtpErr) {
    console.error('Nodemailer fallback failed:', smtpErr);
    return false;
  }
};
