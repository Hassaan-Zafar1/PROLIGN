import api from '../config/api';

export const adminService = {
  getUsers: async (role) => {
    const response = await api.get('/admin/users', { params: role ? { role } : undefined });
    return response.data;
  },

  approveMentor: async (id) => {
    const response = await api.post(`/admin/mentors/${id}/approve`);
    return response.data;
  },

  rejectMentor: async (id, reason) => {
    const response = await api.post(`/admin/mentors/${id}/reject`, { reason });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};
