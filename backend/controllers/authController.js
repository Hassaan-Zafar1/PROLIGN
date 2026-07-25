import * as authService from "../services/authService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { env } from "../config/env.js";

// Response-layer concern: set the httpOnly refresh cookie.
function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const register = asyncHandler(async (req, res) => {
  const { userId, message } = await authService.register(req.body, req);
  res.status(201).json({ success: true, message, userId });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.verifyEmail(req.body, req);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, message: "Email verified successfully.", accessToken, user });
});

export const resendOTP = asyncHandler(async (req, res) => {
  const { message } = await authService.resendOTP(req.body);
  res.status(200).json({ success: true, message });
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body, req);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, message: "Login successful.", accessToken, user });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken: rotated } = await authService.rotateRefresh(req.cookies?.refreshToken);
  setRefreshCookie(res, rotated);
  res.status(200).json({ success: true, accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.refreshToken);
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message: "Logged out successfully." });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { message } = await authService.forgotPassword(req.body);
  res.status(200).json({ success: true, message });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { message } = await authService.resetPassword(req.body, req);
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user);
  res.status(200).json({ success: true, user });
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.issueGoogleSession(req.user._id);
  setRefreshCookie(res, refreshToken);

  const redirectURL = new URL(`${env.FRONTEND_URL}/auth/callback`);
  redirectURL.searchParams.set("token", accessToken);
  redirectURL.searchParams.set("isProfileComplete", user.isProfileComplete);
  redirectURL.searchParams.set("role", user.role);
  res.redirect(redirectURL.toString());
});
