import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function extractTextFromPdf(buffer) {
  // pdfjs-dist explicitly rejects Node Buffer instances (even though Buffer
  // extends Uint8Array) — it wants a plain Uint8Array. multer's
  // memoryStorage() always hands this a real Buffer, so without this
  // conversion every upload through this path throws.
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let fullText = '';

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    const items = content.items.map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
    }));

    const midpoint = Math.max(...items.map((i) => i.x), 0) / 2;
    const leftCol = items.filter((i) => i.x < midpoint).sort((a, b) => b.y - a.y);
    const rightCol = items.filter((i) => i.x >= midpoint).sort((a, b) => b.y - a.y);

    fullText += leftCol.map((i) => i.text).join(' ') + '\n';
    fullText += rightCol.map((i) => i.text).join(' ') + '\n';
  }

  return fullText;
}