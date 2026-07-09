/**
 * Seed real User + MentorProfile documents from mentor_dataset_cleaned.csv.
 *
 * The CSV is the old flat bulk-upload shape (mentor_id, current_role,
 * pipe-joined skills, no email/password) — matcher.py no longer reads that
 * shape directly, it reads real mentorprofiles+users. This script bridges
 * the gap: turns each CSV row into an actual User (role: mentor) and linked
 * MentorProfile, going through the real Mongoose models so all schema
 * defaults/validation/password-hashing apply exactly as they would for a
 * real registration.
 *
 * Usage (run from the backend/ directory):
 *   node scripts/seedMentorsFromCsv.js --csv path/to/mentor_dataset_cleaned.csv
 *   node scripts/seedMentorsFromCsv.js --csv ../mentor_dataset_cleaned.csv --limit 50
 *   node scripts/seedMentorsFromCsv.js --csv ../mentor_dataset_cleaned.csv --all
 *
 * Idempotent: re-running skips any mentor_id already seeded (checked by email).
 * Seeded accounts all share the password below — these are test fixtures, not
 * real mentors, so a shared password is fine. Change SEED_PASSWORD if you want.
 */
import fs from "fs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";

const SEED_PASSWORD = "SeedMentor@2026";
const SEED_EMAIL_DOMAIN = "seed.prolign.test";

// ── Tiny RFC4180 CSV parser (no new dependency) — handles quoted fields with
// embedded commas/newlines/escaped quotes, which this file's bio column needs. ──
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function splitPipe(value) {
  return String(value || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { csv: null, limit: 50, all: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--csv") out.csv = args[++i];
    else if (args[i] === "--limit") out.limit = parseInt(args[++i], 10);
    else if (args[i] === "--all") out.all = true;
  }
  return out;
}

async function run() {
  const { csv, limit, all } = parseArgs();
  if (!csv) {
    console.error("Usage: node scripts/seedMentorsFromCsv.js --csv <path> [--limit N | --all]");
    process.exit(1);
  }
  if (!fs.existsSync(csv)) {
    console.error(`CSV not found: ${csv}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(csv, "utf-8");
  const rows = parseCsv(raw);
  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.length === header.length && r.some((c) => c.trim()));

  const records = dataRows.map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx]])));
  const toSeed = all ? records : records.slice(0, limit);

  console.log(`Parsed ${records.length} rows from CSV, seeding ${toSeed.length}.`);

  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME });
  console.log(`✅ Connected to MongoDB (${env.MONGO_DB_NAME})`);

  let created = 0;
  let skipped = 0;

  for (const rec of toSeed) {
    const mentorId = (rec.mentor_id || "").trim();
    if (!mentorId) continue;
    const email = `${mentorId.toLowerCase()}@${SEED_EMAIL_DOMAIN}`;

    const existing = await User.findOne({ email });
    if (existing) {
      skipped++;
      continue;
    }

    const user = await User.create({
      email,
      password: SEED_PASSWORD, // hashed by User's pre-save hook
      role: "mentor",
      name: rec.full_name || mentorId,
      isEmailVerified: true,
      isActive: true,
      isProfileComplete: true,
      onboardingStep: "complete",
    });

    const profile = await MentorProfile.create({
      userId: user._id,
      bio: (rec.bio || "").slice(0, 500) || null,
      title: rec.current_role || null,
      company: (rec.companies_worked_at || "").split(",")[0]?.trim() || null,
      industry: rec.industry || null,
      domainTag: rec.domain_tag || null,
      skills: splitPipe(rec.tech_skills),
      domains: splitPipe(rec.domain_skills),
      softSkills: splitPipe(rec.soft_skills),
      experience: Number(rec.experience_years) || 0,
      averageRating: Number(rec.avg_rating) || 0,
      totalSessions: Number(rec.total_sessions) || 0,
      currentCompany: {
        name: (rec.companies_worked_at || "").split(",")[0]?.trim() || null,
        role: rec.current_role || null,
        yearsOfExp: Number(rec.experience_years) || 0,
      },
      status: "approved",
      isApproved: true,
      approvedAt: new Date(),
    });

    user.mentorProfile = profile._id;
    await user.save();
    created++;
    if (created % 25 === 0) console.log(`  ...${created} seeded so far`);
  }

  console.log(`\n✅ Done. Created ${created} new mentor(s), skipped ${skipped} already-seeded.`);
  console.log(`All seeded mentors share the password: ${SEED_PASSWORD}`);
  console.log(`Their emails look like: <mentor_id>@${SEED_EMAIL_DOMAIN} (e.g. m-e7ckw5ng@${SEED_EMAIL_DOMAIN})`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
});