import api from '../config/api';

/**
 * Mentee interview service (Task 7).
 *
 * Persists the text-based onboarding interview responses. No LLM involved yet —
 * this just stores the Q&A framework's answers so the future AI model can
 * process them. Keeps API calls out of components.
 */
export const interviewService = {
  getInterview: async () => {
    const response = await api.get('/interview');
    return response.data; // { success, assessment }
  },

  // answers: [{ id, question, answer }]
  submitInterview: async (answers, mode = 'text') => {
    const response = await api.post('/interview', { answers, mode });
    return response.data; // { success, assessment, user }
  },
};
