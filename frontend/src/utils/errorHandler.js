import { toast } from 'react-toastify';

export const errorHandler = {
  // Handle auth-specific errors
  handleAuthError: (message) => {
    toast.error(message || 'Authentication failed');
  },

  // Handle generic errors
  handleError: (error) => {
    let message = 'An error occurred';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.status === 400) {
      message = 'Invalid request';
    } else if (error.response?.status === 403) {
      message = 'Access denied';
    } else if (error.response?.status === 404) {
      message = 'Not found';
    } else if (error.response?.status === 500) {
      message = 'Server error';
    } else if (error.message === 'Network Error') {
      message = 'Network error - check your connection';
    }

    toast.error(message);
  },

  // Handle success messages
  handleSuccess: (message) => {
    toast.success(message);
  },
};