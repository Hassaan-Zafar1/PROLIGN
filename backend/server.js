import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import "./config/passport.js";
import { extractClientInfo } from "./middleware/auth.js";

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// In development, Vite silently picks the next free port (5174, 5175, ...)
// whenever 5173 is already taken by another running dev server — a single
// hardcoded FRONTEND_URL then rejects every request with an opaque CORS error
// that looks like a backend outage. Accept any localhost port in dev; in
// production this still strictly allows only the configured FRONTEND_URL.
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // same-origin / server-to-server / curl requests
  if (origin === env.FRONTEND_URL) return true;
  if (env.NODE_ENV !== "production" && /^https?:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // Allow cookies (refresh token)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(extractClientInfo);
// ─── Global Rate Limiter ──────────────────────────────────────────────────────
// 100 req/15min is far too low for active local development (a single page can
// fire several /api calls, and the auth flow alone makes multiple) — it caused
// intermittent 429s that surfaced as "registration failed / no OTP". Use a
// generous cap in dev and the strict production value only in production.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down." },
});
app.use("/api", globalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ProLign API is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),  
  });
});

// ─── Routes (add here as you build them) ──────────────────────────────────────
import authRoutes from "./routes/auth.js";
app.use("/api/auth", authRoutes);
import userRoutes from "./routes/user.js";
app.use("/api/user", userRoutes);
import mentorRoutes from "./routes/mentor.js";
app.use("/api/mentors", mentorRoutes);
import interviewRoutes from "./routes/interview.js";
app.use("/api/interview", interviewRoutes);
import adminRoutes from "./routes/admin.js";
app.use("/api/admin", adminRoutes);

// ─── Core-entity CRUD (Postman-testable) ──────────────────────────────────────
import availabilityRoutes from "./routes/availability.js";
app.use("/api/availability", availabilityRoutes);
import sessionRoutes from "./routes/sessions.js";
app.use("/api/sessions", sessionRoutes);
import paymentRoutes from "./routes/payments.js";
app.use("/api/payments", paymentRoutes);
import reviewRoutes from "./routes/reviews.js";
app.use("/api/reviews", reviewRoutes);
import notificationRoutes from "./routes/notifications.js";
app.use("/api/notifications", notificationRoutes);
import chatRoutes from "./routes/chat.js";
app.use("/api/chat", chatRoutes);
import mentorProfileRoutes from "./routes/mentorProfiles.js";
app.use("/api/mentor-profiles", mentorProfileRoutes);
import menteeProfileRoutes from "./routes/menteeProfiles.js";
app.use("/api/mentee-profiles", menteeProfileRoutes);

// ─── 404 + Error Handler (must be last) ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  async function shutdown(signal) {
    console.log(`\n📴 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log("✅ Server closed");
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer();