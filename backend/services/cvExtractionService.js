import { extractTextFromPdf } from "./pdfTextService.js";
import {
  extractStructuredData,
  normalizeWorkExperience,
  normalizeEducation,
  computeTotalExperience,
} from "./cvParserService.js";

const log = (...args) => console.log("[cv-extract]", ...args);

// Docx support kept as an optional lazy import — pdfTextService only handles PDFs.
async function loadDocxParser() {
  try {
    const mod = await import("mammoth");
    return mod.default || mod;
  } catch (err) {
    log("mammoth not available:", err.message);
    return null;
  }
}

// ─── Stage 1: CV → raw text ─────────────────────────────────────────────────
// Unique, still-needed logic: reuse cached parsedText if present, else
// download from cv.url with a bounded timeout, else degrade gracefully.
// This must NEVER throw — a failed download must not block onboarding.
export async function getTextFromCV(cv) {
  if (!cv) {
    log("no cv object on user — nothing to extract");
    return "";
  }
  if (cv.parsedText && cv.parsedText.trim().length > 0) {
    log(`using cached parsedText (${cv.parsedText.length} chars)`);
    return cv.parsedText;
  }
  if (!cv.url) {
    log("cv object has no url — was the upload actually saved at registration?");
    return "";
  }
  if (typeof fetch !== "function") {
    log("global fetch unavailable on this Node runtime — upgrade to Node 18+");
    return "";
  }

  try {
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
      log(`CV fetch failed: HTTP ${res.status} ${res.statusText}`);
      return "";
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const name = (cv.filename || cv.url || "").toLowerCase();
    log(`downloaded ${buffer.length} bytes, filename="${cv.filename}", content-type="${res.headers.get("content-type")}"`);

    if (name.endsWith(".pdf") || res.headers.get("content-type")?.includes("pdf")) {
      const text = await extractTextFromPdf(buffer);
      log(`pdfTextService extracted ${text.length} chars`);
      return text;
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

    log("unrecognized file type — falling back to raw UTF-8 decode (works poorly for legacy .doc)");
    return buffer.toString("utf8");
  } catch (err) {
    log("CV fetch/parse threw:", err.name, err.message);
    return "";
  }
}

function emptyProfile(name) {
  return {
    name: name || null,
    bio: null, headline: null, title: null, company: null, industry: null,
    skills: [], domains: [], industries: [], softSkills: [], languages: [],
    certifications: [], workExperience: [], education: [],
    experience: 0, currentCompany: undefined,
  };
}

// ─── Stage 2: text → structured profile ─────────────────────────────────────
// Delegates to the SAME Groq-based parser cvController uses, so both upload
// paths produce identical field shapes on MentorProfile. No more separate
// heuristic dictionary/regex extractor living here.
async function extractStructured(text, { name } = {}) {
  if (!text || !text.trim()) return emptyProfile(name);

  const structured = await extractStructuredData(text);
  const workExperience = normalizeWorkExperience(structured.workExperience);
  const education = normalizeEducation(structured.education);
  const experience = computeTotalExperience(workExperience);
  const current = workExperience.find((w) => w.isCurrent) || workExperience[0];

  return {
    name: name || null,
    bio: structured.bio,
    headline: structured.headline,
    title: structured.title,
    company: structured.company,
    industry: structured.industry,
    skills: structured.skills || [],
    domains: structured.domains || [],
    industries: structured.industries || [],
    softSkills: structured.softSkills || [],
    languages: structured.languages || [],
    certifications: structured.certifications || [],
    workExperience,
    education,
    experience,
    currentCompany: current
      ? {
          name: current.companyName,
          role: current.role,
          yearsOfExp: current.startDate
            ? new Date().getFullYear() - current.startDate.getFullYear()
            : 0,
        }
      : undefined,
  };
}

/**
 * High-level entry point used by mentorService.buildMentorProfile.
 * Always resolves — the `meta` field reports what actually happened.
 * Never throws to the caller; a parsing failure just yields an empty profile.
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

  let profile = emptyProfile(name);
  if (meta.cvParsed) {
    try {
      profile = await extractStructured(text, { name });
      log(
        `extraction summary — cvParsed=true, textLength=${text.length},`,
        `skills=${profile.skills.length}, workExperience=${profile.workExperience.length},`,
        `education=${profile.education.length}, certifications=${profile.certifications.length},`,
        `experience=${profile.experience}`
      );
    } catch (err) {
      log("extractStructuredData failed:", err.message);
      meta.cvParsed = false;
    }
  }

  // ── LinkedIn seam ── deliberately a no-op until a compliant integration
  // exists; never blocks onboarding.
  if (linkedinUrl) {
    meta.linkedin.attempted = true;
    meta.linkedin.status = "skipped_no_compliant_integration";
  }

  return { profile, text, meta };
}