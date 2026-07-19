"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pdfService_1 = require("./services/pdfService");
const certificateService_1 = require("./services/certificateService");
const prisma = new client_1.PrismaClient();
async function run() {
    console.log('Starting regeneration of all PDFs...');
    const registrations = await prisma.registration.findMany({
        include: {
            user: true,
            internship: true,
            certificate: true
        }
    });
    console.log(`Found ${registrations.length} registrations.`);
    for (const reg of registrations) {
        try {
            const studentName = reg.user.name;
            const college = reg.user.college || 'College';
            const domain = reg.internship.domain;
            const startDate = reg.startDate.toISOString();
            const endDate = reg.endDate.toISOString();
            const certificateId = reg.certificate ? reg.certificate.certificateId : `LGS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            // 1. Regenerate Offer Letter if it exists
            if (reg.offerLetterUrl) {
                console.log(`Regenerating Offer Letter for ${studentName}...`);
                const offerUrl = await (0, pdfService_1.generateOfferLetter)(studentName, 'Engineering', college, startDate, endDate, domain, certificateId);
                // Ensure db has latest url if it somehow changed name format
                await prisma.registration.update({
                    where: { id: reg.id },
                    data: { offerLetterUrl: offerUrl }
                });
                console.log(`Updated Offer Letter: ${offerUrl}`);
            }
            // 2. Regenerate Certificate if it's ISSUED
            if (reg.certificate && reg.certificate.status === 'ISSUED') {
                console.log(`Regenerating Certificate for ${studentName}...`);
                const certUrl = await (0, certificateService_1.generateCertificate)(studentName, 'Engineering', college, domain, startDate, endDate, reg.certificate.certificateId);
                // Ensure db has latest url
                await prisma.certificate.update({
                    where: { id: reg.certificate.id },
                    data: { pdfUrl: certUrl }
                });
                console.log(`Updated Certificate: ${certUrl}`);
            }
        }
        catch (e) {
            console.error(`Error processing registration ${reg.id}:`, e);
        }
    }
    console.log('Finished regenerating all PDFs!');
    process.exit(0);
}
run();
