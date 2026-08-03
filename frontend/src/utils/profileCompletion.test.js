import { describe, it, expect } from 'vitest';
import { getMentorProfileCompletion } from './profileCompletion';

describe('getMentorProfileCompletion', () => {
  it('reports 0% and all fields missing for an empty user', () => {
    const result = getMentorProfileCompletion({});
    expect(result.percent).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.total).toBe(10);
    expect(result.missing).toHaveLength(10);
  });

  it('reports 100% when every field is present', () => {
    const result = getMentorProfileCompletion({
      name: 'Jane Doe',
      title: 'Senior Engineer',
      company: 'Acme',
      bio: 'A short bio.',
      skills: ['React'],
      experience: 5,
      hourlyRate: 50,
      certifications: ['AWS'],
      profilePic: 'https://example.com/pic.jpg',
      linkedinUrl: 'https://linkedin.com/in/jane',
    });
    expect(result.percent).toBe(100);
    expect(result.completedCount).toBe(10);
    expect(result.missing).toEqual([]);
  });

  it('treats an empty skills/certifications array as missing', () => {
    const result = getMentorProfileCompletion({ skills: [], certifications: [] });
    expect(result.missing).toContain('Skills');
    expect(result.missing).toContain('Certifications');
  });

  it('treats experience/hourlyRate of 0 as missing (falsy numeric check)', () => {
    const result = getMentorProfileCompletion({ experience: 0, hourlyRate: 0 });
    expect(result.missing).toContain('Years of experience');
    expect(result.missing).toContain('Hourly rate');
  });

  it('accepts avatar as an alternative to profilePic for the photo field', () => {
    const result = getMentorProfileCompletion({ avatar: 'https://example.com/a.png' });
    expect(result.missing).not.toContain('Profile photo');
  });

  it('computes a correct partial percentage', () => {
    // 5 of 10 fields present -> 50%
    const result = getMentorProfileCompletion({
      name: 'Jane', title: 'Engineer', company: 'Acme', bio: 'Bio', skills: ['X'],
    });
    expect(result.percent).toBe(50);
    expect(result.completedCount).toBe(5);
  });
});
