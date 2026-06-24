import api from '../config/api';
import { errorHandler } from '../utils/errorHandler';

export const userService = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/api/users/profile', userData);
      errorHandler.handleSuccess('Profile updated successfully');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload profile picture
  uploadProfilePic: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePic', file);
      const response = await api.post('/api/users/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      errorHandler.handleSuccess('Profile picture updated');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};