import os
import re
from pathlib import Path
from collections import Counter

import numpy as np
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

try:
    from sentence_transformers import SentenceTransformer, util
except Exception:
    SentenceTransformer = None
    util = None

from datacleaning import clean_text, encode_experience_level

# One .env for the whole backend, lives at backend/.env — this file is at
# backend/Mentor_Mentee_Match/matcher.py, so parents[1] is the backend root.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")


ROLE_MAP = {
    "frontend engineer": ["frontend", "front end", "react", "vue", "angular", "ui engineer"],
    "backend engineer": ["backend", "back end", "api", "microservices", "server side"],
    "fullstack engineer": ["fullstack", "full stack", "frontend and backend"],
    "data scientist": ["data scientist", "machine learning", "ml model", "statistics"],
    "data engineer": ["data engineering", "etl", "pipeline", "spark", "warehouse"],
    "ml engineer": ["ml engineer", "machine learning engineer", "deep learning", "nlp", "computer vision"],
    "devops engineer": ["devops", "sre", "kubernetes", "docker", "ci cd", "cloud infrastructure"],
    "product manager": ["product manager", "product strategy", "roadmap", "stakeholder"],
    "staff engineer": ["staff engineer", "technical leadership", "architecture", "senior staff"],
}

INDUSTRY_MAP = {
    "finance": ["finance", "banking", "investment", "trading", "fintech", "accounting"],
    "healthcare": ["healthcare", "medical", "clinical", "health", "biotech", "pharma"],
    "education": ["education", "edtech", "learning", "teaching", "university"],
    "logistics": ["logistics", "supply chain", "shipping", "fleet", "warehouse"],
    "ecommerce": ["ecommerce", "e commerce", "retail", "marketplace", "shopping"],
    "enterprise tech": ["enterprise", "saas", "b2b", "platform", "crm"],
    "consumer tech": ["consumer", "mobile app", "social", "creator", "media"],
}

DOMAIN_MAP = {
    "ai-ml": ["machine learning", "deep learning", "nlp", "llm", "computer vision", "ai", "neural network"],
    "data": ["data science", "analytics", "data engineering", "sql", "spark", "tableau"],
    "cloud": ["aws", "azure", "gcp", "cloud", "devops", "kubernetes", "docker"],
    "web": ["react", "node", "frontend", "backend", "web development", "javascript"],
    "security": ["security", "cybersecurity", "threat", "identity", "compliance"],
    "fintech": ["fintech", "payments", "banking", "trading", "risk"],
    "healthtech": ["healthtech", "healthcare", "clinical", "medical", "patient"],
    "hrtech": ["hrtech", "talent", "recruiting", "people analytics", "workforce"],
    "martech": ["martech", "marketing", "seo", "campaign", "growth"],
}


def is_missing(value):
    if pd.isna(value):
        return True
    return str(value).strip().lower() in {"", "nan", "none", "null", "n/a", "na"}


def infer_from_bio(bio, field_map):
    cleaned_bio = clean_text(bio)
    padded_bio = f" {cleaned_bio} "
    for label, keywords in field_map.items():
        for keyword in keywords:
            cleaned_keyword = clean_text(keyword)
            if cleaned_keyword and f" {cleaned_keyword} " in padded_bio:
                return label
    return "general"


def recover_missing_value(row, column, bio_column, field_map):
    value = row.get(column, "")
    if is_missing(value):
        return infer_from_bio(row.get(bio_column, ""), field_map)
    return value


def min_max_normalize(series):
    numeric = pd.to_numeric(series, errors="coerce").fillna(0)
    min_value = numeric.min()
    max_value = numeric.max()
    if max_value == min_value:
        return pd.Series(np.zeros(len(numeric)), index=series.index)
    return (numeric - min_value) / (max_value - min_value)


def parse_skills(skill_str):
    if is_missing(skill_str):
        return set()
    pieces = re.split(r"[,|;/]+", str(skill_str))
    return {clean_text(piece).strip() for piece in pieces if clean_text(piece).strip()}


def _load_mentor_df_from_mentorprofiles(db):
    """
    Build the flat mentor dataframe MentorMatcher needs, from Node's real
    `mentorprofiles` (Mongoose) + `users` collections instead of the old flat
    `mentors` bulk-CSV collection (removed — mentorprofiles is now the single
    source of truth for mentor data, same as menteeprofiles for mentees).

    Field mapping (mentorprofiles/users → matcher's expected flat columns):
      _id                → mentor_id (stringified ObjectId)
      users.name         → full_name
      title (fallback: currentCompany.role) → current_role
      industry           → industry
      domainTag           → domain_tag
      bio                 → bio
      experience (years)  → experience_years
      averageRating       → avg_rating
      totalSessions        → total_sessions
      skills (array)       → tech_skills (pipe-joined, matches parse_skills' separator)
      domains (array)      → domain_skills (pipe-joined)
      softSkills (array)   → soft_skills (pipe-joined)

    Only approved, active, non-banned mentors are included — same filter the
    public mentor directory (mentorService.js) applies.
    """
    pipeline = [
        {"$lookup": {"from": "users", "localField": "userId", "foreignField": "_id", "as": "user"}},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {"$match": {
            "status": "approved",
            "user.isActive": {"$ne": False},
            "user.isBanned": {"$ne": True},
        }},
    ]
    rows = []
    for doc in db["mentorprofiles"].aggregate(pipeline):
        current_company = doc.get("currentCompany") or {}
        user_doc = doc.get("user") or {}
        rows.append({
            "mentor_id": str(doc.get("_id", "")),
            "full_name": user_doc.get("name", "") or "",
            "profile_pic": user_doc.get("profilePic") or None,
            "hourly_rate": doc.get("hourlyRate") or doc.get("pricePerSession") or None,
            "current_role": doc.get("title") or current_company.get("role") or "",
            "industry": doc.get("industry") or "",
            "domain_tag": doc.get("domainTag") or "",
            "bio": doc.get("bio") or "",
            "experience_years": doc.get("experience") or 0,
            "avg_rating": doc.get("averageRating") or 0,
            "total_sessions": doc.get("totalSessions") or 0,
            "tech_skills": " | ".join(doc.get("skills") or []),
            "domain_skills": " | ".join(doc.get("domains") or []),
            "soft_skills": " | ".join(doc.get("softSkills") or []),
        })
    return pd.DataFrame(rows)


def _load_mentee_df_from_menteeprofiles(db):
    """
    Build the flat mentee dataframe MentorMatcher needs, but from Node's real
    `menteeprofiles` (Mongoose) + `users` collections instead of the old flat
    `mentees` collection (removed — menteeprofiles is now the single source of
    truth for mentee data).

    Field mapping (menteeprofiles/users → matcher's expected flat columns):
      _id                        → mentee_id (stringified ObjectId)
      users.name                 → full_name
      onboardingAnswers.targetRole      → target_role
      onboardingAnswers.targetIndustry  → target_industry (schema stores a list; join with " ")
      onboardingAnswers.targetCompanyTier → target_company_tier
      domainInterest              → domain_interest
      bio                         → bio
      onboardingAnswers.experienceLevel → experience_level (raw label)
      onboardingAnswers.yearsOfExp → mentee_experience_years
      skillProfile.skills (array) → tech_skills (pipe-joined, matches parse_skills' separator)
      skillProfile.domains (array)→ domain_skills (pipe-joined)
      softSkills (array)          → soft_skills (pipe-joined)
    """
    pipeline = [
        {"$lookup": {"from": "users", "localField": "userId", "foreignField": "_id", "as": "user"}},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
    ]
    rows = []
    for doc in db["menteeprofiles"].aggregate(pipeline):
        oa = doc.get("onboardingAnswers") or {}
        sp = doc.get("skillProfile") or {}
        target_industry = oa.get("targetIndustry") or []
        rows.append({
            "mentee_id": str(doc.get("_id", "")),
            "full_name": (doc.get("user") or {}).get("name", "") or "",
            "target_role": oa.get("targetRole") or "",
            "target_industry": " ".join(target_industry) if isinstance(target_industry, list) else str(target_industry or ""),
            "target_company_tier": oa.get("targetCompanyTier") or "",
            "domain_interest": doc.get("domainInterest") or "",
            "bio": doc.get("bio") or "",
            "experience_level": oa.get("experienceLevel") or "",
            "mentee_experience_years": oa.get("yearsOfExp") or 0,
            "tech_skills": " | ".join(sp.get("skills") or []),
            "domain_skills": " | ".join(sp.get("domains") or []),
            "soft_skills": " | ".join(doc.get("softSkills") or []),
        })
    return pd.DataFrame(rows)


