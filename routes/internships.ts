// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateOfferLetter } from '../services/pdfService';
import { sendOfferLetterEmail, sendCertificateEmail } from '../services/emailService';
import { appendRegistrationRow, updateRegistrationRow } from '../services/sheetsService';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string
});

const getPrice = (domain: string, duration: string) => {
  const techDomains = [
    'Full Stack Development', 'Python Development', 'AI & ML Development', 
    'Data Science', 'Data Analytics', 'Cyber Security', 'Web Development', 
    'Cloud Computing', 'UI/UX Designing'
  ];
  
  const isTech = techDomains.includes(domain);
  let basePrice = 99; // Default fallback
  
  if (duration.includes('4 Weeks') || duration.includes('1 Month')) basePrice = 99;
  else if (duration.includes('8 Weeks') || duration.includes('2 Months')) basePrice = 150;
  else if (duration.includes('12 Weeks') || duration.includes('3 Months')) basePrice = 199;
  else if (duration.includes('24 Weeks') || duration.includes('6 Months')) basePrice = 299;
  
  if (!isTech && basePrice > 0) {
    basePrice -= 50;
  }
  
  return basePrice;
};

const router = Router();
const prisma = new PrismaClient();

// Get all internships
router.get('/', async (req, res) => {
  try {
    const internships = await prisma.internship.findMany();
    res.json(internships);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

// Get registrations for a specific user
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: { internship: true, certificate: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(registrations);
  } catch (error) {
    console.error('Fetch user registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Enroll in an internship
router.post('/enroll', authMiddleware, async (req, res) => {
  try {
    const { userId, studentName, studentEmail, course, college, domain, duration, startDate, endDate } = req.body;

    // Find or create the internship based on domain AND duration
    let internship = await prisma.internship.findFirst({
      where: { domain: domain, duration: duration || "4 Weeks" }
    });

    if (!internship) {
      const price = getPrice(domain, duration || "4 Weeks");
      const techDomains = [
        'Full Stack Development', 'Python Development', 'AI & ML Development', 
        'Data Science', 'Data Analytics', 'Cyber Security', 'Web Development', 
        'Cloud Computing', 'UI/UX Designing'
      ];
      
      internship = await prisma.internship.create({
        data: {
          title: `${domain} Internship`,
          domain: domain,
          duration: duration || "4 Weeks",
          price: price,
          type: techDomains.includes(domain) ? "TECH" : "NON_TECH"
        }
      });
    }

    const registration = await prisma.registration.create({
      data: {
        userId,
        internshipId: internship.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PENDING",
      }
    });

    const certificateId = `LGS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await prisma.certificate.create({
      data: {
        certificateId,
        registrationId: registration.id,
        pdfUrl: "",
        status: "PENDING"
      }
    });

    // 1. Generate PDF Buffer for Email
    const pdfBuffer = await generateOfferLetterBuffer(studentName, course, college, startDate, endDate, domain, certificateId);
    const fileName = `Offer_Letter_${studentName.replace(/\s+/g, '_')}_${certificateId}.pdf`;

    // Provide the dynamic streaming URL instead of the static disk path
    const offerLetterUrl = `/api/internships/offer-letter/${registration.id}`;

    // Save offerLetterUrl to registration
    const updatedRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: { offerLetterUrl }
    });

    // 2. Send email with Offer Letter attached (in background)
    sendOfferLetterEmail(studentEmail, studentName, domain, pdfBuffer, fileName).catch(console.error);

    // 3. Append to Google Sheets (in background)
    appendRegistrationRow({
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      name: studentName,
      email: studentEmail,
      college: college || 'College',
      domain: domain,
      status: 'PENDING'
    }).catch(console.error);

    res.json({ 
      message: 'Enrolled successfully, offer letter generated', 
      registration: updatedRegistration 
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

import { generateOfferLetterBuffer } from '../services/pdfService';

// Generate and stream Offer Letter on the fly (prevents Render disk wipe issues)
router.get('/offer-letter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find Registration
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { user: true, internship: true, certificate: true }
    });
    
    if (!registration) {
      return res.status(404).send('Offer Letter not found');
    }

    const certificateId = registration.certificate?.certificateId || `LGS-PENDING-${Date.now()}`;
    
    const pdfBuffer = await generateOfferLetterBuffer(
      registration.user.name,
      'Internship',
      registration.user.college || 'LGS Technologies',
      registration.startDate.toISOString(),
      registration.endDate.toISOString(),
      registration.internship.domain,
      certificateId
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Offer_Letter_${registration.user.name.replace(/\s+/g, '_')}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Stream Offer Letter Error:', error);
    res.status(500).send('Failed to generate Offer Letter');
  }
});

// Mock Complete Modules (Can still be used as fallback)
router.post('/mock-complete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await prisma.registration.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete modules' });
  }
});

// Get single registration
router.get('/registration/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { internship: true, user: true }
    });
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Update progress
router.post('/progress/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { progressStr } = req.body;
    
    const registration = await prisma.registration.update({
      where: { id },
      data: { progress: progressStr }
    });
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Submit Task (Drive Link)
router.post('/task/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { driveLink } = req.body;
    
    const registration = await prisma.registration.update({
      where: { id },
      data: { driveLink },
      include: { user: true }
    });
    
    // Update Google Sheets (in background)
    updateRegistrationRow(registration.user.email, { taskLink: driveLink }).catch(console.error);
    
    res.json(registration);
  } catch (error) {
    console.error('Failed to submit task:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

import { generateCertificateBuffer } from '../services/certificateService';

// Generate and stream Certificate on the fly
router.get('/certificate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { user: true, internship: true, certificate: true }
    });
    
    if (!registration) {
      return res.status(404).send('Certificate not found');
    }

    const certificateId = registration.certificate?.certificateId || `LGS-PENDING-${Date.now()}`;
    
    const pdfBuffer = await generateCertificateBuffer(
      registration.user.name,
      'Engineering',
      registration.user.college || 'College',
      registration.internship.domain,
      registration.startDate.toISOString(),
      registration.endDate.toISOString(),
      certificateId
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate_${registration.user.name.replace(/\s+/g, '_')}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Stream Certificate Error:', error);
    res.status(500).send('Failed to generate Certificate');
  }
});

// Razorpay Create Order
router.post('/create-order/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { internship: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const price = registration.internship.price || getPrice(registration.internship.domain, registration.internship.duration);
    const amountInPaise = price * 100;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: registration.id,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// Razorpay Verify Payment & Generate Certificate
router.post('/verify-payment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // 1. Mark as PAID
    const registration = await prisma.registration.update({
      where: { id },
      data: { paymentStatus: 'PAID', paymentId: razorpay_payment_id },
      include: { user: true, internship: true }
    });

    // 2. Find or Generate Certificate
    let certificate = await prisma.certificate.findUnique({
      where: { registrationId: registration.id }
    });
    
    const certificateId = certificate ? certificate.certificateId : `LGS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const pdfBuffer = await generateCertificateBuffer(
      registration.user.name,
      'Engineering',
      registration.user.college || 'College',
      registration.internship.domain,
      registration.startDate.toISOString(),
      registration.endDate.toISOString(),
      certificateId
    );

    const pdfUrl = `/api/internships/certificate/${registration.id}`;

    // 3. Save Certificate in DB
    if (certificate) {
      certificate = await prisma.certificate.update({
        where: { id: certificate.id },
        data: { pdfUrl, status: "ISSUED" }
      });
    } else {
      certificate = await prisma.certificate.create({
        data: {
          certificateId,
          registrationId: registration.id,
          pdfUrl,
          status: "ISSUED"
        }
      });
    }

    // 4. Update Google Sheets (in background)
    const frontendUrl = process.env.FRONTEND_URL || 'https://lgs-technlogies-prototype.vercel.app';
    const certificateLink = `${frontendUrl}/verify?id=${certificateId}`;
    updateRegistrationRow(registration.user.email, { 
      status: 'COMPLETED',
      certificateLink: certificateLink
    }).catch(console.error);

    res.json({ message: "Payment verified and Certificate Generated", certificate });
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Verify Certificate Public Route
router.get('/verify-certificate/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        registration: {
          include: {
            user: true,
            internship: true
          }
        }
      }
    });

    if (!certificate) {
      return res.status(404).json({ valid: false, error: "Certificate not found." });
    }
    
    if (certificate.status === "REVOKED") {
      return res.status(400).json({ valid: false, error: "This certificate has been revoked." });
    }

    res.json({ valid: true, certificate });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Bypass Payment & Generate Certificate directly (As per request)
router.post('/generate-certificate/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Mark as PAID (bypassing Razorpay)
    const registration = await prisma.registration.update({
      where: { id },
      data: { paymentStatus: 'PAID', paymentId: 'BYPASSED_' + Date.now() },
      include: { user: true, internship: true }
    });

    // 2. Find or Generate Certificate
    let certificate = await prisma.certificate.findUnique({
      where: { registrationId: registration.id }
    });
    
    const certificateId = certificate ? certificate.certificateId : `LGS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const pdfBuffer = await generateCertificateBuffer(
      registration.user.name,
      'Engineering',
      registration.user.college || 'College',
      registration.internship.domain,
      registration.startDate.toISOString(),
      registration.endDate.toISOString(),
      certificateId
    );

    const pdfUrl = `/api/internships/certificate/${registration.id}`;
    const fileName = `Certificate_${registration.user.name.replace(/\s+/g, '_')}.pdf`;

    // 3. Save Certificate in DB
    if (certificate) {
      certificate = await prisma.certificate.update({
        where: { id: certificate.id },
        data: { pdfUrl, status: "ISSUED" }
      });
    } else {
      certificate = await prisma.certificate.create({
        data: {
          certificateId,
          registrationId: registration.id,
          pdfUrl,
          status: "ISSUED"
        }
      });
    }

    // 4. Send Email with Certificate (in background)
    sendCertificateEmail(registration.user.email, registration.user.name, registration.internship.domain, pdfBuffer, fileName).catch(console.error);

    // 5. Update Google Sheets (in background)
    const frontendUrl = process.env.FRONTEND_URL || 'https://lgs-technlogies-prototype.vercel.app';
    updateRegistrationRow(registration.user.email, { 
      status: 'COMPLETED',
      certificateLink: `${frontendUrl}/verify?id=${certificateId}`
    }).catch(console.error);

    res.json({ message: "Certificate Generated and Emailed Successfully", certificate });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Certificate generation failed' });
  }
});

// Temporary Admin Route to Resend All Offer Letters
router.get('/resend-all-offers', async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      include: { user: true, internship: true, certificate: true }
    });

    let sentCount = 0;
    for (const reg of registrations) {
      if (!reg.user || !reg.user.email) continue;
      
      const certificateId = reg.certificate?.certificateId || `LGS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Generate PDF Buffer for Email Attachment
      const pdfBuffer = await generateOfferLetterBuffer(
        reg.user.name, 
        'Internship', 
        reg.user.college || 'LGS Technologies', 
        reg.startDate.toISOString(), 
        reg.endDate.toISOString(), 
        reg.internship.domain, 
        certificateId
      );
      
      const fileName = `Offer_Letter_${reg.user.name.replace(/\s+/g, '_')}_${certificateId}.pdf`;

      // Use the dynamic streaming URL for the database and frontend
      const offerLetterUrl = `/api/internships/offer-letter/${reg.id}`;

      // Update DB
      await prisma.registration.update({
        where: { id: reg.id },
        data: { offerLetterUrl }
      });

      // Send Email (using await so it doesn't overwhelm the SMTP server and crash Render)
      const emailSuccess = await sendOfferLetterEmail(reg.user.email, reg.user.name, reg.internship.domain, pdfBuffer, fileName);
      if (emailSuccess) {
        sentCount++;
      } else {
        console.error(`Failed to email ${reg.user.email}`);
      }
    }

    res.json({ message: `Successfully regenerated and emailed ${sentCount} offer letters!`, attempted: registrations.length });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resend offers', details: error.message });
  }
});

export default router;

