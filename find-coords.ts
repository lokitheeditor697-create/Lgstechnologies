// @ts-nocheck
import Tesseract from 'tesseract.js';
import path from 'path';

async function findCoordinates() {
  const imagePath = path.join(__dirname, 'public', 'offer_letter_template.png');
  
  console.log('Running OCR to find placeholder coordinates...');
  
  const worker = await Tesseract.createWorker('eng');
  const ret = await worker.recognize(imagePath);
  
  const searchTerms = ['DATE', '[Candidate', 'Name]', '[Address]', '[City', 'Dear', '[Department', '[Start', '[End'];
  
  for (const word of ret.data.words) {
    const text = word.text.trim();
    for (const term of searchTerms) {
      if (text.includes(term) || term.includes(text)) {
        console.log(`Found: "${text}" at x=${word.bbox.x0}, y=${word.bbox.y0}, w=${word.bbox.x1 - word.bbox.x0}, h=${word.bbox.y1 - word.bbox.y0}`);
      }
    }
  }
  
  await worker.terminate();
  console.log('\nDone.');
}

findCoordinates().catch(console.error);

