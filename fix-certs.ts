import { PrismaClient } from '@prisma/client';
import { generateCertificate } from './services/certificateService';

const prisma = new PrismaClient();

async function main() {
  const registrations = await prisma.registration.findMany({
    where: { paymentStatus: 'PAID' },
    include: { user: true, internship: true, certificate: true }
  });
  
  console.log(`Regenerating certificates for ${registrations.length} PAID registrations.`);
  
  for (const reg of registrations) {
    const certId = reg.certificate ? reg.certificate.certificateId : `CT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const pdfPath = await generateCertificate(
      reg.user.name,
      'B.Tech',
      reg.user.college || 'Engineering College',
      reg.internship.domain,
      reg.startDate.toISOString(),
      reg.endDate.toISOString(),
      certId
    );
    
    if (reg.certificate) {
      await prisma.certificate.update({
        where: { id: reg.certificate.id },
        data: { pdfUrl: pdfPath }
      });
      console.log(`Updated existing certificate for ${reg.user.name}`);
    } else {
      await prisma.certificate.create({
        data: { certificateId: certId, registrationId: reg.id, pdfUrl: pdfPath }
      });
      console.log(`Created new certificate for ${reg.user.name}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
