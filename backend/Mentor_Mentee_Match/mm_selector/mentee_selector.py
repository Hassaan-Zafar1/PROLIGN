"""Read-only queries loading mentee data from OUR OWN mentee_profiles
collection (populated by AI_interviewer after cleaning) - not Node's
menteeprofiles. This removes the cross-service linking handshake: a
completed interview's session_id IS the mentee_id used for matching.
"""

from __future__ import annotations

import pandas as pd


def load_mentee_df(db) -> pd.DataFrame:
    rows = []
    for doc in db["Mentee_Profiles"].find({}):
        rows.append({
            "mentee_id": doc.get("session_id") or str(doc.get("_id", "")),
            "full_name": doc.get("full_name", "") or "",
            "target_role": doc.get("target_role", "") or "",
            "target_industry": doc.get("target_industry", "") or "",
            "target_company_tier": doc.get("target_company_tier", "") or "",
            "domain_interest": doc.get("domain_interest", "") or "",
            "bio": doc.get("bio", "") or "",
            "experience_level": doc.get("experience_level", "") or "",
            "mentee_experience_years": doc.get("mentee_experience_years", 0),
            "tech_skills": doc.get("tech_skills", "") or "",
            "domain_skills": doc.get("domain_skills", "") or "",
            "soft_skills": doc.get("soft_skills", "") or "",
        })
    return pd.DataFrame(rows)
