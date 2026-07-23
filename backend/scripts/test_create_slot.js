import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".", ".env") });

import AvailabilitySlot from "../models/AvailabilitySlot.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const doc = await AvailabilitySlot.create({
    mentorId: new mongoose.Types.ObjectId(),
    slotType: "recurring",
    dayOfWeek: 1,
    startTime: "12:00",
    endTime: "13:00",
    status: "available"
  });

  console.log("Created Document:");
  console.log(JSON.stringify(doc.toObject(), null, 2));

  // Clean it up
  await AvailabilitySlot.deleteOne({ _id: doc._id });
  console.log("Cleaned up document.");

  await mongoose.disconnect();
}

run().catch(console.error);
