import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateOfferLetter(studentName: string, course: string, college: string, startDate: string, endDate: string, domain: string, certificateId: string): Promise<string> {
  // 1. Read the Template Image
  const templatePath = path.join(process.cwd(), 'public', 'offer_letter_template.png');
  const templateBytes = fs.readFileSync(templatePath);

  // 2. Create PDF and Embed Image
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedPng(templateBytes);
  
  // Standard A4 dimensions
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  
  // Draw the template image to fill the page
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: A4_WIDTH,
    height: A4_HEIGHT,
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 11;
  const lineHeight = 16;
  const paraGap = 8; // Extra spacing between paragraphs

  const drawText = (text: string, x: number, y: number, size = fontSize, isBold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const formattedStart = new Date(startDate).toLocaleDateString('en-GB');
  const formattedEnd = new Date(endDate).toLocaleDateString('en-GB');

  // Header Details
  drawText(`Offer Ref: ${certificateId}`, 415, 715, 10, true);
  drawText(`DATE: ${today}`, 415, 700, 10, false);

  let currentY = 650;
  const startX = 65;

  // Candidate Address
  drawText('To,', startX, currentY, fontSize, true);
  currentY -= lineHeight;
  drawText(studentName, startX, currentY, fontSize, true);
  currentY -= lineHeight;
  drawText(college, startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText("India", startX, currentY, fontSize, false);
  
  currentY -= (lineHeight + paraGap);

  // Subject
  drawText('Subject: Offer for Student Internship', startX, currentY, fontSize, true);
  currentY -= (lineHeight + paraGap);

  // Salutation
  drawText(`Dear ${studentName},`, startX, currentY, fontSize, true);
  currentY -= (lineHeight + paraGap);

  // Body Paragraph 1
  drawText('We are pleased to offer you an opportunity to join LGS Technologies as a Student Intern', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText(`in the ${domain} department.`, startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  // Body Paragraph 2
  drawText(`Your internship period will commence from ${formattedStart} to ${formattedEnd}. During this period,`, startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('you will be involved in various tasks, training sessions, and projects related to your field', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('of study in order to enhance your practical knowledge and professional skills.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  // Body Paragraph 3
  drawText('As a Student Intern, you are expected to maintain discipline, punctuality, confidentiality,', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('and professionalism throughout the internship duration and comply with the rules and', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('regulations of the organization.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  // Body Paragraph 4
  drawText('This internship is being provided for educational and training purposes to support your', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('academic and career development. Upon successful completion of the internship, you may', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('be provided with an Internship Certificate based on your performance and attendance.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);

  // Body Paragraph 5
  drawText('We are confident that your association with LGS Technologies will be mutually beneficial', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('and provide you with valuable industry exposure.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  // Body Paragraph 6
  drawText('Please sign and return a copy of this letter as a token of your acceptance of the', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('internship offer.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  // Body Paragraph 7
  drawText('We look forward to welcoming you to our organization and wish you a successful', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('learning experience with us.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap * 3);

  // Footer / Signoff
  drawText('Yours sincerely,', startX, currentY, fontSize, true);
  currentY -= lineHeight;
  drawText('LGS Technologies', startX, currentY, fontSize, true);
  currentY -= (lineHeight + paraGap * 3);
  
  drawText('Place: Chennai, India', startX, currentY, fontSize, false);

  // 3. Save PDF Document
  const fileName = `Offer_Letter_${studentName.replace(/\s+/g, '_')}_${certificateId}.pdf`;
  const publicDir = path.join(process.cwd(), 'public', 'offers');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const filePath = path.join(publicDir, fileName);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, pdfBytes);
  
  return `/offers/${fileName}`;
}

export async function generateOfferLetterBuffer(studentName: string, course: string, college: string, startDate: string, endDate: string, domain: string, certificateId: string): Promise<Uint8Array> {
  // 1. Read the Template Image
  const templatePath = path.join(process.cwd(), 'public', 'offer_letter_template.png');
  const templateBytes = fs.readFileSync(templatePath);

  // 2. Create PDF and Embed Image
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedPng(templateBytes);
  
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  
  page.drawImage(image, {
    x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT,
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 11;
  const lineHeight = 16;
  const paraGap = 8;

  const drawText = (text: string, x: number, y: number, size = fontSize, isBold = false) => {
    page.drawText(text, { x, y, size, font: isBold ? boldFont : font, color: rgb(0, 0, 0) });
  };

  const today = new Date().toLocaleDateString('en-GB');
  const formattedStart = new Date(startDate).toLocaleDateString('en-GB');
  const formattedEnd = new Date(endDate).toLocaleDateString('en-GB');

  drawText(`Offer Ref: ${certificateId}`, 415, 715, 10, true);
  drawText(`DATE: ${today}`, 415, 700, 10, false);

  let currentY = 650;
  const startX = 65;

  drawText('To,', startX, currentY, fontSize, true);
  currentY -= lineHeight;
  drawText(studentName, startX, currentY, fontSize, true);
  currentY -= lineHeight;
  drawText(college, startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText("India", startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);

  drawText('Subject: Offer for Student Internship', startX, currentY, fontSize, true);
  currentY -= (lineHeight + paraGap);

  drawText(`Dear ${studentName},`, startX, currentY, fontSize, true);
  currentY -= (lineHeight + paraGap);

  drawText('We are pleased to offer you an opportunity to join LGS Technologies as a Student Intern', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText(`in the ${domain} department.`, startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  drawText(`Your internship period will commence from ${formattedStart} to ${formattedEnd}. During this period,`, startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('you will be involved in various tasks, training sessions, and projects related to your field', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('of study in order to enhance your practical knowledge and professional skills.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  drawText('As a Student Intern, you are expected to maintain discipline, punctuality, confidentiality,', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('and professionalism throughout the internship duration and comply with the rules and', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('regulations of the organization.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  drawText('This internship is being provided for educational and training purposes to support your', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('academic and career development. Upon successful completion of the internship, you may', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('be provided with an Internship Certificate based on your performance and attendance.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);

  drawText('We are confident that your association with LGS Technologies will be mutually beneficial', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('and provide you with valuable industry exposure.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  drawText('Please sign and return a copy of this letter as a token of your acceptance of the', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('internship offer.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap);
  
  drawText('We look forward to welcoming you to our organization and wish you a successful', startX, currentY, fontSize, false);
  currentY -= lineHeight;
  drawText('learning experience with us.', startX, currentY, fontSize, false);
  currentY -= (lineHeight + paraGap * 3);

  drawText('Yours sincerely,', startX, currentY, fontSize, true);
  currentY -= lineHeight;
  drawText('LGS Technologies', startX, currentY, fontSize, true);
  currentY -= (lineHeight + paraGap * 3);
  drawText('Place: Chennai, India', startX, currentY, fontSize, false);

  return await pdfDoc.save();
}

