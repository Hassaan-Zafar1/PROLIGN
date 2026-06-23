import mongoose from "mongoose";
import { env } from "./env.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function connectDB(attempt = 1) {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    setupListeners();
  } catch (error) {
    console.error(`❌ Connection attempt ${attempt} failed: ${error.message}`);
    if (attempt >= MAX_RETRIES) {
      console.error("💀 All retries exhausted. Exiting.");
      process.exit(1);
    }
    const delay = RETRY_DELAY_MS * attempt;
    console.log(`⏳ Retrying in ${delay / 1000}s...`);
    await new Promise((res) => setTimeout(res, delay));
    return connectDB(attempt + 1);
  }
}

function setupListeners() {
  mongoose.connection.on("disconnected", () =>
    console.warn("⚠️  MongoDB disconnected")
  );
  mongoose.connection.on("reconnected", () =>
    console.log("✅ MongoDB reconnected")
  );
  mongoose.connection.on("error", (err) =>
    console.error(`❌ MongoDB error: ${err.message}`)
  );
}

async function disconnectDB() {
  await mongoose.connection.close();
  console.log("✅ MongoDB closed gracefully");
}

export { connectDB, disconnectDB };