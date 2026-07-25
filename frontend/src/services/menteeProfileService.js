import api from '../config/api';

export const menteeProfileService = {
  updateProfile: async (profileData) => {
    const response = await api.patch('/mentee-profiles/me', profileData);
    return response.data;
  },
};