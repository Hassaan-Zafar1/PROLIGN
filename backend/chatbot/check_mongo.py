import asyncio
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")

async def check():
    c = AsyncIOMotorClient(os.environ.get("MONGO_URI") or os.environ.get("MONGODB_URI"))
    db_name = os.getenv("MONGO_DB_NAME") or os.getenv("MONGODB_DB_NAME") or "prolign"
    db = c[db_name]

    faqs = await db.faqs.count_documents({})
    print(f"Database: {db_name}")
    print(f"FAQ count: {faqs}")

    colls = await db.list_collection_names()
    print(f"Collections: {colls}")

    doc = await db.faqs.find_one({}, {"_id": 0, "question": 1, "embedding": 1})
    if doc:
        emb = doc.get("embedding", [])
        print(f"Sample question: {doc.get('question')}")
        print(f"Embedding length: {len(emb)}")
    else:
        print("NO DOCUMENTS FOUND IN faqs")

    c.close()

asyncio.run(check())