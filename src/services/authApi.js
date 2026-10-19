import api from './api.js';

export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/auth/profile', data);
    return res.data;
  },

  // portal: 'admin' tells the backend to reset a staff/admin account and to
  // point the emailed link at the admin portal rather than the storefront.
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email, portal: 'admin' });
    return res.data;
  },

  resetPassword: async (email, token, password) => {
    const res = await api.post('/auth/reset-password', { email, token, password, portal: 'admin' });
    return res.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};
