import api from '../config/api';

export const reviewService = {
  createReview: async (payload) => {
    const response = await api.post('/reviews', payload);
    return response.data;
  },

  getReviews: async (params = {}) => {
    const response = await api.get('/reviews', { params });
    return response.data;
  }
};
