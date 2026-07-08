import express from "express";
import { protect } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
} from "../controllers/sessionController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listSessions)
  .post(createSession);

router.route("/:id")
  .get(validateObjectId, getSession)
  .patch(validateObjectId, updateSession)
  .delete(validateObjectId, deleteSession);

export default router;
