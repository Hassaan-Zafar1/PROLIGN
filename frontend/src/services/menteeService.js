import api from '../config/api';
import { errorHandler } from '../utils/errorHandler';

export const menteeService = {
  // Get mentee profile
  getMenteeProfile: async () => {
    try {
      const response = await api.get('/api/mentees/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update mentee profile
  updateMenteeProfile: async (profileData) => {
    try {
      const response = await api.put('/api/mentees/profile', profileData);
      errorHandler.handleSuccess('Mentee profile updated');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Book a session
  bookSession: async (mentorId, slotId) => {
    try {
      const response = await api.post('/api/mentees/book-session', {
        mentorId,
        slotId,
      });
      errorHandler.handleSuccess('Session booked successfully');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get booked sessions
  getBookedSessions: async () => {
    try {
      const response = await api.get('/api/mentees/sessions');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};