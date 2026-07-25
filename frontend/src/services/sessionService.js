import api from '../config/api';

export const sessionService = {
  getSessions: async (params = {}) => {
    const response = await api.get('/sessions', { params });
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await api.get(`/sessions/${id}`);
    return response.data.data;
  },

  updateSession: async (id, payload) => {
    const response = await api.patch(`/sessions/${id}`, payload);
    return response.data.data;
  },

  deleteSession: async (id) => {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
  }
};
