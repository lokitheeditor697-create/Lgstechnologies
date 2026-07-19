const { sendOfferLetterEmail } = require('./services/emailService');
const { generateOfferLetterBuffer } = require('./services/pdfService');

async function testEmail() {
  try {
    console.log('Generating real buffer...');
    const buffer = await generateOfferLetterBuffer('Logeshwaran D', 'Internship', 'Dg vaishnav college', new Date().toISOString(), new Date().toISOString(), 'Web Development', 'LGS-MANUAL-TEST');
    
    console.log('Sending email...');
    const result = await sendOfferLetterEmail(
      'logeshwarand01@gmail.com', // Sending directly to their registered email!
      'Logeshwaran D',
      'Web Development',
      buffer,
      'Offer_Letter_Manual.pdf'
    );
    console.log('Email send result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

testEmail();
