import { PrismaClient } from '@prisma/client';
import { generateCertificate } from './services/certificateService';

const prisma = new PrismaClient();

async function main() {
  const internships = await prisma.internship.findMany({
    where: { OR: [{ domain: { contains: 'HR' } }, { domain: { contains: 'Human Resources' } }] }
  });
  
  if (internships.length === 0) {
    console.log('No HR internships found.');
    return;
  }
  
  const ids = internships.map(i => i.id);
  
  const res = await prisma.registration.updateMany({
    where: { internshipId: { in: ids } },
    data: { status: 'COMPLETED', paymentStatus: 'PAID' }
  });
  
  console.log(`Updated ${res.count} HR internship registrations to COMPLETED and PAID.`);
  
  const registrations = await prisma.registration.findMany({
    where: { internshipId: { in: ids }, certificate: null },
  });
  
  console.log(`Found ${registrations.length} HR registrations missing certificates.`);
  
  for (const reg of registrations) {
    await generateCertificate(reg.id);
    console.log(`Generated certificate for registration ${reg.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
