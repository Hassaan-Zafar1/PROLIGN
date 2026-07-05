/**
 * CV extraction service.
 *
 * Turns an uploaded CV (PDF/DOC/DOCX at a URL, or raw text) into a structured
 * mentor profile: { name, summary, skills, technologies, companies, experience,
 * education, certifications }.
 *
 * DESIGN
 * ------
 * Two clearly-separated stages so either can be swapped later:
 *   1. getTextFromCV()      — download + parse to plain text.
 *   2. extractStructured()  — heuristic field extraction from that text.
 *
 * The heuristic extractor is intentionally dependency-free and deterministic.
 * When the platform's own AI model is ready it can replace extractStructured()
 * (or post-process its output) without touching callers.
 *
 * ROBUSTNESS
 * ----------
 * Every step degrades gracefully and NEVER throws to the caller — a failed
 * download or a missing parser must not block mentor onboarding. On failure we
 * return whatever we could derive (often just the registration name/linkedin).
 */

// Parser libs are optional. We import them lazily so the service still works
// (with reduced extraction) before `npm install` adds them.
async function loadPdfParser() {
  try {
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    return mod.default || mod;
  } catch {
    return null;
  }
}
async function loadDocxParser() {
  try {
    const mod = await import("mammoth");
    return mod.default || mod;
  } catch {
    return null;
  }
}

// ─── Stage 1: CV → text ────────────────────────────────────────────────────────
export async function getTextFromCV(cv) {
  if (!cv) return "";
  // If we already have parsed text cached on the user, prefer it.
  if (cv.parsedText && cv.parsedText.trim().length > 0) return cv.parsedText;
  if (!cv.url) return "";

  // Node 18+ has global fetch; guard for older runtimes.
  if (typeof fetch !== "function") return "";

  try {
    // Bound the download — an unreachable/slow CV URL must not hang the whole
    // profile-build request (and therefore the onboarding UI) indefinitely.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let res;
    try {
      res = await fetch(cv.url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return "";
    const buffer = Buffer.from(await res.arrayBuffer());
    const name = (cv.filename || cv.url || "").toLowerCase();

    if (name.endsWith(".pdf") || res.headers.get("content-type")?.includes("pdf")) {
      const pdfParse = await loadPdfParser();
      if (!pdfParse) return "";
      const data = await pdfParse(buffer);
      return data.text || "";
    }

    if (name.endsWith(".docx")) {
      const mammoth = await loadDocxParser();
      if (!mammoth) return "";
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    }

    // .doc (legacy) and unknown types — best effort as UTF-8 text.
    return buffer.toString("utf8");
  } catch {
    return "";
  }
}

// ─── Heuristic dictionaries ────────────────────────────────────────────────────
const SKILL_DICTIONARY = [
  // Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang", "rust",
  "ruby", "php", "swift", "kotlin", "scala", "sql", "r", "matlab", "dart",
  // Web / frameworks
  "react", "react native", "next.js", "vue", "angular", "svelte", "node.js",
  "express", "django", "flask", "fastapi", "spring", "spring boot", ".net", "laravel",
  "rails", "graphql", "rest", "tailwind", "redux",
  // Data / AI
  "machine learning", "deep learning", "data science", "nlp", "computer vision",
  "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "spark", "hadoop",
  "data analysis", "data engineering", "llm", "generative ai",
  // Cloud / DevOps
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform",
  "ci/cd", "jenkins", "ansible", "linux", "microservices", "serverless",
  // DB
  "mongodb", "postgresql", "postgres", "mysql", "redis", "elasticsearch", "dynamodb",
  // Practices / roles
  "system design", "architecture", "agile", "scrum", "leadership", "product management",
  "product strategy", "ux", "ui", "figma", "design systems", "project management",
  "cybersecurity", "penetration testing", "network security", "blockchain",
  "mobile development", "devops", "qa", "testing", "automation",
];

const DEGREE_KEYWORDS = [
  "ph.d", "phd", "doctorate", "master", "m.s", "msc", "m.sc", "mba", "bachelor",
  "b.s", "bsc", "b.sc", "b.e", "b.tech", "m.tech", "associate degree", "diploma",
];

const CERT_KEYWORDS = [
  "certified", "certification", "certificate", "aws certified", "pmp", "cissp",
  "ccna", "scrum master", "csm", "google cloud certified", "azure certified",
  "comptia", "cpa", "cfa",
];

// Distinctive company suffixes only. Generic words like "solutions"/"software"
// are excluded because they appear in job titles ("Solutions Architect").
const COMPANY_REGEX =
  /\b([A-Z][A-Za-z0-9&.\-]*(?:\s+[A-Z][A-Za-z0-9&.\-]*){0,4}\s+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Technologies|Labs|Systems|GmbH|PLC|Consulting))\b/g;

const SECTION_HEADERS = {
  summary: ["summary", "professional summary", "profile", "about", "objective"],
  experience: ["experience", "work experience", "employment", "professional experience"],
  education: ["education", "academic", "qualifications"],
  skills: ["skills", "technical skills", "core competencies", "technologies"],
  certifications: ["certifications", "certificates", "licenses"],
};

// ─── Small helpers ─────────────────────────────────────────────────────────────
const uniq = (arr) => [...new Set(arr)];
const titleCase = (s) =>
  s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

function findSectionLines(lines, headerAliases) {
  const lowered = lines.map((l) => l.trim().toLowerCase());
  const start = lowered.findIndex((l) =>
    headerAliases.some((h) => l === h || l.startsWith(`${h}:`) || l === `${h}s`)
  );
  if (start === -1) return [];
  const allHeaders = Object.values(SECTION_HEADERS).flat();
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    // Stop at the next section header.
    if (allHeaders.includes(l.toLowerCase().replace(/:$/, ""))) break;
    out.push(l);
    if (out.length > 40) break;
  }
  return out;
}

