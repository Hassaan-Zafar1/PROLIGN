import api from '../config/api';
import { normalizeMentor } from './mentorService';

/**
 * Mentor recommendation service (Task 8) — the architectural SEAM for the future
 * AI recommendation model.
 *
 * TODAY it returns all mentors (backend `/mentors/recommended`), matching the
 * spec's "initially display all mentors". LATER, when ~500+ mentors exist, the
 * backend swaps in the trained model — this service's contract is unchanged, so
 * the dashboard needs no edits. `menteeContext` (skills, interests, careerGoals,
 * menteeId) is forwarded now (ignored server-side today) so personalization
 * requires zero frontend change when the model is enabled.
 */
export const recommendationService = {
  getRecommendedMentors: async ({ limit = 24, ...menteeContext } = {}) => {
    const response = await api.get('/mentors/recommended', {
      params: { limit, ...menteeContext },
    });
    const mentors = (response.data.mentors || []).map(normalizeMentor);
    return { mentors, strategy: response.data.strategy };
  },
};
