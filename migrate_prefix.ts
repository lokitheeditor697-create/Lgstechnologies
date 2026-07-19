import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log("Migrating certificate IDs from CT- to LGS-...");
  const certs = await prisma.certificate.findMany({
    where: {
      certificateId: {
        startsWith: 'CT-'
      }
    }
  });

  for (const cert of certs) {
    const newId = cert.certificateId.replace('CT-', 'LGS-');
    await prisma.certificate.update({
      where: { id: cert.id },
      data: { certificateId: newId }
    });
    console.log(`Updated ${cert.certificateId} to ${newId}`);
  }
  
  console.log("Migration complete!");
  process.exit(0);
}

run();
