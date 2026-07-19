const fs = require('fs');
const { generateOfferLetterBuffer } = require('./services/pdfService');

async function test() {
  try {
    console.log('Testing PDF Buffer generation...');
    const buffer = await generateOfferLetterBuffer(
      "Test User",
      "Internship",
      "Test College",
      new Date().toISOString(),
      new Date().toISOString(),
      "Web Development",
      "TEST-123"
    );
    console.log('Success! Buffer length:', buffer.length);
  } catch (error) {
    console.error('Error:', error);
  }
}
test();
