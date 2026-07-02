// // backend/config/seedAdmin.js
// import bcrypt from "bcryptjs";
// // Adjust the path below to wherever your User model file lives inside /models
// import User from "../models/User.js";

// export async function createInitialAdmin() {
//     try {
        
//        const admin = await User.findOne({ email: "Admin4@prolign.com" });
//        console.log(admin);

//         // 2. Hash your admin password securely
//         // Tip: You can also pull these defaults from your env config if preferred
//         const hashedPassword = await bcrypt.hash("admin1", 6);

//         // 3. Create the document matching your User schema configuration
//         const defaultAdmin = await User.create({
//             name: "Super Admin",
//             email: "admin10@prolign.com",
//             password: "Admin5293@",
//             role: "admin",

//             // Optional overrides
//             isEmailVerified: true,
//             isProfileComplete: true,
//             onboardingStep: "complete",
//             isActive: true,

//             // Optional admin-specific settings
//             profileVisibility: "public",
//         });

//         await defaultAdmin.save();
//         console.log("✨ Default admin account seeded successfully!");
//     } catch (error) {
//         console.error("❌ Failed to seed default admin:", error.message);
//     }
// }
