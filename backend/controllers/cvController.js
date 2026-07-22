import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MentorProfile from '../models/MentorProfile.js';
import { extractTextFromPdf } from '../services/pdfTextService.js';
import {
  extractStructuredData,
  normalizeWorkExperience,
  normalizeEducation,
  computeTotalExperience,
} from '../services/cvParserService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'cvs');

export async function uploadMentorCv(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CV file uploaded. Field name must be "cv".' });
    }

    const { mentorId } = req.params;

    // A mentor can only upload their own CV — prevents mentor A from
    // overwriting mentor B's profile just by knowing/guessing their ID.
    if (req.user._id.toString() !== mentorId) {
      return res.status(403).json({ error: 'You can only upload a CV to your own profile.' });
    }

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const safeName = `${mentorId}_${Date.now()}.pdf`;
    fs.writeFileSync(path.join(UPLOAD_DIR, safeName), req.file.buffer);

    const rawText = await extractTextFromPdf(req.file.buffer);
    const structured = await extractStructuredData(rawText);
    const workExperience = normalizeWorkExperience(structured.workExperience);
    const education = normalizeEducation(structured.education);
    const experience = computeTotalExperience(workExperience);

    const current = workExperience.find((w) => w.isCurrent) || workExperience[0];
    const currentCompany = current
      ? {
          name: current.companyName,
          role: current.role,
          yearsOfExp: current.startDate
            ? new Date().getFullYear() - current.startDate.getFullYear()
            : 0,
        }
      : undefined;

    const update = {
      cv: {
        url: `/uploads/cvs/${safeName}`,
        filename: req.file.originalname,
        uploadedAt: new Date(),
        parsedText: rawText,
      },
      bio: structured.bio,
      headline: structured.headline,
      title: structured.title,
      company: structured.company,
      industry: structured.industry,
      experience,
      skills: structured.skills,
      domains: structured.domains,
      industries: structured.industries,
      softSkills: structured.softSkills,
      languages: structured.languages,
      certifications: structured.certifications,
      workExperience,
      education,
      ...(currentCompany && { currentCompany }),
    };

    const updated = await MentorProfile.findOneAndUpdate(
      { userId: mentorId },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Mentor profile not found for this user.' });
    }

    return res.status(200).json({ message: 'CV parsed and profile updated.', profile: updated });
  } catch (err) {
    console.error('CV parsing failed:', err);
    return res.status(500).json({ error: 'Failed to parse CV.', details: err.message });
  }
}