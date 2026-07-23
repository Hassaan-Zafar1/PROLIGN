import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".", ".env") });

import AvailabilitySlot from "../models/AvailabilitySlot.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const mentorId = "6a4fc504f397e9ced5e3a6af";
  const slots = await AvailabilitySlot.find({ mentorId }).lean();
  console.log(`Found ${slots.length} slots for mentor ${mentorId}:`);
  console.log(JSON.stringify(slots, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
