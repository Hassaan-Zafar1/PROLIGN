/**
 * One-off migration: copy every collection from the accidental 'test' database
 * into 'Prolign', so nothing registered/created before the dbName fix is lost.
 *
 * Run from the backend directory (uses the native MongoDB driver, not Mongoose,
 * so it works regardless of whether models are registered):
 *
 *   node scripts/migrateTestToProlign.js
 *
 * Safe to re-run: uses insertMany with ordered:false so it skips docs that
 * already exist (by _id) in the destination rather than erroring out.
 */
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

const SOURCE_DB = "test";
const DEST_DB = env.MONGO_DB_NAME; // should be "Prolign"

async function run() {
  const client = new MongoClient(env.MONGO_URI);
  await client.connect();
  console.log(`✅ Connected. Migrating '${SOURCE_DB}' → '${DEST_DB}'`);

  const sourceDb = client.db(SOURCE_DB);
  const destDb = client.db(DEST_DB);

  const collections = await sourceDb.listCollections().toArray();
  if (collections.length === 0) {
    console.log(`Nothing to migrate — '${SOURCE_DB}' has no collections.`);
    await client.close();
    return;
  }

  for (const { name } of collections) {
    const docs = await sourceDb.collection(name).find({}).toArray();
    if (docs.length === 0) {
      console.log(`  ${name}: empty, skipping`);
      continue;
    }
    try {
      const result = await destDb.collection(name).insertMany(docs, { ordered: false });
      console.log(`  ${name}: inserted ${result.insertedCount}/${docs.length}`);
    } catch (err) {
      // BulkWriteError from duplicate _ids on a re-run — report and continue.
      const inserted = err.result?.insertedCount ?? 0;
      console.log(`  ${name}: inserted ${inserted}/${docs.length} (${docs.length - inserted} already existed)`);
    }
  }

  console.log("\n✅ Migration pass complete.");
  console.log(`Verify with: use ${DEST_DB} in mongosh, then show collections / countDocuments per collection.`);
  console.log(`Once verified, you can drop '${SOURCE_DB}' manually if you're confident it's no longer needed:`);
  console.log(`  mongosh, then: use ${SOURCE_DB}; db.dropDatabase();`);

  await client.close();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});