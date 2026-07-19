const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, name: true }
  });
  console.log("ALL USERS:");
  users.forEach(u => console.log(`${u.email} - ${u.name} - ${u.role}`));
}

main().finally(() => prisma.$disconnect());
