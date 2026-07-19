const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const registrations = await prisma.registration.findMany();
  let updated = 0;
  for (const reg of registrations) {
    if (reg.offerLetterUrl && reg.offerLetterUrl.startsWith('/offers/')) {
      await prisma.registration.update({
        where: { id: reg.id },
        data: { offerLetterUrl: `/api/internships/offer-letter/${reg.id}` }
      });
      updated++;
    }
  }
  console.log(`Successfully migrated ${updated} offer letter URLs to dynamic streaming routes!`);
}

main().finally(() => prisma.$disconnect());
