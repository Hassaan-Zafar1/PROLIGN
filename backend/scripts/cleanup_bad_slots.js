import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".", ".env") });

import Session from "../models/Session.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Delete bad slots
  const slotRes = await AvailabilitySlot.deleteMany({
    date: new Date("2026-01-01T00:00:00.000Z")
  });
  console.log(`Deleted ${slotRes.deletedCount} bad slots.`);

  // Delete bad sessions
  const sessionRes = await Session.deleteMany({
    scheduledDate: new Date("2026-01-01T08:00:00.000Z")
  });
  console.log(`Deleted ${sessionRes.deletedCount} bad sessions.`);

  await mongoose.disconnect();
}

run().catch(console.error);
