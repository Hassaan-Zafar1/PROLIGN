"""Read-only MongoDB Atlas Vector Search queries against the `faqs` collection.

One-time setup in MongoDB Atlas before using this:
  1. Run migrate_faqs_to_mongo.py to populate the faqs collection.
  2. In Atlas UI: your cluster -> Atlas Search -> Create Search Index
     -> Atlas Vector Search -> JSON Editor
     Database: Prolign  |  Collection: faqs  |  Index name: faq_vector_index
     Paste:
     {
       "fields": [
         {
           "type": "vector",
           "path": "embedding",
           "numDimensions": 384,
           "similarity": "cosine"
         }
       ]
     }
  3. Wait ~2 minutes for status to show Active.
"""

from __future__ import annotations

from core.config import settings
from core.database import get_db
from core.exceptions import DatabaseError


async def search_faqs(embedding: list[float], top_k: int | None = None) -> list[dict]:
    """Return raw FAQ documents ranked by vector similarity."""
    db = get_db()
    count = top_k or settings.faq_match_count

    pipeline = [
        {
            "$vectorSearch": {
                "index": "faq_vector_index",
                "path": "embedding",
                "queryVector": embedding,
                "numCandidates": count * 10,
                "limit": count,
            }
        },
        {"$addFields": {"similarity": {"$meta": "vectorSearchScore"}}},
        {"$match": {"similarity": {"$gte": settings.faq_match_threshold}}},
        {
            "$project": {
                "_id": 0,
                "question": 1,
                "answer": 1,
                "category": 1,
                "tags": 1,
                "similarity": 1,
            }
        },
    ]

    try:
        cursor = db.faqs.aggregate(pipeline)
        return await cursor.to_list(length=count)
    except Exception as exc:
        raise DatabaseError("MongoDB vector search failed.") from exc
