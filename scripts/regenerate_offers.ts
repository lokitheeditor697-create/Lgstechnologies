import { PrismaClient } from '@prisma/client';
import { generateOfferLetter } from '../services/pdfService';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching registrations...');
  const registrations = await prisma.registration.findMany({
    include: {
      user: true,
      internship: true,
      certificate: true
    }
  });

  let count = 0;
  for (const reg of registrations) {
    if (reg.offerLetterUrl) {
      console.log(`Regenerating offer letter for ${reg.user.name}...`);
      
      // The generateOfferLetter function requires a certificateId, but the certificate might not be generated yet.
      // Looking at the registration flow, the "Offer Ref" is often just "CT-PENDING" or a mock ID if the cert isn't issued.
      // Wait, let's check how it's called in routes/internships.ts
      
      const certificateId = reg.certificate ? reg.certificate.certificateId : 'AIM-INT-' + reg.id.substring(0, 8).toUpperCase();
      
      const newOfferUrl = await generateOfferLetter(
        reg.user.name,
        reg.internship.title,
        reg.user.college || 'Engineering College',
        reg.startDate.toISOString(),
        reg.endDate.toISOString(),
        reg.internship.domain,
        certificateId
      );
      
      // Update the DB if the URL somehow changed (it shouldn't, but just in case)
      if (reg.offerLetterUrl !== newOfferUrl) {
        await prisma.registration.update({
          where: { id: reg.id },
          data: { offerLetterUrl: newOfferUrl }
        });
      }
      count++;
    }
  }

  console.log(`Successfully regenerated ${count} offer letters!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
