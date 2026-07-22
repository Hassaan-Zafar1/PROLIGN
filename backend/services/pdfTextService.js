import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function extractTextFromPdf(buffer) {
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
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