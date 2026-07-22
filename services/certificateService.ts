import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

export async function generateCertificate(
  studentName: string,
  course: string,
  college: string,
  domain: string,
  startDate: string,
  endDate: string,
  certificateId: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0
      });

      const fileName = `certificate_${certificateId}.pdf`;
      const publicDir = path.join(process.cwd(), 'public', 'certificates');
      
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const filePath = path.join(publicDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const templatePath = path.join(process.cwd(), 'public', 'certificate-landscape.png');
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf');
      
      if (fs.existsSync(fontPath)) {
        doc.registerFont('Cursive', fontPath);
      }

      if (fs.existsSync(templatePath)) {
        doc.image(templatePath, 0, 0, { width: 841.89, height: 595.28 });
        
        const formattedStart = new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const issueDate = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // CERTIFY THAT
        doc.font('Helvetica').fontSize(14).fillColor('#333333');
        doc.text('THIS IS TO CERTIFY THAT', 0, 275, { align: 'center', width: 841.89, characterSpacing: 2 });
        
        // STUDENT NAME (Cursive)
        if (fs.existsSync(fontPath)) {
          doc.font('Cursive').fontSize(58).fillColor('#b88b7d');
        } else {
          doc.font('Helvetica-Bold').fontSize(40).fillColor('#333333');
        }
        doc.text(studentName, 0, 305, { align: 'center', width: 841.89 });

        // PARAGRAPH WITH EXACT INLINE BOLDING & CENTER ALIGNMENT
        const fontSize = 11.5;
        doc.fontSize(fontSize).fillColor('#333333');

        const cleanCollege = (college && college.trim() && college !== 'College') ? college.trim() : '';

        if (cleanCollege) {
          // Line 1: 'student of ' + cleanCollege + ', has successfully completed the'
          doc.font('Helvetica');
          const w1 = doc.widthOfString('student of ');
          doc.font('Helvetica-Bold');
          const w2 = doc.widthOfString(cleanCollege);
          doc.font('Helvetica');
          const w3 = doc.widthOfString(', has successfully completed the');
          const startX1 = (841.89 - (w1 + w2 + w3)) / 2;

          doc.font('Helvetica').text('student of ', startX1, 375, { continued: true })
             .font('Helvetica-Bold').text(cleanCollege, { continued: true })
             .font('Helvetica').text(', has successfully completed the');
        } else {
          doc.font('Helvetica').text('has successfully completed the', 0, 375, { align: 'center', width: 841.89 });
        }

        // Line 2: 'Full Stack Web Development' + ' internship program at LGS Technologies'
        doc.font('Helvetica-Bold');
        const w4 = doc.widthOfString(`${domain}`);
        doc.font('Helvetica');
        const w5 = doc.widthOfString(' internship program at LGS Technologies');
        const startX2 = (841.89 - (w4 + w5)) / 2;

        doc.font('Helvetica-Bold').text(`${domain}`, startX2, 392, { continued: true })
           .font('Helvetica').text(' internship program at LGS Technologies');

        // Line 3: 'from Start to End. During this internship, the student'
        doc.font('Helvetica').text(`from ${formattedStart} to ${formattedEnd}. During this internship, the student`, 0, 409, { align: 'center', width: 841.89 });

        // Line 4: 'demonstrated dedication, enthusiasm, and outstanding performance.'
        doc.font('Helvetica').text('demonstrated dedication, enthusiasm, and outstanding performance.', 0, 426, { align: 'center', width: 841.89 });

        // Line 5: 'We wish the student all the best for their future endeavors.'
        doc.font('Helvetica').text('We wish the student all the best for their future endeavors.', 0, 448, { align: 'center', width: 841.89 });

        // DATE (bottom left)
        doc.font('Helvetica-Oblique').fontSize(14).fillColor('#333333');
        doc.text(issueDate, 120, 508, { width: 140, align: 'center' });

        // SIGNATURE (bottom right / center signature slot)
        const signaturePath = path.join(process.cwd(), 'public', 'signature.png');
        const signaturePathAlt = path.join(process.cwd(), 'public', 'images', 'signature.png');
        if (fs.existsSync(signaturePath)) {
          doc.image(signaturePath, 350, 470, { width: 105 });
        } else if (fs.existsSync(signaturePathAlt)) {
          doc.image(signaturePathAlt, 350, 470, { width: 105 });
        }

      } else {
        // Fallback drawing if the template isn't uploaded
        doc.rect(20, 20, 801.89, 555.28).lineWidth(5).stroke('#1e3a8a');
        doc.fontSize(30).fillColor('#1e3a8a').text('INTERNSHIP CERTIFICATE', 0, 100, { align: 'center' });
        doc.fontSize(24).fillColor('#111827').text(studentName.toUpperCase(), 0, 220, { align: 'center' });
      }

      // Generate QR Code linking to verification portal
      const frontendUrl = process.env.FRONTEND_URL || 'https://lgs-technlogies-prototype.vercel.app';
      const verificationUrl = `${frontendUrl}/verify?id=${certificateId}`;
      const qrImage = await QRCode.toDataURL(verificationUrl, { color: { dark: '#333333', light: '#ffffff' }, margin: 1 });
      
      // Draw QR Code bottom right (original server alignment)
      doc.image(qrImage, 650, 470, { width: 60 });
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#666666').text(`Scan to Verify`, 650, 535, { width: 60, align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#999999').text(`ID: ${certificateId}`, 640, 545, { width: 80, align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/certificates/${fileName}`);
      });
      
      writeStream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

