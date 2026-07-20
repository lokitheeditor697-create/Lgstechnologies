// @ts-nocheck
import express, { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateCertificate } from '../services/certificateService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const adminCheck = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};

router.use(authMiddleware, adminCheck);

// Get all registrations with user and internship data
router.get('/registrations', async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      include: {
        user: true,
        internship: true,
        certificate: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Approve Task and Generate Certificate
router.post('/approve-task/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find Registration
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { user: true, internship: true, certificate: true }
    });
    
    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    
    // Update to COMPLETED
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });
    
    // Generate Certificate
    let certificateId = registration.certificate?.certificateId || `LGS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const pdfUrl = await generateCertificate(
      registration.user.name,
      'Engineering',
      registration.user.college || 'College',
      registration.internship.domain,
      registration.startDate.toISOString(),
      registration.endDate.toISOString(),
      certificateId
    );
    
    if (registration.certificate) {
      await prisma.certificate.update({
        where: { id: registration.certificate.id },
        data: { pdfUrl, status: 'ISSUED' }
      });
    } else {
      await prisma.certificate.create({
        data: {
          certificateId,
          registrationId: id,
          pdfUrl,
          status: 'ISSUED'
        }
      });
    }

    res.json({ message: 'Task approved and certificate generated successfully', registration: updatedRegistration });
  } catch (error) {
    console.error('Approve task error:', error);
    res.status(500).json({ error: 'Failed to approve task' });
  }
});

// Bulk Generation Endpoint
router.post('/bulk-certificates', async (req, res) => {
  try {
    const { records } = req.body;
    const generated = [];

    for (const record of records) {
      // 1. Find or create user
      let user = await prisma.user.findUnique({ where: { email: record.email } });
      if (!user) {
        user = await prisma.user.create({
          data: { name: record.name, email: record.email, password: 'password123', college: record.college }
        });
      }

      // 2. Find or create internship
      let internship = await prisma.internship.findFirst({ where: { domain: record.domain } });
      if (!internship) {
        internship = await prisma.internship.create({
          data: { title: `${record.domain} Internship`, domain: record.domain, duration: '1 Month', mode: 'Remote' }
        });
      }

      // 3. Create Registration
      const registration = await prisma.registration.create({
        data: {
          userId: user.id,
          internshipId: internship.id,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          startDate: new Date(record.startDate),
          endDate: new Date(record.endDate)
        }
      });

      // 4. Generate Certificate
      const certificateId = `LGS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const pdfUrl = await generateCertificate(
        user.name,
        'Engineering',
        user.college || 'College',
        internship.domain,
        registration.startDate.toISOString(),
        registration.endDate.toISOString(),
        certificateId
      );
      
      const certificate = await prisma.certificate.create({
        data: {
          certificateId,
          registrationId: registration.id,
          pdfUrl,
          status: 'ISSUED'
        }
      });
      
      generated.push(certificate);
    }

    res.json({ message: "Bulk generation complete", certificates: generated });
  } catch (error) {
    console.error('Bulk generation error:', error);
    res.status(500).json({ error: 'Bulk generation failed' });
  }
});

// Delete a registration
router.delete('/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete any associated certificate to satisfy foreign key constraints
    await prisma.certificate.deleteMany({
      where: { registrationId: id }
    });

    // Then, delete the registration
    await prisma.registration.delete({
      where: { id }
    });

    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

// Database Export Endpoint
router.get('/db/export', async (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../dev.db');
    if (fs.existsSync(dbPath)) {
      res.download(dbPath, 'dev.db');
    } else {
      res.status(404).json({ error: 'Database file not found' });
    }
  } catch (error) {
    console.error('DB export error:', error);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Database Import Endpoint
router.post('/db/import', upload.single('database'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No database file uploaded' });
    }
    
    const dbPath = path.join(__dirname, '../dev.db');
    
    // Backup existing DB just in case
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, `${dbPath}.backup-${Date.now()}`);
    }
    
    // Replace DB
    fs.copyFileSync(req.file.path, dbPath);
    
    // Remove temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json({ message: 'Database imported successfully. Note: You may need to restart the backend server for Prisma to establish new connections.' });
  } catch (error) {
    console.error('DB import error:', error);
    res.status(500).json({ error: 'Failed to import database' });
  }
});

export default router;

