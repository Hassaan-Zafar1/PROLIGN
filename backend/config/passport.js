import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { env } from "./env.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        // Check if user already exists
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          // Existing user — link Google ID if they registered manually before
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = "google";
            user.isEmailVerified = true; // Google already verified their email
            await user.save();
          }
          return done(null, user);
        }

        // New user via Google — role will be set on frontend redirect
        // We create with a temporary role; user picks role after OAuth
        user = await User.create({
          email,
          googleId: profile.id,
          authProvider: "google",
          isEmailVerified: true, // Google verified
          role: "mentee", // Default; can be changed during onboarding
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;