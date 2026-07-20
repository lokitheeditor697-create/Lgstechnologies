// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { generateCertificate } from './services/certificateService';

const prisma = new PrismaClient();

async function main() {
  const registrations = await prisma.registration.findMany({
    where: { 
      paymentStatus: 'PAID',
      certificate: null
    }
  });
  
  console.log(`Found ${registrations.length} PAID registrations missing certificates.`);
  
  for (const reg of registrations) {
    await generateCertificate(reg.id);
    console.log(`Generated certificate for registration ${reg.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

