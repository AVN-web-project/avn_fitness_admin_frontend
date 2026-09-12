import api from './api.js';

export const dashboardApi = {
  getAdminAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },

  getOperationsDashboard: async () => {
    const res = await api.get('/operations/dashboard');
    return res.data;
  },
};
