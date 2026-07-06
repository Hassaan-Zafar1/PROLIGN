"""
Upload a CSV (mentor/mentee dataset) into MongoDB Atlas.

Usage:
    python upload_csv_to_mongo.py --csv mentors.csv --collection mentors
    python upload_csv_to_mongo.py --csv mentees.csv --collection mentees

Install deps:
    pip install pymongo pandas python-dotenv
"""

import argparse
import os
import sys
from pathlib import Path
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")

def upload_csv(csv_path: str, db_name: str, collection_name: str, mongo_uri: str, clear_existing: bool = False):
    if not os.path.exists(csv_path):
        sys.exit(f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)
    df = df.where(pd.notnull(df), None)  # NaN -> None for Mongo
    records = df.to_dict(orient="records")

    if not records:
        sys.exit("CSV is empty, nothing to upload.")

    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]

    if clear_existing:
        deleted = collection.delete_many({}).deleted_count
        print(f"Cleared {deleted} existing documents from '{collection_name}'.")

    result = collection.insert_many(records)
    print(f"Inserted {len(result.inserted_ids)} documents into '{db_name}.{collection_name}'.")

    client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload CSV data to MongoDB")
    parser.add_argument("--csv", required=True, help="Path to CSV file")
    parser.add_argument("--db", default=os.getenv("MONGO_DB_NAME") or os.getenv("MONGO_DB_NAME", "prolign"), help="Database name")
    parser.add_argument("--collection", required=True, help="Collection name (e.g. mentors, mentees)")
    parser.add_argument(
        "--uri",
        default=os.getenv("MONGO_URI") or os.getenv("MONGODB_URI"),
        help="MongoDB connection URI (or set MONGO_URI in .env)",
    )
    parser.add_argument("--clear", action="store_true", help="Delete existing docs in collection before upload")

    args = parser.parse_args()

    if not args.uri:
        sys.exit("No MongoDB URI provided. Pass --uri or set MONGO_URI in a .env file.")

    upload_csv(args.csv, args.db, args.collection, args.uri, args.clear)