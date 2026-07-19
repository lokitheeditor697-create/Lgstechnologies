"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pdfService_1 = require("./services/pdfService");
const certificateService_1 = require("./services/certificateService");
async function run() {
    try {
        console.log("Generating Offer Letter...");
        const offerPath = await (0, pdfService_1.generateOfferLetter)("John Doe", "B.Tech Computer Science", "Stanford University", "2026-06-01", "2026-07-01", "Full Stack Development", "CT-123456");
        console.log("Offer Letter saved to:", offerPath);
        console.log("Generating Certificate...");
        const certPath = await (0, certificateService_1.generateCertificate)("John Doe", "B.Tech Computer Science", "Stanford University", "Full Stack Development", "2026-06-01", "2026-07-01", "CT-123456");
        console.log("Certificate saved to:", certPath);
    }
    catch (error) {
        console.error("Error:", error);
    }
}
run();
