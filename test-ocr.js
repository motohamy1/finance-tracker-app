const Tesseract = require('tesseract.js');
const fs = require('fs');

async function testOCR() {
  const files = [
    'assets/images/test-screenshots/image.png',
    'assets/images/test-screenshots/img.png'
  ];
  for (const file of files) {
    console.log(`\n--- OCR for ${file} ---`);
    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    console.log(text);
  }
}
testOCR();
