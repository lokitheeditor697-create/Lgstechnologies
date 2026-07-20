"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const client_1 = require("@prisma/client");
const certificateService_1 = require("./services/certificateService");
const prisma = new client_1.PrismaClient();
async function main() {
    const registrations = await prisma.registration.findMany({
        where: {
            paymentStatus: 'PAID',
            certificate: null
        }
    });
    console.log(`Found ${registrations.length} PAID registrations missing certificates.`);
    for (const reg of registrations) {
        await (0, certificateService_1.generateCertificate)(reg.id);
        console.log(`Generated certificate for registration ${reg.id}`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
