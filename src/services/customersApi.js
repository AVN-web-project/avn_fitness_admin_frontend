import api from './api.js';

export const customersApi = {
  getCustomers: async (params = {}) => {
    const res = await api.get('/admin/users', {
      params: { ...params, role: 'user' },
    });
    return res.data;
  },

  toggleCustomerStatus: async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/toggle-status`);
    return res.data;
  },
};
