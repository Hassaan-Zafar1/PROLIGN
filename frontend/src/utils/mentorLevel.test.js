import { describe, it, expect } from 'vitest';
import { getMentorLevel, getMentorLevelStyle, MENTOR_LEVEL_OPTIONS } from './mentorLevel';

// Relative-to-now dates (not hardcoded absolutes) so this test stays valid
// regardless of when it's actually run.
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('getMentorLevel', () => {
  it('returns "Experience Level Unavailable" when no date field is present', () => {
    const result = getMentorLevel({});
    expect(result.level).toBeNull();
    expect(result.label).toBe('Experience Level Unavailable');
  });

  it('returns null level for an unparsable date string', () => {
    const result = getMentorLevel({ registeredAt: 'not-a-date' });
    expect(result.level).toBeNull();
  });

  it('classifies a very recent registration as junior with "Less than a month"', () => {
    const result = getMentorLevel({ registeredAt: daysAgo(2) });
    expect(result.level).toBe('junior');
    expect(result.yearsDisplay).toBe('Less than a month');
  });

  it('classifies ~6 months as junior with a month count', () => {
    const result = getMentorLevel({ registeredAt: daysAgo(180) });
    expect(result.level).toBe('junior');
    expect(result.yearsDisplay).toMatch(/^\d+ months?$/);
  });

  it('classifies ~2 years as intermediate', () => {
    const result = getMentorLevel({ registeredAt: daysAgo(365 * 2) });
    expect(result.level).toBe('intermediate');
    expect(result.label).toBe('Intermediate Mentor');
  });

  it('classifies ~4 years as senior', () => {
    const result = getMentorLevel({ registeredAt: daysAgo(365 * 4) });
    expect(result.level).toBe('senior');
    expect(result.label).toBe('Senior Mentor');
  });

  it('prefers registeredAt over createdAt/enrolledAt/joinedAt', () => {
    const result = getMentorLevel({
      registeredAt: daysAgo(365 * 4), // senior
      createdAt: daysAgo(2),          // would be junior
    });
    expect(result.level).toBe('senior');
  });

  it('falls back to createdAt when registeredAt is absent', () => {
    const result = getMentorLevel({ createdAt: daysAgo(365 * 2) });
    expect(result.level).toBe('intermediate');
  });

  it('includes a human-readable "since" date', () => {
    const result = getMentorLevel({ registeredAt: daysAgo(400) });
    expect(result.since).toMatch(/\d{4}/); // contains a year
  });
});

describe('getMentorLevelStyle', () => {
  it('returns distinct styles for junior/intermediate/senior', () => {
    const junior = getMentorLevelStyle('junior');
    const intermediate = getMentorLevelStyle('intermediate');
    const senior = getMentorLevelStyle('senior');
    expect(junior.wrapper).toContain('secondary');
    expect(intermediate.wrapper).toContain('tertiary');
    expect(intermediate.icon).toBe('trending_up');
    expect(senior.wrapper).toContain('primary');
    expect(senior.icon).toBe('workspace_premium');
  });

  it('returns a neutral fallback style for an unknown/null level', () => {
    const result = getMentorLevelStyle(null);
    expect(result.icon).toBe('help_outline');
  });
});

describe('MENTOR_LEVEL_OPTIONS', () => {
  it('includes an "all" option plus one per level', () => {
    const ids = MENTOR_LEVEL_OPTIONS.map((o) => o.id);
    expect(ids).toEqual(['all', 'junior', 'intermediate', 'senior']);
  });
});
