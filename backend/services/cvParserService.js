import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_SYSTEM_PROMPT = `You are a resume/CV parser. Given raw CV text extracted from a LinkedIn PDF export, extract structured data as JSON matching this EXACT schema. Return ONLY valid JSON, no markdown, no commentary.

{
  "bio": string or null,
  "headline": string or null,
  "title": string or null,
  "company": string or null,
  "industry": string or null,
  "skills": string[],
  "domains": string[],
  "industries": string[],
  "softSkills": string[],
  "languages": string[],
  "certifications": string[],
  "workExperience": [
    { "companyName": string, "role": string, "startDate": "YYYY-MM" or "YYYY", "endDate": "YYYY-MM" or "YYYY" or null, "isCurrent": boolean, "description": string or null }
  ],
  "education": [
    { "institution": string, "degree": string, "field": string, "year": number or null }
  ]
}

Rules:
- workExperience sorted most recent first. isCurrent=true and endDate=null for the current role.
- If a field can't be determined, use null (scalars) or [] (arrays). Never omit a key.
- skills = hard/technical skills only. softSkills = communication, leadership, etc.
- education.year = graduation year (or expected graduation year), as a number.`;

export async function extractStructuredData(rawText) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: rawText.slice(0, 12000) },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content);
}

function parseMonthYear(str) {
  if (!str) return null;
  const parts = str.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
  if (isNaN(year)) return null;
  return new Date(year, month, 1);
}

export function normalizeWorkExperience(entries = []) {
  return entries.map((e) => ({
    companyName: e.companyName || null,
    role: e.role || null,
    startDate: parseMonthYear(e.startDate),
    endDate: e.isCurrent ? null : parseMonthYear(e.endDate),
    isCurrent: !!e.isCurrent,
    description: e.description || null,
  }));
}

export function normalizeEducation(entries = []) {
  return entries.map((e) => ({
    institution: e.institution || null,
    degree: e.degree || null,
    field: e.field || null,
    year: typeof e.year === 'number' ? e.year : null,
  }));
}

export function computeTotalExperience(workExperience = []) {
  const now = new Date();
  const totalMonths = workExperience.reduce((sum, job) => {
    if (!job.startDate) return sum;
    const start = new Date(job.startDate);
    const end = job.isCurrent || !job.endDate ? now : new Date(job.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return sum + Math.max(months, 0);
  }, 0);
  return Math.round((totalMonths / 12) * 10) / 10;
}