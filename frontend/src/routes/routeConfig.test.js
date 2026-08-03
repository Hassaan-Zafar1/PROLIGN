import { describe, it, expect } from 'vitest';
import { pathForRoute, routeKeyForPath, homeRouteKeyForUser, homePathForUser } from './routeConfig';

describe('pathForRoute', () => {
  it('maps static page-keys to their paths', () => {
    expect(pathForRoute('login')).toBe('/login');
    expect(pathForRoute('mentor-dashboard')).toBe('/mentor/dashboard');
    expect(pathForRoute('find-mentors')).toBe('/find-mentors');
  });

  it('builds a parameterized mentorProfile path', () => {
    expect(pathForRoute('mentorProfile', { mentorId: 'abc123' })).toBe('/mentor/abc123');
  });

  it('builds a parameterized booking path', () => {
    expect(pathForRoute('booking', { mentorId: 'abc123' })).toBe('/book/abc123');
  });

  it('builds a parameterized video-interview path', () => {
    expect(pathForRoute('video-interview', { sessionId: 'sess1' })).toBe('/video-interview/sess1');
  });

  it('falls back to the static path when a parameterized page-key has no matching params', () => {
    expect(pathForRoute('mentorProfile')).toBe('/');
  });

  it('falls back to "/" for a completely unknown page-key', () => {
    expect(pathForRoute('not-a-real-page')).toBe('/');
  });
});

describe('routeKeyForPath', () => {
  it('maps exact static paths back to their page-key', () => {
    expect(routeKeyForPath('/login')).toBe('login');
    expect(routeKeyForPath('/mentor/dashboard')).toBe('mentor-dashboard');
  });

  it('does not confuse /mentor/dashboard or /mentor/onboarding with a mentor profile', () => {
    expect(routeKeyForPath('/mentor/dashboard')).toBe('mentor-dashboard');
    expect(routeKeyForPath('/mentor/onboarding')).toBe('mentor-onboarding');
  });

  it('matches a parameterized mentor profile path', () => {
    expect(routeKeyForPath('/mentor/abc123')).toBe('mentorProfile');
  });

  it('matches a parameterized booking path', () => {
    expect(routeKeyForPath('/book/abc123')).toBe('booking');
  });

  it('matches a parameterized video-interview path', () => {
    expect(routeKeyForPath('/video-interview/sess1')).toBe('video-interview');
  });

  it('falls back to "home" for an unrecognized path', () => {
    expect(routeKeyForPath('/some/random/path')).toBe('home');
  });
});

describe('homeRouteKeyForUser', () => {
  it('returns "home" for no user', () => {
    expect(homeRouteKeyForUser(null)).toBe('home');
  });

  it('sends a mentor to their dashboard regardless of approval status', () => {
    expect(homeRouteKeyForUser({ role: 'mentor' })).toBe('mentor-dashboard');
  });

  it('sends an admin to the admin dashboard', () => {
    expect(homeRouteKeyForUser({ role: 'admin' })).toBe('admindashboard');
  });

  it('sends a mentee with an incomplete profile to the interview', () => {
    expect(homeRouteKeyForUser({ role: 'mentee', isProfileComplete: false })).toBe('interview');
  });

  it('sends a mentee with a complete profile to their dashboard', () => {
    expect(homeRouteKeyForUser({ role: 'mentee', isProfileComplete: true })).toBe('mentee-dashboard');
  });
});

describe('homePathForUser', () => {
  it('composes homeRouteKeyForUser + pathForRoute', () => {
    expect(homePathForUser({ role: 'mentor' })).toBe('/mentor/dashboard');
    expect(homePathForUser(null)).toBe('/');
  });
});
