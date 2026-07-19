"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany();
    if (users.length > 0) {
        // Make the first user an ADMIN
        const adminUser = await prisma.user.update({
            where: { id: users[0].id },
            data: { role: 'ADMIN' }
        });
        console.log(`Successfully upgraded ${adminUser.email} to ADMIN!`);
    }
    else {
        console.log("No users found in the database. Please register a user first.");
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
