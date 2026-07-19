const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.registration.count();
  console.log(`Total registrations: ${count}`);
}

main().finally(() => prisma.$disconnect());
