/**
 * Reusable profile-completion computation.
 *
 * Operates on the backend user shape returned by /auth/me, so the dashboard's
 * "Profile Completion" is genuinely backend-driven. Kept as a pure util so it
 * can be reused by settings, the mentor card, etc.
 */

const MENTOR_FIELDS = [
  { key: 'name', label: 'Full name', has: (u) => !!u?.name },
  { key: 'title', label: 'Professional title', has: (u) => !!u?.title },
  { key: 'company', label: 'Company', has: (u) => !!u?.company },
  { key: 'bio', label: 'Bio / summary', has: (u) => !!u?.bio },
  { key: 'skills', label: 'Skills', has: (u) => (u?.skills?.length || 0) > 0 },
  { key: 'experience', label: 'Years of experience', has: (u) => (u?.experience || 0) > 0 },
  { key: 'hourlyRate', label: 'Hourly rate', has: (u) => (u?.hourlyRate || 0) > 0 },
  { key: 'certifications', label: 'Certifications', has: (u) => (u?.certifications?.length || 0) > 0 },
  { key: 'profilePic', label: 'Profile photo', has: (u) => !!(u?.profilePic || u?.avatar) },
  { key: 'linkedinUrl', label: 'LinkedIn profile', has: (u) => !!u?.linkedinUrl },
];

export function getMentorProfileCompletion(user) {
  const total = MENTOR_FIELDS.length;
  const completed = MENTOR_FIELDS.filter((f) => f.has(user));
  const missing = MENTOR_FIELDS.filter((f) => !f.has(user)).map((f) => f.label);
  return {
    percent: Math.round((completed.length / total) * 100),
    completedCount: completed.length,
    total,
    missing,
  };
}
