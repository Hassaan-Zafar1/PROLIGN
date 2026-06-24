export const tokenManager = {
  // Store access token
  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token);
  },

  // Retrieve access token
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Clear all tokens
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  // Store user data
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get stored user
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};