// ─── Stage 2: text → structured profile ────────────────────────────────────────
export function extractStructured(text, { name } = {}) {
  const clean = (text || "").replace(/\r/g, "");
  const lower = clean.toLowerCase();
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  // Skills / technologies
  const skills = SKILL_DICTIONARY.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(lower);
  }).map((s) => titleCase(s));

  // Experience — max "N years" mentioned, else count distinct 4-digit years.
  let experience = 0;
  const yearsMatches = [...lower.matchAll(/(\d{1,2})\s*\+?\s*years?/g)].map((m) => Number(m[1]));
  if (yearsMatches.length) {
    experience = Math.min(Math.max(...yearsMatches), 50);
  } else {
    const yearTokens = uniq([...clean.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0])));
    if (yearTokens.length >= 2) {
      experience = Math.min(Math.max(...yearTokens) - Math.min(...yearTokens), 50);
    }
  }

  const allHeaders = Object.values(SECTION_HEADERS).flat();
  const isHeaderLine = (l) => allHeaders.includes(l.toLowerCase().replace(/:$/, ""));

  // Education — a degree keyword AS A WORD, plus real education context
  // (institution or a year) so "Scrum Master" isn't mistaken for a degree.
  const education = uniq(
    lines.filter((l) => {
      const low = l.toLowerCase();
      const hasDegree = DEGREE_KEYWORDS.some((d) =>
        new RegExp(`(^|[^a-z])${d.replace(/\./g, "\\.")}([^a-z]|$)`, "i").test(low)
      );
      const hasContext = /university|college|institute|school/i.test(l) || /\b(19|20)\d{2}\b/.test(l);
      return hasDegree && hasContext;
    })
  ).slice(0, 5);

  // Certifications — exclude bare section headers and education lines.
  const certifications = uniq(
    lines.filter(
      (l) =>
        !isHeaderLine(l) &&
        !education.includes(l) &&
        CERT_KEYWORDS.some((c) => l.toLowerCase().includes(c))
    )
  ).slice(0, 8);

  // Companies — capture just the company-name token (name + distinctive suffix),
  // plus "at <Company>" mentions with trailing dates/roles stripped.
  const cleanCompany = (c) =>
    c
      .replace(/\s+(?:19|20)\d{2}.*$/, "") // trailing "2019 - 2024"
      .replace(/\s*[–-]\s*(present|current).*$/i, "")
      .replace(/[•,;].*$/, "")
      .trim();
  const companyCandidates = [
    ...[...clean.matchAll(COMPANY_REGEX)].map((m) => cleanCompany(m[1])),
    ...[...clean.matchAll(/\bat\s+([A-Z][\w&.\- ]{2,50})/g)].map((m) => cleanCompany(m[1])),
  ].filter((c) => c.length > 1 && c.length < 50);
  // Dedupe case/punctuation-insensitively ("Stripe Inc" === "Stripe Inc.").
  const companySeen = new Set();
  const companies = companyCandidates
    .filter((c) => {
      const key = c.toLowerCase().replace(/[.\s]+$/, "").trim();
      if (companySeen.has(key)) return false;
      companySeen.add(key);
      return true;
    })
    .slice(0, 8);

  // Summary — the "summary" section, else the first substantial paragraph.
  let summary = findSectionLines(lines, SECTION_HEADERS.summary).join(" ");
  if (!summary) {
    summary = lines.find((l) => l.length > 60 && l.length < 400) || "";
  }
  summary = summary.slice(0, 500);

  return {
    name: name || null,
    summary,
    skills: uniq(skills).slice(0, 20),
    technologies: uniq(skills).slice(0, 20), // technologies are a subset of skills here
    companies,
    experience,
    education,
    certifications,
  };
}

/**
 * High-level entry point used by the controller.
 * Combines CV extraction with any known fallbacks (registration name/linkedin).
 * Always resolves — the `meta` field reports what actually happened.
 */
export async function buildProfileFromSources({ cv, name, linkedinUrl } = {}) {
  const meta = { cvParsed: false, linkedin: { attempted: false, status: null } };

  let text = "";
  try {
    text = await getTextFromCV(cv);
    meta.cvParsed = Boolean(text && text.trim().length > 0);
  } catch {
    meta.cvParsed = false;
  }

  const structured = extractStructured(text, { name });

  // ── LinkedIn seam (Task 4, priority 2) ──────────────────────────────────────
  // We deliberately do NOT scrape LinkedIn (against their ToS / legal + privacy
  // risk). When a COMPLIANT integration/API becomes available, enrich here and
  // merge into `structured`. Until then this is a no-op and onboarding proceeds
  // on CV data alone — LinkedIn never blocks the flow.
  if (linkedinUrl) {
    meta.linkedin.attempted = true;
    meta.linkedin.status = "skipped_no_compliant_integration";
  }

  return { profile: structured, text, meta };
}
