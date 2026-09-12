import api from './api.js';

export const financeApi = {
  getFinancialSummary: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },

  recordRefund: async (orderId, refundData) => {
    const res = await api.post(`/operations/orders/${orderId}/refund`, refundData);
    return res.data;
  },
};
