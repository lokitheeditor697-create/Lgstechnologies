const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const registrations = await prisma.registration.findMany({
    include: { user: true }
  });
  console.log("Registrations:");
  registrations.forEach(r => console.log(`${r.user?.name}: ${r.offerLetterUrl}`));
}

main().finally(() => prisma.$disconnect());
