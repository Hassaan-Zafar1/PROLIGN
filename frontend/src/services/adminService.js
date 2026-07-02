import api from '../config/api';

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  approveMentor: async (id) => {
    const response = await api.post(`/admin/approve-mentor/${id}`);
    return response.data;
  },

  rejectMentor: async (id) => {
    const response = await api.post(`/admin/reject-mentor/${id}`);
    return response.data;
  },
};