class MentorMatcher:
    def __init__(
        self,
        mongo_uri=None,
        mongo_db=None,
        mentor_collection="mentorprofiles",  # was "mentors" — now reads Node's real collection
        mentee_collection="menteeprofiles",  # was "mentees" — now reads Node's real collection
        model_name="all-MiniLM-L6-v2",
    ):
        self._uri = mongo_uri or os.environ.get("MONGO_URI") or "mongodb://localhost:27017"
        self._db_name = mongo_db or os.environ.get("MONGO_DB_NAME") or "Prolign"
        self._mentor_collection = mentor_collection
        self._mentee_collection = mentee_collection
        self.model_name = model_name

        client = MongoClient(self._uri)
        db = client[self._db_name]
        self.mentor_df = _load_mentor_df_from_mentorprofiles(db)
        self.mentee_df = _load_mentee_df_from_menteeprofiles(db)
        client.close()

        if self.mentor_df.empty:
            raise ValueError(f"No documents found in '{self._db_name}.{mentor_collection}' (mentorprofiles)")
        if self.mentee_df.empty:
            raise ValueError(f"No documents found in '{self._db_name}.{mentee_collection}' (menteeprofiles)")

        print(f"Loaded {len(self.mentor_df)} mentors from '{self._db_name}.{mentor_collection}'")
        print(f"Loaded {len(self.mentee_df)} mentees from '{self._db_name}.{mentee_collection}'")
        print(f"Mentor columns: {list(self.mentor_df.columns)}")
        print(f"Mentee columns: {list(self.mentee_df.columns)}")

        self._recover_mentor_fields()
        self._recover_mentee_fields()
        self._prepare_mentor_numeric_fields()
        self._prepare_mentee_numeric_fields()
        self._load_similarity_model()
        self._precompute_mentor_embeddings()

    def refresh_mentees(self):
        """
        Reload just the mentee data from menteeprofiles/users. Call this before
        matching if mentees may have been added since this MentorMatcher was
        created (e.g. a long-lived API process where interviews complete after
        startup). Cheap — does not touch the mentor embeddings or reload the ML model.
        """
        client = MongoClient(self._uri)
        self.mentee_df = _load_mentee_df_from_menteeprofiles(client[self._db_name])
        client.close()
        if self.mentee_df.empty:
            raise ValueError(f"No documents found in '{self._db_name}.{self._mentee_collection}' (menteeprofiles)")
        self._recover_mentee_fields()
        self._prepare_mentee_numeric_fields()

    def _recover_mentor_fields(self):
        self.mentor_df["match_current_role"] = self.mentor_df.apply(
            lambda row: recover_missing_value(row, "current_role", "bio", ROLE_MAP), axis=1
        )
        self.mentor_df["match_industry"] = self.mentor_df.apply(
            lambda row: recover_missing_value(row, "industry", "bio", INDUSTRY_MAP), axis=1
        )
        self.mentor_df["match_domain_tag"] = self.mentor_df.apply(
            lambda row: recover_missing_value(row, "domain_tag", "bio", DOMAIN_MAP), axis=1
        )

    def _recover_mentee_fields(self):
        self.mentee_df["match_target_role"] = self.mentee_df.apply(
            lambda row: recover_missing_value(row, "target_role", "bio", ROLE_MAP), axis=1
        )
        self.mentee_df["match_target_industry"] = self.mentee_df.apply(
            lambda row: recover_missing_value(row, "target_industry", "bio", INDUSTRY_MAP), axis=1
        )
        self.mentee_df["match_domain_interest"] = self.mentee_df.apply(
            lambda row: recover_missing_value(row, "domain_interest", "bio", DOMAIN_MAP), axis=1
        )

        if "target_company_tier" not in self.mentee_df.columns:
            self.mentee_df["target_company_tier"] = ""

    def _prepare_mentor_numeric_fields(self):
        self.mentor_df["experience_years"] = pd.to_numeric(
            self.mentor_df.get("experience_years", 0), errors="coerce"
        ).fillna(0)
        self.mentor_df["avg_rating"] = pd.to_numeric(self.mentor_df.get("avg_rating", 0), errors="coerce").fillna(0)
        self.mentor_df["total_sessions"] = pd.to_numeric(
            self.mentor_df.get("total_sessions", 0), errors="coerce"
        ).fillna(0)
        self.mentor_df["rating_norm"] = min_max_normalize(self.mentor_df["avg_rating"])
        self.mentor_df["sessions_norm"] = min_max_normalize(self.mentor_df["total_sessions"])

    def _prepare_mentee_numeric_fields(self):
        if "mentee_experience_years" not in self.mentee_df.columns:
            self.mentee_df["mentee_experience_years"] = self.mentee_df.get("experience_level", "").apply(
                encode_experience_level
            )
        self.mentee_df["mentee_experience_years"] = pd.to_numeric(
            self.mentee_df["mentee_experience_years"], errors="coerce"
        ).fillna(0)

    def _load_similarity_model(self):
        if SentenceTransformer is None:
            print("sentence-transformers is not installed; using lexical fallback for local smoke tests.")
            self.model = None
            return
        self.model = SentenceTransformer(self.model_name)

    def _encode(self, texts):
        texts = ["" if is_missing(text) else str(text) for text in texts]
        if self.model is not None:
            return self.model.encode(texts, convert_to_tensor=True)

        # Fixed-size hashing keeps fallback query and mentor vectors compatible.
        vectors = np.zeros((len(texts), 2048), dtype=float)
        for row_index, text in enumerate(texts):
            for token in clean_text(text).split():
                vectors[row_index, hash(token) % vectors.shape[1]] += 1.0
        return vectors

    def _cosine_scores(self, query_embedding, matrix_embeddings):
        if self.model is not None:
            return util.cos_sim(query_embedding, matrix_embeddings)[0].cpu().numpy()

        query = np.asarray(query_embedding[0] if query_embedding.ndim == 2 else query_embedding, dtype=float)
        matrix = np.asarray(matrix_embeddings, dtype=float)
        query_norm = np.linalg.norm(query)
        matrix_norm = np.linalg.norm(matrix, axis=1)
        denom = np.where(matrix_norm * query_norm == 0, 1, matrix_norm * query_norm)
        return matrix.dot(query) / denom

    def _precompute_mentor_embeddings(self):
        self.mentor_role_emb = self._encode(self.mentor_df["match_current_role"].tolist())
        self.mentor_industry_emb = self._encode(self.mentor_df["match_industry"].tolist())
        self.mentor_domain_emb = self._encode(self.mentor_df["match_domain_tag"].tolist())

    def compute_scores_for_mentee(self, mentee_row):
        role_embedding = self._encode([mentee_row.get("match_target_role", "")])
        industry_text = f"{mentee_row.get('match_target_industry', '')} {mentee_row.get('target_company_tier', '')}"
        industry_embedding = self._encode([industry_text])
        domain_embedding = self._encode([mentee_row.get("match_domain_interest", "")])

        role_scores = self._cosine_scores(role_embedding, self.mentor_role_emb)
        industry_scores = self._cosine_scores(industry_embedding, self.mentor_industry_emb)
        domain_scores = self._cosine_scores(domain_embedding, self.mentor_domain_emb)
        retrieval_score = 0.4 * role_scores + 0.3 * industry_scores + 0.3 * domain_scores

        return role_scores, industry_scores, domain_scores, retrieval_score

    def filter_by_experience(self, scored_df, mentee_exp):
        return scored_df[scored_df["experience_years"] >= float(mentee_exp)].copy()

    def _get_mentee_row(self, mentee_id):
        matches = self.mentee_df[self.mentee_df["mentee_id"].astype(str) == str(mentee_id)]
        if matches.empty:
            raise ValueError(f"No mentee found with mentee_id={mentee_id}")
        return matches.iloc[0]

    def get_top_mentors(self, mentee_id, top_k=5):
        mentee_row = self._get_mentee_row(mentee_id)
        role_scores, industry_scores, domain_scores, retrieval_score = self.compute_scores_for_mentee(mentee_row)

        scored = self.mentor_df.copy()
        scored["role_score"] = role_scores
        scored["industry_score"] = industry_scores
        scored["domain_score"] = domain_scores
        scored["retrieval_score"] = retrieval_score
        scored = self.filter_by_experience(scored, mentee_row.get("mentee_experience_years", 0))
        scored["final_score"] = (
            0.7 * scored["retrieval_score"] + 0.2 * scored["rating_norm"] + 0.1 * scored["sessions_norm"]
        )
        scored = scored.sort_values("final_score", ascending=False).head(top_k).copy()
        scored.insert(0, "rank", range(1, len(scored) + 1))

        required_columns = [
            "rank",
            "mentor_id",
            "full_name",
            "profile_pic",
            "hourly_rate",
            "current_role",
            "industry",
            "domain_tag",
            "experience_years",
            "avg_rating",
            "total_sessions",
            "role_score",
            "industry_score",
            "domain_score",
            "retrieval_score",
            "final_score",
            "tech_skills",
            "domain_skills",
            "soft_skills",
        ]
        return scored[[column for column in required_columns if column in scored.columns]]

    def get_skill_gap_recommendations(self, mentee_id, top_mentors_df):
        mentee_row = self._get_mentee_row(mentee_id)
        out_of = len(top_mentors_df)
        recommendations = {}

        for column in ["tech_skills", "domain_skills", "soft_skills"]:
            mentee_skills = parse_skills(mentee_row.get(column, ""))
            counter = Counter()

            for _, mentor in top_mentors_df.iterrows():
                mentor_skills = parse_skills(mentor.get(column, ""))
                counter.update(mentor_skills - mentee_skills)

            recommendations[column] = [
                {"skill": skill, "count": count, "out_of": out_of}
                for skill, count in sorted(counter.items(), key=lambda item: (-item[1], item[0]))
            ]

        return recommendations

    def match_mentee(self, mentee_id, top_k=5):
        mentee_row = self._get_mentee_row(mentee_id)
        top_mentors = self.get_top_mentors(mentee_id, top_k=top_k)
        skill_recommendations = self.get_skill_gap_recommendations(mentee_id, top_mentors)

        mentee_profile = {
            "mentee_id": mentee_row.get("mentee_id", ""),
            "full_name": mentee_row.get("full_name", ""),
            "target_role": mentee_row.get("target_role", ""),
            "target_industry": mentee_row.get("target_industry", ""),
            "target_company_tier": mentee_row.get("target_company_tier", ""),
            "domain_interest": mentee_row.get("domain_interest", ""),
            "experience_level": mentee_row.get("experience_level", ""),
            "mentee_experience_years": mentee_row.get("mentee_experience_years", 0),
        }

        return {
            "mentee": mentee_profile,
            "top_mentors": top_mentors.to_dict(orient="records"),
            "skill_recommendations": skill_recommendations,
        }