export async function generateCertificateBuffer(
  studentName: string,
  course: string,
  college: string,
  domain: string,
  startDate: string,
  endDate: string,
  certificateId: string
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const templatePath = path.join(process.cwd(), 'public', 'certificate-landscape.png');
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf');
      
      if (fs.existsSync(fontPath)) {
        doc.registerFont('Cursive', fontPath);
      }

      if (fs.existsSync(templatePath)) {
        doc.image(templatePath, 0, 0, { width: 841.89, height: 595.28 });
        
        const formattedStart = new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const issueDate = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // CERTIFY THAT
        doc.font('Helvetica').fontSize(14).fillColor('#333333');
        doc.text('THIS IS TO CERTIFY THAT', 0, 275, { align: 'center', width: 841.89, characterSpacing: 2 });
        
        // STUDENT NAME (Cursive)
        if (fs.existsSync(fontPath)) {
          doc.font('Cursive').fontSize(58).fillColor('#b88b7d'); // rose gold-ish color
        } else {
          doc.font('Helvetica-Bold').fontSize(40).fillColor('#333333');
        }
        doc.text(studentName, 0, 305, { align: 'center', width: 841.89 });

        // PARAGRAPH WITH EXACT INLINE BOLDING & CENTER ALIGNMENT
        const fontSize = 11.5;
        doc.fontSize(fontSize).fillColor('#333333');

        const cleanCollege = (college && college.trim() && college !== 'College') ? college.trim() : '';

        if (cleanCollege) {
          doc.font('Helvetica');
          const w1 = doc.widthOfString('student of ');
          doc.font('Helvetica-Bold');
          const w2 = doc.widthOfString(cleanCollege);
          doc.font('Helvetica');
          const w3 = doc.widthOfString(', has successfully completed the');
          const startX1 = (841.89 - (w1 + w2 + w3)) / 2;

          doc.font('Helvetica').text('student of ', startX1, 375, { continued: true })
             .font('Helvetica-Bold').text(cleanCollege, { continued: true })
             .font('Helvetica').text(', has successfully completed the');
        } else {
          doc.font('Helvetica').text('has successfully completed the', 0, 375, { align: 'center', width: 841.89 });
        }

        doc.font('Helvetica-Bold');
        const w4 = doc.widthOfString(`${domain}`);
        doc.font('Helvetica');
        const w5 = doc.widthOfString(' internship program at LGS Technologies');
        const startX2 = (841.89 - (w4 + w5)) / 2;

        doc.font('Helvetica-Bold').text(`${domain}`, startX2, 392, { continued: true })
           .font('Helvetica').text(' internship program at LGS Technologies');

        doc.font('Helvetica').text(`from ${formattedStart} to ${formattedEnd}. During this internship, the student`, 0, 409, { align: 'center', width: 841.89 });
        doc.font('Helvetica').text('demonstrated dedication, enthusiasm, and outstanding performance.', 0, 426, { align: 'center', width: 841.89 });
        doc.font('Helvetica').text('We wish the student all the best for their future endeavors.', 0, 448, { align: 'center', width: 841.89 });

        // DATE (bottom left)
        doc.font('Helvetica-Oblique').fontSize(14).fillColor('#333333');
        doc.text(issueDate, 120, 508, { width: 140, align: 'center' });

        // SIGNATURE (bottom right / center signature slot)
        const signaturePath = path.join(process.cwd(), 'public', 'signature.png');
        const signaturePathAlt = path.join(process.cwd(), 'public', 'images', 'signature.png');
        if (fs.existsSync(signaturePath)) {
          doc.image(signaturePath, 380, 450, { width: 125 });
        } else if (fs.existsSync(signaturePathAlt)) {
          doc.image(signaturePathAlt, 380, 450, { width: 125 });
        }

      } else {
        doc.rect(20, 20, 801.89, 555.28).lineWidth(5).stroke('#1e3a8a');
        doc.fontSize(30).fillColor('#1e3a8a').text('INTERNSHIP CERTIFICATE', 0, 100, { align: 'center' });
        doc.fontSize(24).fillColor('#111827').text(studentName.toUpperCase(), 0, 220, { align: 'center' });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'https://lgs-technlogies-prototype.vercel.app';
      const verificationUrl = `${frontendUrl}/verify?id=${certificateId}`;
      const qrImage = await QRCode.toDataURL(verificationUrl, { color: { dark: '#333333', light: '#ffffff' }, margin: 1 });
      
      // Draw QR Code to the right of signature line
      doc.image(qrImage, 595, 480, { width: 55 });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#666666').text(`Scan to Verify`, 595, 540, { width: 55, align: 'center' });
      doc.font('Helvetica').fontSize(6.5).fillColor('#999999').text(`ID: ${certificateId}`, 585, 549, { width: 75, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


