"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificate = generateCertificate;
exports.generateCertificateBuffer = generateCertificateBuffer;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
async function generateCertificate(studentName, course, college, domain, startDate, endDate, certificateId) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                size: 'A4',
                layout: 'landscape',
                margin: 0
            });
            const fileName = `certificate_${certificateId}.pdf`;
            const publicDir = path_1.default.join(process.cwd(), 'public', 'certificates');
            if (!fs_1.default.existsSync(publicDir)) {
                fs_1.default.mkdirSync(publicDir, { recursive: true });
            }
            const filePath = path_1.default.join(publicDir, fileName);
            const writeStream = fs_1.default.createWriteStream(filePath);
            doc.pipe(writeStream);
            const templatePath = path_1.default.join(process.cwd(), 'public', 'certificate-landscape.png');
            const fontPath = path_1.default.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf');
            if (fs_1.default.existsSync(fontPath)) {
                doc.registerFont('Cursive', fontPath);
            }
            if (fs_1.default.existsSync(templatePath)) {
                doc.image(templatePath, 0, 0, { width: 841.89, height: 595.28 });
                const formattedStart = new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                const issueDate = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                // CERTIFY THAT
                doc.font('Helvetica').fontSize(14).fillColor('#333333');
                doc.text('THIS IS TO CERTIFY THAT', 0, 275, { align: 'center', width: 841.89, characterSpacing: 2 });
                // STUDENT NAME (Cursive)
                if (fs_1.default.existsSync(fontPath)) {
                    doc.font('Cursive').fontSize(58).fillColor('#b88b7d');
                }
                else {
                    doc.font('Helvetica-Bold').fontSize(40).fillColor('#333333');
                }
                doc.text(studentName, 0, 305, { align: 'center', width: 841.89 });
                // PARAGRAPH (CENTER ALIGNED)
                doc.font('Helvetica').fontSize(12).fillColor('#333333');
                const certParagraph = (college && college.trim() && college !== 'College')
                    ? `student of ${college.trim()}, has successfully completed the ${domain} internship program at LGS Technologies from ${formattedStart} to ${formattedEnd}. During this internship, the student demonstrated dedication, enthusiasm, and outstanding performance.\n\nWe wish the student all the best for their future endeavors.`
                    : `has successfully completed the ${domain} internship program at LGS Technologies from ${formattedStart} to ${formattedEnd}. During this internship, the student demonstrated dedication, enthusiasm, and outstanding performance.\n\nWe wish the student all the best for their future endeavors.`;
                doc.text(certParagraph, 150, 380, { align: 'center', width: 541.89, lineGap: 4 });
                // DATE (bottom left)
                doc.font('Helvetica-Oblique').fontSize(14).fillColor('#333333');
                doc.text(issueDate, 120, 508, { width: 140, align: 'center' });
                // SIGNATURE (bottom right / center signature slot)
                const signaturePath = path_1.default.join(process.cwd(), 'public', 'signature.png');
                const signaturePathAlt = path_1.default.join(process.cwd(), 'public', 'images', 'signature.png');
                if (fs_1.default.existsSync(signaturePath)) {
                    doc.image(signaturePath, 365, 420, { width: 125 });
                }
                else if (fs_1.default.existsSync(signaturePathAlt)) {
                    doc.image(signaturePathAlt, 365, 420, { width: 125 });
                }
            }
            else {
                // Fallback drawing if the template isn't uploaded
                doc.rect(20, 20, 801.89, 555.28).lineWidth(5).stroke('#1e3a8a');
                doc.fontSize(30).fillColor('#1e3a8a').text('INTERNSHIP CERTIFICATE', 0, 100, { align: 'center' });
                doc.fontSize(24).fillColor('#111827').text(studentName.toUpperCase(), 0, 220, { align: 'center' });
            }
            // Generate QR Code linking to verification portal
            const frontendUrl = process.env.FRONTEND_URL || 'https://lgs-technlogies-prototype.vercel.app';
            const verificationUrl = `${frontendUrl}/verify?id=${certificateId}`;
            const qrImage = await qrcode_1.default.toDataURL(verificationUrl, { color: { dark: '#333333', light: '#ffffff' }, margin: 1 });
            // Draw QR Code bottom right (original server alignment)
            doc.image(qrImage, 650, 470, { width: 60 });
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#666666').text(`Scan to Verify`, 650, 535, { width: 60, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor('#999999').text(`ID: ${certificateId}`, 640, 545, { width: 80, align: 'center' });
            doc.end();
            writeStream.on('finish', () => {
                resolve(`/certificates/${fileName}`);
            });
            writeStream.on('error', reject);
        }
        catch (error) {
            reject(error);
        }
    });
}
async function generateCertificateBuffer(studentName, course, college, domain, startDate, endDate, certificateId) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ size: 'A4', layout: 'landscape', margin: 0 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            const templatePath = path_1.default.join(process.cwd(), 'public', 'certificate-landscape.png');
            const fontPath = path_1.default.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf');
            if (fs_1.default.existsSync(fontPath)) {
                doc.registerFont('Cursive', fontPath);
            }
            if (fs_1.default.existsSync(templatePath)) {
                doc.image(templatePath, 0, 0, { width: 841.89, height: 595.28 });
                const formattedStart = new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                const issueDate = new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                // CERTIFY THAT
                doc.font('Helvetica').fontSize(14).fillColor('#333333');
                doc.text('THIS IS TO CERTIFY THAT', 0, 275, { align: 'center', width: 841.89, characterSpacing: 2 });
                // STUDENT NAME (Cursive)
                if (fs_1.default.existsSync(fontPath)) {
                    doc.font('Cursive').fontSize(58).fillColor('#b88b7d'); // rose gold-ish color
                }
                else {
                    doc.font('Helvetica-Bold').fontSize(40).fillColor('#333333');
                }
                doc.text(studentName, 0, 305, { align: 'center', width: 841.89 });
                // PARAGRAPH (CENTER ALIGNED)
                doc.font('Helvetica').fontSize(12).fillColor('#333333');
                const certParagraphBuf = (college && college.trim() && college !== 'College')
                    ? `student of ${college.trim()}, has successfully completed the ${domain} internship program at LGS Technologies from ${formattedStart} to ${formattedEnd}. During this internship, the student demonstrated dedication, enthusiasm, and outstanding performance.\n\nWe wish the student all the best for their future endeavors.`
                    : `has successfully completed the ${domain} internship program at LGS Technologies from ${formattedStart} to ${formattedEnd}. During this internship, the student demonstrated dedication, enthusiasm, and outstanding performance.\n\nWe wish the student all the best for their future endeavors.`;
                doc.text(certParagraphBuf, 150, 380, { align: 'center', width: 541.89, lineGap: 4 });
                // DATE (bottom left)
                doc.font('Helvetica-Oblique').fontSize(14).fillColor('#333333');
                doc.text(issueDate, 120, 508, { width: 140, align: 'center' });
                // SIGNATURE (bottom right / center signature slot)
                const signaturePath = path_1.default.join(process.cwd(), 'public', 'signature.png');
                const signaturePathAlt = path_1.default.join(process.cwd(), 'public', 'images', 'signature.png');
                if (fs_1.default.existsSync(signaturePath)) {
                    doc.image(signaturePath, 365, 420, { width: 125 });
                }
                else if (fs_1.default.existsSync(signaturePathAlt)) {
                    doc.image(signaturePathAlt, 365, 420, { width: 125 });
                }
            }
            else {
                doc.rect(20, 20, 801.89, 555.28).lineWidth(5).stroke('#1e3a8a');
                doc.fontSize(30).fillColor('#1e3a8a').text('INTERNSHIP CERTIFICATE', 0, 100, { align: 'center' });
                doc.fontSize(24).fillColor('#111827').text(studentName.toUpperCase(), 0, 220, { align: 'center' });
            }
            const frontendUrl = process.env.FRONTEND_URL || 'https://lgs-technlogies-prototype.vercel.app';
            const verificationUrl = `${frontendUrl}/verify?id=${certificateId}`;
            const qrImage = await qrcode_1.default.toDataURL(verificationUrl, { color: { dark: '#333333', light: '#ffffff' }, margin: 1 });
            // Draw QR Code to the right of signature line
            doc.image(qrImage, 595, 480, { width: 55 });
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#666666').text(`Scan to Verify`, 595, 540, { width: 55, align: 'center' });
            doc.font('Helvetica').fontSize(6.5).fillColor('#999999').text(`ID: ${certificateId}`, 585, 549, { width: 75, align: 'center' });
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
