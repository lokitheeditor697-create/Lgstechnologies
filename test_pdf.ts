import { generateOfferLetter } from './services/pdfService';
import { generateCertificate } from './services/certificateService';

async function run() {
  try {
    console.log("Generating Offer Letter...");
    const offerPath = await generateOfferLetter(
      "John Doe",
      "B.Tech Computer Science",
      "Stanford University",
      "2026-06-01",
      "2026-07-01",
      "Full Stack Development",
      "CT-123456"
    );
    console.log("Offer Letter saved to:", offerPath);

    console.log("Generating Certificate...");
    const certPath = await generateCertificate(
      "John Doe",
      "B.Tech Computer Science",
      "Stanford University",
      "Full Stack Development",
      "2026-06-01",
      "2026-07-01",
      "CT-123456"
    );
    console.log("Certificate saved to:", certPath);

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
