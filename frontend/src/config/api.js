import axios from "axios";
import { tokenManager } from '../utils/tokenManager';
import { errorHandler } from '../utils/errorHandler';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // Allow cookies to be sent
  // Without this, a hung backend request (e.g. a slow external fetch inside a
  // controller) leaves the caller waiting forever with no error and no UI
  // recovery. 20s is generous for normal API calls but still bounds the wait.
  timeout: 20000,
});

// Request Interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle token refresh & errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 20000 }
        );

        const { accessToken } = response.data;
        tokenManager.setAccessToken(accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        tokenManager.clearTokens();
        errorHandler.handleAuthError('Session expired. Please login again.');
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    errorHandler.handleError(error);
    return Promise.reject(error);
  }
);

export default api;