import api from '../config/api';

export const userService = {
  updateProfile: async (profileData) => {
    const response = await api.patch('/user/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/user/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/user/account');
    return response.data;
  },
};