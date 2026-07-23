import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".", ".env") });

import Session from "../models/Session.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  console.log("\n=== ALL TEMPLATES ===");
  const templates = await AvailabilitySlot.find({ date: { $exists: false } }).lean();
  console.log(JSON.stringify(templates, null, 2));

  console.log("\n=== ALL CONCRETE SLOTS ===");
  const slots = await AvailabilitySlot.find({ date: { $exists: true } }).lean();
  console.log(JSON.stringify(slots, null, 2));

  console.log("\n=== ALL SESSIONS ===");
  const sessions = await Session.find({}).lean();
  console.log(JSON.stringify(sessions, null, 2));

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB.");
}

run().catch(console.error);
