/**
 * mentorLevel.js
 * -------------------------------------------------------
 * Pure utility — computes a mentor's experience level
 * based solely on their existing registration date.
 *
 * Rules:
 *   0 – 1 year       → Junior Mentor
 *   > 1 – 3 years    → Intermediate Mentor
 *   > 3 years        → Senior Mentor
 *   missing date     → { level: null, label: 'Experience Level Unavailable' }
 *
 * NO new database field is introduced.
 * NO manual editing of the level is possible.
 * The level updates automatically as time passes.
 */

export const MENTOR_LEVEL_OPTIONS = [
  { id: 'all',          label: 'All Mentors' },
  { id: 'junior',       label: 'Junior Mentors' },
  { id: 'intermediate', label: 'Intermediate Mentors' },
  { id: 'senior',       label: 'Senior Mentors' },
];

/**
 * Returns the computed mentor level info for a given mentor object.
 *
 * @param {Object} mentor - A mentor user object from the data layer.
 * @returns {{
 *   level:        'junior' | 'intermediate' | 'senior' | null,
 *   label:        string,
 *   yearsDisplay: string,
 *   since:        string,
 *   exact:        number   // fractional years since registration
 * }}
 */
export function getMentorLevel(mentor) {
  // Use the first available date field
  const rawDate =
    mentor?.registeredAt ||
    mentor?.createdAt    ||
    mentor?.enrolledAt   ||
    mentor?.joinedAt     ||
    null;

  if (!rawDate) {
    return {
      level: null,
      label: 'Experience Level Unavailable',
      yearsDisplay: '',
      since: '',
      exact: 0,
    };
  }

  const registered = new Date(rawDate);
  if (isNaN(registered.getTime())) {
    return {
      level: null,
      label: 'Experience Level Unavailable',
      yearsDisplay: '',
      since: '',
      exact: 0,
    };
  }

  const now = new Date();
  const diffMs = now - registered;
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);

  let level, label;
  if (diffYears <= 1) {
    level = 'junior';
    label = 'Junior Mentor';
  } else if (diffYears <= 3) {
    level = 'intermediate';
    label = 'Intermediate Mentor';
  } else {
    level = 'senior';
    label = 'Senior Mentor';
  }

  // Human-readable duration
  let yearsDisplay;
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  if (totalMonths < 1) {
    yearsDisplay = 'Less than a month';
  } else if (totalMonths < 12) {
    yearsDisplay = `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
  } else {
    const yrs = Math.floor(diffYears);
    yearsDisplay = `${yrs} year${yrs !== 1 ? 's' : ''}`;
  }

  const since = registered.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return { level, label, yearsDisplay, since, exact: diffYears };
}

/**
 * Returns Tailwind-compatible badge style classes for a given level.
 * Works in both light and dark themes via CSS custom properties.
 */
export function getMentorLevelStyle(level) {
  switch (level) {
    case 'junior':
      return {
        wrapper: 'bg-secondary/10 text-secondary border border-secondary/20',
        icon: null,
        dot: 'bg-secondary',
      };
    case 'intermediate':
      return {
        wrapper: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
        icon: 'trending_up',
        dot: 'bg-tertiary',
      };
    case 'senior':
      return {
        wrapper: 'bg-primary/10 text-primary border border-primary/20',
        icon: 'workspace_premium',
        dot: 'bg-primary',
      };
    default:
      return {
        wrapper: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20',
        icon: 'help_outline',
        dot: 'bg-outline-variant',
      };
  }
}
