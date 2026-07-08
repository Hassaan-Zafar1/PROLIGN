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

const log = (...args) => console.log("[cv-extract]", ...args);

// Parser libs are optional. We import them lazily so the service still works
// (with reduced extraction) before `npm install` adds them.
async function loadPdfParser() {
  try {
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    return mod.default || mod;
  } catch (err) {
    log("pdf-parse not available:", err.message);
    return null;
  }
}
async function loadDocxParser() {
  try {
    const mod = await import("mammoth");
    return mod.default || mod;
  } catch (err) {
    log("mammoth not available:", err.message);
    return null;
  }
}

// ─── Stage 1: CV → text ────────────────────────────────────────────────────────
export async function getTextFromCV(cv) {
  if (!cv) {
    log("no cv object on user — nothing to extract");
    return "";
  }
  // If we already have parsed text cached on the user, prefer it.
  if (cv.parsedText && cv.parsedText.trim().length > 0) {
    log(`using cached parsedText (${cv.parsedText.length} chars)`);
    return cv.parsedText;
  }
  if (!cv.url) {
    log("cv object has no url — was the upload actually saved at registration?");
    return "";
  }

  // Node 18+ has global fetch; guard for older runtimes.
  if (typeof fetch !== "function") {
    log("global fetch unavailable on this Node runtime — upgrade to Node 18+");
    return "";
  }

  try {
    // Bound the download — an unreachable/slow CV URL must not hang the whole
    // profile-build request (and therefore the onboarding UI) indefinitely.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let res;
    try {
      log("fetching CV from", cv.url);
      res = await fetch(cv.url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      // This is the #1 real-world cause: Cloudinary blocks unauthenticated
      // delivery of "raw" resources (PDF/DOC) by default on newer accounts
      // (a security change from April 2024). If you see 401/403 here, go to
      // Cloudinary Console → Settings → Security → and either disable
      // "Restricted media types" for raw/PDF delivery, or switch this upload
      // preset to deliver as `type: authenticated` and sign the fetch.
      log(`CV fetch failed: HTTP ${res.status} ${res.statusText} — likely a Cloudinary delivery restriction, see comment above`);
      return "";
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const name = (cv.filename || cv.url || "").toLowerCase();
    log(`downloaded ${buffer.length} bytes, filename="${cv.filename}", content-type="${res.headers.get("content-type")}"`);

    if (name.endsWith(".pdf") || res.headers.get("content-type")?.includes("pdf")) {
      const pdfParse = await loadPdfParser();
      if (!pdfParse) {
        log("pdf-parse missing — run `npm install` in backend/ to enable PDF text extraction");
        return "";
      }
      const data = await pdfParse(buffer);
      log(`pdf-parse extracted ${data.text?.length || 0} chars from ${data.numpages || "?"} page(s)`);
      return data.text || "";
    }

    if (name.endsWith(".docx")) {
      const mammoth = await loadDocxParser();
      if (!mammoth) {
        log("mammoth missing — run `npm install` in backend/ to enable DOCX text extraction");
        return "";
      }
      const { value } = await mammoth.extractRawText({ buffer });
      log(`mammoth extracted ${value?.length || 0} chars`);
      return value || "";
    }

    // .doc (legacy) and unknown types — best effort as UTF-8 text.
    log("unrecognized file type — falling back to raw UTF-8 decode (works poorly for legacy .doc)");
    return buffer.toString("utf8");
  } catch (err) {
    log("CV fetch/parse threw:", err.name, err.message);
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

// Includes LinkedIn's own "Save to PDF" export headers (e.g. "Top Skills",
// "Licenses & Certifications") — mentors commonly upload that export as their
// CV, and unlike scraping linkedin.com, parsing a file the mentor themselves
// downloaded and chose to upload is entirely compliant.
const SECTION_HEADERS = {
  summary: ["summary", "professional summary", "profile", "about", "objective"],
  experience: ["experience", "work experience", "employment", "professional experience"],
  education: ["education", "academic", "qualifications"],
  skills: ["skills", "technical skills", "core competencies", "technologies", "top skills"],
  certifications: ["certifications", "certificates", "licenses", "licenses & certifications", "licenses and certifications"],
};

// Extra headers (esp. LinkedIn sidebar blocks) that should terminate a section
// scan even though we don't extract from them directly.
const STOP_HEADERS = [
  ...Object.values(SECTION_HEADERS).flat(),
  "contact", "languages", "honors", "honors-awards", "honors & awards",
  "interests", "publications", "projects", "volunteering", "volunteer experience",
  "awards", "recommendations", "activity",
];

// Role/title keywords used to detect a professional title line.
const ROLE_KEYWORDS = [
  "software engineer", "full stack", "full-stack", "frontend", "front-end", "backend", "back-end",
  "developer", "engineer", "data scientist", "data analyst", "machine learning",
  "product manager", "project manager", "program manager", "designer", "ux", "ui",
  "consultant", "analyst", "architect", "tech lead", "team lead", "lead", "director",
  "manager", "scientist", "specialist", "head of", "founder", "co-founder", "ceo",
  "cto", "coo", "devops", "sre", "qa engineer", "mobile developer", "researcher",
];

// Coarse title/skills → industry mapping (first match wins).
const INDUSTRY_MAP = [
  { industry: "Data & AI", keywords: ["data scien", "machine learning", "ml engineer", "artificial intelligence", "data analyst", "data engineer", "nlp", "deep learning"] },
  { industry: "Product Management", keywords: ["product manager", "product management", "product owner"] },
  { industry: "Design", keywords: ["ux", "ui", "designer", "product design"] },
  { industry: "Cybersecurity", keywords: ["security", "penetration", "cybersecurity", "infosec"] },
  { industry: "Cloud & DevOps", keywords: ["devops", "cloud", "site reliability", "sre", "infrastructure", "kubernetes"] },
  { industry: "Marketing", keywords: ["marketing", "seo", "growth", "brand"] },
  { industry: "Finance", keywords: ["finance", "financial", "accountant", "investment", "banking"] },
  // Broad software bucket last so more specific industries win first.
  { industry: "Software Engineering", keywords: ["software", "developer", "full stack", "frontend", "backend", "web developer", "mobile developer", "engineer"] },
];

// Countries we recognize in a "City, Region, Country" location line.
const KNOWN_COUNTRIES = [
  "pakistan", "united states", "usa", "united kingdom", "uk", "india", "canada",
  "australia", "germany", "france", "netherlands", "united arab emirates", "uae",
  "saudi arabia", "singapore", "ireland", "spain", "italy", "sweden", "switzerland",
];

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
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    // Stop at the next section header (incl. LinkedIn sidebar blocks).
    if (STOP_HEADERS.includes(l.toLowerCase().replace(/:$/, ""))) break;
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
  } catch (err) {
    log("buildProfileFromSources: getTextFromCV threw unexpectedly:", err.message);
    meta.cvParsed = false;
  }

  const structured = extractStructured(text, { name });
  log(
    `extraction summary — cvParsed=${meta.cvParsed}, textLength=${text.length},`,
    `skills=${structured.skills.length}, companies=${structured.companies.length},`,
    `education=${structured.education.length}, certifications=${structured.certifications.length},`,
    `experience=${structured.experience}`
  );

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
