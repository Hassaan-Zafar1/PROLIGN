/**
 * Flatten a role profile (mentorProfile / menteeProfile) onto the top level of a
 * backend user object.
 *
 * After the backend data-ownership refactor, all role-specific fields live on the
 * populated `mentorProfile` / `menteeProfile` sub-document (1:1 with User), while
 * the dashboards and the profile-completion util were written against the old flat
 * shape (`user.skills`, `user.title`, `user.careerGoals`, …). This hoists those
 * fields up — always preferring a value already present on the user — so the
 * existing UI keeps working without a field-by-field rewrite.
 *
 * It is purely additive: the original `mentorProfile` / `menteeProfile` objects
 * are preserved on the returned copy, so nothing that reads the nested shape breaks.
 */

// Treat null / undefined / '' / [] as "absent" so a real profile value wins.
const has = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
const pick = (primary, fallback) => (has(primary) ? primary : fallback);

export function flattenUserProfile(user) {
  if (!user) return user;

  if (user.role === 'mentor') {
    const mp = user.mentorProfile || {};
    return {
      ...user,
      avatar: user.avatar || user.profilePic || '',
      title: pick(user.title, mp.title || mp.headline),
      headline: pick(user.headline, mp.headline),
      company: pick(user.company, mp.company || mp.currentCompany),
      industry: pick(user.industry, mp.industry || (Array.isArray(mp.industries) ? mp.industries[0] : undefined)),
      bio: pick(user.bio, mp.bio),
      skills: pick(user.skills, mp.skills) || [],
      experience: pick(user.experience, mp.experience) || 0,
      hourlyRate: pick(user.hourlyRate, mp.hourlyRate ?? mp.pricePerSession) || 0,
      certifications: pick(user.certifications, mp.certifications) || [],
      languages: pick(user.languages, mp.languages) || [],
      linkedinUrl: pick(user.linkedinUrl, mp.linkedinUrl),
      availableSlots: pick(user.availableSlots, mp.availableSlots) || [],
      weeklySchedule: pick(user.weeklySchedule, mp.weeklySchedule),
      averageRating: pick(user.averageRating, mp.averageRating) || 0,
      totalSessions: pick(user.totalSessions, mp.totalSessions) || 0,
      status: pick(user.status, mp.status) || 'approved',
      cv: user.cv || mp.cv || null,
      domains: pick(user.domains, mp.domains) || [],
      softSkills: pick(user.softSkills, mp.softSkills) || [],
    };
  }

  if (user.role === 'mentee') {
    const mp = user.menteeProfile || {};
    const skillProfileSkills = mp.skillProfile?.skills;
    return {
      ...user,
      avatar: user.avatar || user.profilePic || '',
      careerGoals: pick(user.careerGoals, mp.careerGoals),
      learningInterests: pick(user.learningInterests, mp.learningInterests) || [],
      skillsToLearn: pick(user.skillsToLearn, has(mp.skillsToLearn) ? mp.skillsToLearn : skillProfileSkills) || [],
      skills: pick(user.skills, skillProfileSkills) || [],
      university: pick(user.university, mp.university),
      degree: pick(user.degree, mp.degree),
      education: pick(user.education, mp.education),
      bio: pick(user.bio, mp.bio),
      softSkills: pick(user.softSkills, mp.softSkills) || [],
      domainInterest: pick(user.domainInterest, mp.domainInterest),
    };
  }

  return user;
}
