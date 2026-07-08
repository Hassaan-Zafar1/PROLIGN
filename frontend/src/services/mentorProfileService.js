import api from '../config/api';

/**
 * Mentor profile-building service (Task 4).
 *
 * Wraps the backend endpoint that auto-builds a mentor's structured profile from
 * their uploaded CV (with a compliant-LinkedIn seam on the backend). Keeps this
 * business logic out of components — the onboarding page just calls buildProfile().
 */
export const mentorProfileService = {
  buildProfile: async () => {
    const response = await api.post('/mentors/profile/build');
    // { success, profile, meta, user }
    return response.data;
  },
};
