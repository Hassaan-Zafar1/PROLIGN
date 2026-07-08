import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def check():
    c = AsyncIOMotorClient(os.environ["MONGODB_URI"])
    db_name = os.getenv("MONGODB_DB_NAME", "Prolign")
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