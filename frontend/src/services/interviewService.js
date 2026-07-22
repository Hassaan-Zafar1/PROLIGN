import api from '../config/api';

/**
 * Mentee interview LINK service.
 *
 * The actual interview (conversation + profile extraction) runs against the
 * Python AI_interviewer service directly from MenteeInterview.jsx — this
 * service is only the last step: telling Node "this sessionId belongs to me"
 * so the Mentee_Profiles doc gets userId + linkedinUrl stamped onto it and
 * the dashboard can find it via GET /auth/me.
 */
export const interviewService = {
  getInterview: async () => {
    const response = await api.get('/interview');
    return response.data; // { success, profile }
  },

  linkInterview: async (sessionId, linkedinUrl) => {
    const response = await api.post('/interview', { sessionId, linkedinUrl });
    return response.data; // { success, message, user, menteeProfile }
  },
};
