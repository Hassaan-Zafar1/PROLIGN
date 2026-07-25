/**
 * Client-side CV text extraction.
 *
 * WHY THIS EXISTS: Cloudinary (on newer accounts) blocks unauthenticated
 * delivery of raw files like PDFs, so the backend's server-side fetch of the
 * uploaded CV returns 401 and extraction gets nothing. Extracting the text in
 * the browser — where we still hold the original File object — sidesteps that
 * entirely. We send the parsed text alongside the upload; the backend's
 * getTextFromCV() already prefers cv.parsedText over re-downloading the file.
 *
 * pdfjs-dist is heavy (~1MB) so it's dynamically imported only when a CV is
 * actually being processed, keeping it out of the initial bundle.
 */

const MAX_CHARS = 20000; // keep the request body well under the 100kb JSON limit

export async function extractCvText(file) {
  if (!file) return '';
  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return await extractPdfText(file);
    }
    // DOC/DOCX aren't parsed client-side (would need mammoth); the backend can
    // still attempt them. Return empty so we don't send garbage.
    return '';
  } catch (err) {
    console.warn('Client-side CV text extraction failed:', err.message);
    return '';
  }
}

async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist');
  // Vite resolves the worker to a real bundled URL via the ?url suffix.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let text = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // Joining every item with a single space (the old behavior) collapses an
    // entire page into ~one line, which breaks the backend's section-header
    // detection (cvExtractionService.js's findSectionLines needs a line to
    // *equal* "experience"/"top skills"/etc.) — exactly the layout a LinkedIn
    // "Save to PDF" export uses. pdf.js already computes line breaks for us:
    // each TextItem has `hasEOL`, true when a line break follows it.
    for (const item of content.items) {
      text += item.str;
      text += item.hasEOL ? '\n' : ' ';
    }
    text += '\n';
    if (text.length >= MAX_CHARS) break;
  }
  return text.slice(0, MAX_CHARS).trim();
}
