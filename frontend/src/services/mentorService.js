import api from '../config/api';
import { errorHandler } from '../utils/errorHandler';

export const mentorService = {
  // Get all mentors
  getAllMentors: async () => {
    try {
      const response = await api.get('/api/mentors');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get mentor profile
  getMentorProfile: async (mentorId) => {
    try {
      const response = await api.get(`/api/mentors/${mentorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update mentor profile
  updateMentorProfile: async (profileData) => {
    try {
      const response = await api.put('/api/mentors/profile', profileData);
      errorHandler.handleSuccess('Mentor profile updated');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get mentor availability slots
  getAvailabilitySlots: async () => {
    try {
      const response = await api.get('/api/mentors/availability');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};