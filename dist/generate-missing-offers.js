"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pdfService_1 = require("./services/pdfService");
const prisma = new client_1.PrismaClient();
async function backfillOffers() {
    console.log("Fetching registrations without offer letters...");
    const registrations = await prisma.registration.findMany({
        include: {
            user: true,
            internship: true,
            certificate: true
        }
    });
    console.log(`Found ${registrations.length} registrations to process.`);
    for (const reg of registrations) {
        try {
            console.log(`Processing offer letter for ${reg.user.name}...`);
            let certificateId = reg.certificate?.certificateId;
            // If the user enrolled before we added pre-generated certificates, create one now
            if (!certificateId) {
                certificateId = `CT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                await prisma.certificate.create({
                    data: {
                        certificateId,
                        registrationId: reg.id,
                        pdfUrl: "",
                        status: "PENDING"
                    }
                });
            }
            const offerLetterUrl = await (0, pdfService_1.generateOfferLetter)(reg.user.name, 'Engineering', // default course
            reg.user.college || 'College', reg.startDate.toISOString(), reg.endDate.toISOString(), reg.internship.domain, certificateId);
            await prisma.registration.update({
                where: { id: reg.id },
                data: { offerLetterUrl }
            });
            console.log(`✅ Generated offer letter for ${reg.user.name}`);
        }
        catch (err) {
            console.error(`❌ Failed for ${reg.user.name}:`, err);
        }
    }
    console.log("Done backfilling offer letters.");
}
backfillOffers().catch(console.error).finally(() => prisma.$disconnect());
