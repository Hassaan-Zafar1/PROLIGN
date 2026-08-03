import { describe, it, expect, beforeEach } from 'vitest';
import { tokenManager } from './tokenManager';

// jsdom (Vitest's test environment) provides a real, working localStorage,
// so this needs no mocking at all — just isolation between tests.
beforeEach(() => {
  localStorage.clear();
});

describe('tokenManager', () => {
  it('round-trips an access token', () => {
    tokenManager.setAccessToken('abc.def.ghi');
    expect(tokenManager.getAccessToken()).toBe('abc.def.ghi');
  });

  it('returns null when no access token is stored', () => {
    expect(tokenManager.getAccessToken()).toBeNull();
  });

  it('round-trips a user object (JSON serialized)', () => {
    const user = { id: '1', name: 'Jane', role: 'mentee' };
    tokenManager.setUser(user);
    expect(tokenManager.getUser()).toEqual(user);
  });

  it('returns null when no user is stored', () => {
    expect(tokenManager.getUser()).toBeNull();
  });

  it('clearTokens removes both the access token and the user', () => {
    tokenManager.setAccessToken('abc');
    tokenManager.setUser({ id: '1' });
    tokenManager.clearTokens();
    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getUser()).toBeNull();
  });

  it('isAuthenticated is false with no token, true once one is set', () => {
    expect(tokenManager.isAuthenticated()).toBe(false);
    tokenManager.setAccessToken('abc');
    expect(tokenManager.isAuthenticated()).toBe(true);
  });
});
