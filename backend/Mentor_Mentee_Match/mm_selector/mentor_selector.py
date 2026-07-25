"""Read-only queries loading mentor data from Node's mentorprofiles collection."""

from __future__ import annotations

import pandas as pd


def load_mentor_df(db) -> pd.DataFrame:
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
