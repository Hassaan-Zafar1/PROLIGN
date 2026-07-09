/**
 * Create (or reset) the platform admin account.
 *
 * Registration only creates mentors/mentees, so the single admin is seeded here.
 * Run from the backend directory:
 *
 *   node scripts/createAdmin.js
 *   node scripts/createAdmin.js admin@prolign.com "MyStrongPass1!" "Site Admin"
 *
 * Or via env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.
 * The password is hashed by the User model's pre-save hook. The account is
 * created already email-verified so it can log in immediately.
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../models/User.js";

const email = process.argv[2] || process.env.ADMIN_EMAIL || "admin@prolign.com";
const password = process.argv[3] || process.env.ADMIN_PASSWORD || "Admin@12345";
const name = process.argv[4] || process.env.ADMIN_NAME || "ProLign Admin";

async function run() {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME }); // <-- fix: was defaulting to 'test'
  console.log(`✅ Connected to MongoDB (${env.MONGO_DB_NAME})`);

  let user = await User.findOne({ email }).select("+password");

  if (user) {
    user.role = "admin";
    user.name = name;
    user.password = password;      // re-hashed by the pre-save hook
    user.isEmailVerified = true;
    user.isActive = true;
    user.isBanned = false;
    await user.save();
    console.log(`♻️  Existing account promoted/reset as admin: ${email}`);
  } else {
    user = await User.create({
      email,
      password,                    // hashed by the pre-save hook
      role: "admin",
      name,
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`✅ Admin created: ${email}`);
  }

  console.log("\nLogin with:");
  console.log(`   email:    ${email}`);
  console.log(`   password: ${password}`);
  console.log("\n⚠️  Change this password after first login.");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Failed to create admin:", err.message);
  process.exit(1);
});