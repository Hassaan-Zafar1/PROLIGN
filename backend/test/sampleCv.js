// Minimal, valid, single-page PDF generator for CV-upload tests — mirrors
// frontend/e2e/data/sampleCv.js (verified there against pdfjs-dist, the same
// library backend/services/pdfTextService.js uses to parse). Hand-rolled
// rather than a PDF-generation dependency since the spec's minimum viable
// structure (catalog → pages → page → font + content stream, plus a
// byte-accurate xref table) is small enough to build directly.
const RESUME_LINES = [
  "Jane Doe",
  "Senior Software Engineer",
  "San Francisco, California, United States",
  "Summary",
  "Experienced backend engineer building scalable systems.",
  "Experience",
  "Senior Software Engineer",
  "Stripe Inc.",
  "2019 - Present",
  "Education",
  "Master of Science, Computer Science",
  "Stanford University",
  "Top Skills",
  "React",
  "Node.js",
  "AWS",
];

const escapePdfText = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

export function buildSampleCvPdf(lines = RESUME_LINES) {
  const streamParts = ["BT", "/F1 12 Tf", "50 740 Td"];
  lines.forEach((text, i) => {
    if (i > 0) streamParts.push("0 -20 Td");
    streamParts.push(`(${escapePdfText(text)}) Tj`);
  });
  streamParts.push("ET");
  const contentStream = streamParts.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(contentStream, "latin1")} >>\nstream\n${contentStream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, idx) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${idx + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  const pad10 = (n) => String(n).padStart(10, "0");
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f\r\n";
  for (let i = 1; i <= objects.length; i++) {
    xref += `${pad10(offsets[i])} 00000 n\r\n`;
  }
  pdf += xref;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
