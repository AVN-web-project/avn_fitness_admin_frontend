import api from './api.js';

export const financeApi = {
  /**
   * Get high-level financial summary & revenue analytics
   */
  getFinancialSummary: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },

  /**
   * Get tabulated list of all payments processed on the platform
   */
  getPaymentsList: async (params = {}) => {
    const res = await api.get('/admin/payments', { params });
    return res.data;
  },

  /**
   * Get return and cancellation requests workflow list
   */
  getReturnsAndCancellations: async (params = {}) => {
    const res = await api.get('/admin/returns-cancellations', { params });
    return res.data;
  },

  /**
   * Review return request (approve / reject)
   */
  reviewReturnRequest: async (orderId, data) => {
    const res = await api.post(`/operations/orders/${orderId}/returns/review`, data);
    return res.data;
  },

  /**
   * Process / Record refund for returned or cancelled order
   */
  recordRefund: async (orderId, refundData) => {
    const res = await api.post(`/operations/orders/${orderId}/refund`, refundData);
    return res.data;
  },
};

export default financeApi;
