import mongoose from "mongoose";
import User from "../models/User.js";
import { logAudit } from "../services/auditLogService.js";

// Fields safe to show an admin (excludes password/tokens/OTP, but includes
// email/status/etc. that public mentor listings must never expose).
const ADMIN_USER_FIELDS =
  "name email role status rejectionReason profilePic title company bio " +
  "skills hourlyRate experience country city linkedinUrl isActive isBanned " +
  "isEmailVerified isProfileComplete createdAt lastLoginAt";

// ─── GET /admin/users ──────────────────────────────────────────────────────────
export async function listUsers(req, res, next) {
  try {
    const { role } = req.query;
    const filter = role ? { role } : { role: { $in: ["mentor", "mentee"] } };

    const users = await User.find(filter).select(ADMIN_USER_FIELDS).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      users: users.map((u) => ({ ...u, id: u._id })),
    });
  } catch (error) {
    next(error);
  }
}

// ─── POST /admin/mentors/:id/approve ───────────────────────────────────────────
export async function approveMentor(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid mentor id." });
    }

    const mentor = await User.findOneAndUpdate(
      { _id: id, role: "mentor" },
      { $set: { status: "approved", rejectionReason: null } },
      { returnDocument: "after" }
    ).select(ADMIN_USER_FIELDS);

    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found." });
    }

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "mentor_approved",
      targetId: mentor._id,
      targetType: "user",
      after: { status: "approved" },
      request: req,
    });

    res.status(200).json({ success: true, message: "Mentor approved.", user: { ...mentor.toObject(), id: mentor._id } });
  } catch (error) {
    next(error);
  }
}

// ─── POST /admin/mentors/:id/reject ────────────────────────────────────────────
export async function rejectMentor(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid mentor id." });
    }

    const mentor = await User.findOneAndUpdate(
      { _id: id, role: "mentor" },
      { $set: { status: "rejected", rejectionReason: reason || null } },
      { returnDocument: "after" }
    ).select(ADMIN_USER_FIELDS);

    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found." });
    }

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "mentor_rejected",
      targetId: mentor._id,
      targetType: "user",
      after: { status: "rejected", reason: reason || null },
      request: req,
    });

    res.status(200).json({ success: true, message: "Mentor rejected.", user: { ...mentor.toObject(), id: mentor._id } });
  } catch (error) {
    next(error);
  }
}

// ─── DELETE /admin/users/:id ───────────────────────────────────────────────────
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }
    if (id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own admin account here." });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "user_deleted",
      targetId: id,
      targetType: "user",
      after: { deleted: true },
      request: req,
    });

    res.status(200).json({ success: true, message: "User deleted." });
  } catch (error) {
    next(error);
  }
}
