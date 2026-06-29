import api from '../config/api';
import { tokenManager } from '../utils/tokenManager';
import { errorHandler } from '../utils/errorHandler';

export const authService = {
  // Register new user — pass full userData object
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      errorHandler.handleSuccess('Registration successful! Check your email for OTP.');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify OTP — pass as object
  verifyOTP: async (userId, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { userId, otp });
      const { accessToken, user } = response.data;
      tokenManager.setAccessToken(accessToken);
      tokenManager.setUser(user);
      errorHandler.handleSuccess('Email verified! Welcome!');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend OTP
  resendOTP: async (userId) => {
    try {
      const response = await api.post('/auth/resend-otp', { userId });
      errorHandler.handleSuccess('OTP resent to your email');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login — pass as object
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);

      // If email not verified, backend returns userId for OTP flow
      if (response.data.userId) {
        return response.data;
      }

      const { accessToken, user } = response.data;
      tokenManager.setAccessToken(accessToken);
      tokenManager.setUser(user);
      errorHandler.handleSuccess('Logged in successfully!');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
      tokenManager.clearTokens();
      errorHandler.handleSuccess('Logged out successfully');
    } catch (error) {
      tokenManager.clearTokens();
      throw error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken } = response.data;
      tokenManager.setAccessToken(accessToken);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      errorHandler.handleSuccess('Password reset link sent to your email');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password — pass as object
  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      errorHandler.handleSuccess('Password reset successfully! Please login.');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  // Google login redirect
  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  },
};