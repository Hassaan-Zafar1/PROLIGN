import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * mentee_profiles
 *
 * Read-only from Node's perspective - this collection is owned and written
 * by the Python AI interviewer (AI_interviewer/services/interview_service.py),
 * keyed by session_id. Mongor_Mentee_Match's MentorMatcher reads it directly
 * for matching (mm_selector/mentee_selector.py).
 *
 * Field order below matches the actual document shape exactly, e.g.:
 *   _id: "9311ef8a-046a-430e-9796-690c210f7a5b"
 *   session_id: "9311ef8a-046a-430e-9796-690c210f7a5b"
 *   full_name: "Unaiza Rehman"
 *   ...
 *
 * Two things worth knowing if you ever query this from Node:
 *   - generated_at is an ISO 8601 STRING (Python's datetime.isoformat()),
 *     not a native BSON Date - modeled as String to match reality.
 *   - tech_skills / domain_skills / soft_skills are pipe-joined strings
 *     (e.g. "Machine Learning | Computer Vision"), not arrays.
 */
const menteeProfileFlatSchema = new Schema(
  {
    // _id IS session_id - Python upserts via replace_one({_id: session_id}, doc)
    _id: { type: String, required: true },
    session_id: { type: String, required: true, index: true },

    // ── Raw fields, straight from Ayla's [DONE] JSON block ──────────────
    full_name: { type: String, default: "" },
    university: { type: String, default: "" },
    degree: { type: String, default: "" },
    experience_level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    domain_interest: { type: String, default: "" },
    target_role: { type: String, default: "" },
    target_company_tier: { type: String, default: "" },
    target_industry: { type: String, default: "" },
    bio: { type: String, default: "" },

    // Pipe-joined strings, e.g. "Machine Learning | Computer Vision | General AI"
    tech_skills: { type: String, default: "" },
    domain_skills: { type: String, default: "" },
    soft_skills: { type: String, default: "" },

    // ISO 8601 string (not a native Date) - see note above
    generated_at: { type: String, default: null },
    source: { type: String, default: "interview" },

    // ── Cleaned/derived fields - written by datacleaning.clean_mentee_record() ──
    cleaned_target_role: { type: String, default: "" },
    cleaned_target_industry: { type: String, default: "" },
    cleaned_domain_interest: { type: String, default: "" },
    cleaned_bio: { type: String, default: "" },
    cleaned_tech_skills: { type: String, default: "" },
    cleaned_domain_skills: { type: String, default: "" },
    cleaned_soft_skills: { type: String, default: "" },

    // Derived from experience_level via encode_experience_level() -
    // currently only recognizes "entry"/"mid"/"senior" keywords, so every
    // profile from Ayla's interview (which emits beginner/intermediate/
    // advanced) lands here as 0 until datacleaning.py's keyword list is
    // extended to match. See conversation notes / datacleaning.py.
    mentee_experience_years: { type: Number, default: 0 },
  },
  {
    _id: false,               // we supply our own string _id above
    collection: "Mentee_Profiles", // must be explicit - default pluralization would be wrong
    versionKey: false,
    timestamps: false,        // Python owns generated_at; don't let Mongoose add its own
  }
);

menteeProfileFlatSchema.index({ target_role: 1 });
menteeProfileFlatSchema.index({ domain_interest: 1 });

export default mongoose.models.MenteeProfileFlat ||
  mongoose.model("MenteeProfileFlat", menteeProfileFlatSchema);