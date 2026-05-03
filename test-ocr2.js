const Tesseract = require('tesseract.js');

async function testOCR() {
  const files = [
    'assets/images/test-screenshots/img_1.png',
    'assets/images/test-screenshots/img_2.png',
    'assets/images/test-screenshots/img_3.png'
  ];
  for (const file of files) {
    console.log(`\n--- OCR for ${file} ---`);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      console.log(text.substring(0, 500));
    } catch(e) {}
  }
}
testOCR();
