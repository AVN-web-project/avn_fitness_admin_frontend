import api from './api.js';

export const ordersApi = {
  getOrders: async (params = {}) => {
    const res = await api.get('/operations/orders', { params });
    return res.data;
  },

  updateOrderStatus: async (orderId, orderStatus) => {
    const res = await api.patch(`/operations/orders/${orderId}/status`, { orderStatus });
    return res.data;
  },

  dispatchOrder: async (orderId, shipmentData) => {
    const res = await api.patch(`/operations/orders/${orderId}/dispatch`, shipmentData);
    return res.data;
  },

  confirmDelivery: async (orderId, remarks = '') => {
    const res = await api.patch(`/operations/orders/${orderId}/deliver`, { remarks });
    return res.data;
  },

  reviewReturnRequest: async (orderId, data) => {
    const res = await api.post(`/operations/orders/${orderId}/returns/review`, data);
    return res.data;
  },

  recordRefund: async (orderId, refundData) => {
    const res = await api.post(`/operations/orders/${orderId}/refund`, refundData);
    return res.data;
  },
};
