import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".", ".env") });

import AvailabilitySlot from "../models/AvailabilitySlot.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const indexes = await AvailabilitySlot.collection.indexes();
  console.log("Indexes on AvailabilitySlot:");
  console.log(JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
