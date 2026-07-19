const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'lgstechnologiess@gmail.com';
  console.log(`Looking up user: ${email}`);
  
  const user = await prisma.user.findFirst({
    where: { 
      email: {
        equals: email
      } 
    }
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log(`Found user: ${user.name} (${user.email}), current role: ${user.role}`);
  
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' }
  });

  console.log(`Success! Updated role to: ${updatedUser.role}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
