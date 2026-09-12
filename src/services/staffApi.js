import api from './api.js';

export const staffApi = {
  getStaffUsers: async (params = {}) => {
    const res = await api.get('/admin/staff', { params });
    return res.data;
  },

  createStaffMember: async (staffData) => {
    const res = await api.post('/admin/staff', staffData);
    return res.data;
  },

  toggleStaffStatus: async (staffId) => {
    const res = await api.patch(`/admin/staff/${staffId}/toggle-status`);
    return res.data;
  },

  getActivityLogs: async (params = {}) => {
    const res = await api.get('/admin/activity-logs', { params });
    return res.data;
  },
};
