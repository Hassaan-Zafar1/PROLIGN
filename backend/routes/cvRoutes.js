import express from 'express';
import upload from '../middleware/cvUpload.js';
import { uploadMentorCv } from '../controllers/cvController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.post('/:mentorId/cv', protect, restrictTo('mentor'), upload.single('cv'), uploadMentorCv);

export default router;