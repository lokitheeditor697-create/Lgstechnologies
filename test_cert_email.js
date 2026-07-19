const { generateCertificateBuffer } = require('./services/certificateService');
const fs = require('fs');

async function testCertEmail() {
  try {
    console.log('Generating landscape cert buffer...');
    const buffer = await generateCertificateBuffer(
      'Logeshwaran D', 
      'Engineering', 
      'DG Vaishnav College', 
      'Web Development', 
      new Date().toISOString(), 
      new Date().toISOString(), 
      'LGS-TEST-NEW-DESIGN'
    );
    
    console.log('Buffer generated. Length:', buffer.length);
    fs.writeFileSync('D:\\LGS technologies\\backend\\preview_certificate.pdf', buffer);
    console.log('Saved directly to preview_certificate.pdf');
  } catch (err) {
    console.error('Error:', err);
  }
}

testCertEmail();
