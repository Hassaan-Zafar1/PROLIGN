"""
Seed script: reads faqs_seed.json, generates embeddings with all-MiniLM-L6-v2,
and inserts all FAQ documents into MongoDB Atlas (prolign.faqs collection).

No Supabase dependency. Run this once to populate the faqs collection,
or re-run any time you update faqs_seed.json.

Usage (from inside backend/chatbot with venv activated):
    python migrate_faqs_to_mongo.py
"""

import asyncio
import json
import os
from datetime import UTC, datetime
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from sentence_transformers import SentenceTransformer

load_dotenv()

MONGODB_URI = os.environ["MONGODB_URI"]
MONGODB_DB = os.getenv("MONGODB_DB_NAME", "prolign")
SEED_FILE = Path(__file__).parent / "faqs_seed.json"


async def main() -> None:
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print(f"Reading {SEED_FILE}...")
    with open(SEED_FILE, encoding="utf-8") as f:
        rows = json.load(f)
    print(f"Found {len(rows)} FAQ entries in seed file.")

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB]

    # Drop and recreate to avoid duplicates on re-run
    await db.faqs.drop()
    print("Cleared existing faqs collection.")

    docs = []
    for i, row in enumerate(rows, 1):
        text = f"{row.get('question', '')} {row.get('answer', '')}".strip()
        vector = model.encode(text, normalize_embeddings=True)
        docs.append({
            "question": row.get("question", ""),
            "answer": row.get("answer", ""),
            "category": row.get("category"),
            "tags": row.get("tags", []),
            "helpful_count": row.get("helpful_count", 0),
            "embedding": [float(v) for v in vector],
            "created_at": datetime.now(UTC),
        })
        print(f"  [{i}/{len(rows)}] Embedded: {row.get('question', '')[:60]}")

    if docs:
        await db.faqs.insert_many(docs)
        print(f"\nInserted {len(docs)} FAQ documents into {MONGODB_DB}.faqs.")

    client.close()
    print("\nDone.")
    print("Next: create a Vector Search index in MongoDB Atlas.")
    print("  Database:   prolign")
    print("  Collection: faqs")
    print("  Index name: faq_vector_index")
    print("  Field:      embedding | dimensions: 384 | similarity: cosine")


if __name__ == "__main__":
    asyncio.run(main())