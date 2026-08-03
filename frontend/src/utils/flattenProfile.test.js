import { describe, it, expect } from 'vitest';
import { flattenUserProfile } from './flattenProfile';

describe('flattenUserProfile', () => {
  it('returns falsy input unchanged', () => {
    expect(flattenUserProfile(null)).toBeNull();
    expect(flattenUserProfile(undefined)).toBeUndefined();
  });

  it('returns a non-mentor/mentee user unchanged (e.g. admin)', () => {
    const admin = { role: 'admin', name: 'Admin User' };
    expect(flattenUserProfile(admin)).toEqual(admin);
  });

  describe('mentor role', () => {
    it('pulls fields up from mentorProfile when absent on the user', () => {
      const user = {
        role: 'mentor',
        mentorProfile: { title: 'Backend Engineer', bio: 'Loves APIs', skills: ['Node.js'], hourlyRate: 40 },
      };
      const flat = flattenUserProfile(user);
      expect(flat.title).toBe('Backend Engineer');
      expect(flat.bio).toBe('Loves APIs');
      expect(flat.skills).toEqual(['Node.js']);
      expect(flat.hourlyRate).toBe(40);
    });

    it('prefers a value already present on the user over the mentorProfile fallback', () => {
      const user = {
        role: 'mentor',
        title: 'User-level Title',
        mentorProfile: { title: 'Profile-level Title' },
      };
      expect(flattenUserProfile(user).title).toBe('User-level Title');
    });

    it('falls back to headline when mentorProfile has no title', () => {
      const user = { role: 'mentor', mentorProfile: { headline: 'A great headline' } };
      expect(flattenUserProfile(user).title).toBe('A great headline');
    });

    it('falls back to currentCompany.name when mentorProfile has no company', () => {
      const user = { role: 'mentor', mentorProfile: { currentCompany: { name: 'Acme Corp' } } };
      expect(flattenUserProfile(user).company).toBe('Acme Corp');
    });

    it('falls back to the first entry of industries[] when industry is absent', () => {
      const user = { role: 'mentor', mentorProfile: { industries: ['Fintech', 'Healthtech'] } };
      expect(flattenUserProfile(user).industry).toBe('Fintech');
    });

    it('falls back to pricePerSession when hourlyRate is absent', () => {
      const user = { role: 'mentor', mentorProfile: { pricePerSession: 75 } };
      expect(flattenUserProfile(user).hourlyRate).toBe(75);
    });

    it('defaults array fields to [] and status to "approved" when nothing is set', () => {
      const flat = flattenUserProfile({ role: 'mentor', mentorProfile: {} });
      expect(flat.skills).toEqual([]);
      expect(flat.certifications).toEqual([]);
      expect(flat.domains).toEqual([]);
      expect(flat.status).toBe('approved');
    });

    it('preserves the original mentorProfile object on the returned copy', () => {
      const mentorProfile = { title: 'X' };
      const flat = flattenUserProfile({ role: 'mentor', mentorProfile });
      expect(flat.mentorProfile).toBe(mentorProfile);
    });
  });

  describe('mentee role', () => {
    it('falls back to menteeProfile.full_name for name', () => {
      const user = { role: 'mentee', menteeProfile: { full_name: 'Jane Mentee' } };
      expect(flattenUserProfile(user).name).toBe('Jane Mentee');
    });

    it('falls back to target_role for careerGoals', () => {
      const user = { role: 'mentee', menteeProfile: { target_role: 'Backend Engineer' } };
      expect(flattenUserProfile(user).careerGoals).toBe('Backend Engineer');
    });

    it('splits pipe-joined skill strings into arrays', () => {
      const user = { role: 'mentee', menteeProfile: { tech_skills: 'React | Node.js | AWS' } };
      const flat = flattenUserProfile(user);
      expect(flat.skillsToLearn).toEqual(['React', 'Node.js', 'AWS']);
      expect(flat.skills).toEqual(['React', 'Node.js', 'AWS']);
    });

    it('returns an empty array (not a one-item array with an empty string) for an empty/absent pipe field', () => {
      const user = { role: 'mentee', menteeProfile: { tech_skills: '' } };
      expect(flattenUserProfile(user).skills).toEqual([]);
    });

    it('builds education from degree + university when user has no education field', () => {
      const user = { role: 'mentee', menteeProfile: { degree: 'BS CS', university: 'MIT' } };
      expect(flattenUserProfile(user).education).toBe('BS CS — MIT');
    });

    it('falls back to domain_interest (as a single-item array) when domain_skills is empty', () => {
      const user = { role: 'mentee', menteeProfile: { domain_interest: 'Web Development' } };
      expect(flattenUserProfile(user).learningInterests).toEqual(['Web Development']);
    });
  });
});
