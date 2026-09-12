import api from './api.js';

export const marketingApi = {
  // Coupons
  getCoupons: async () => {
    const res = await api.get('/coupons');
    return res.data;
  },

  createCoupon: async (couponData) => {
    const res = await api.post('/coupons', couponData);
    return res.data;
  },

  updateCoupon: async (id, couponData) => {
    const res = await api.patch(`/coupons/${id}`, couponData);
    return res.data;
  },

  toggleCouponStatus: async (id) => {
    const res = await api.patch(`/coupons/${id}/toggle-status`);
    return res.data;
  },

  // Reviews Moderation
  getReviewsForModeration: async (params = {}) => {
    const res = await api.get('/reviews/moderation', { params });
    return res.data;
  },

  moderateReview: async (id, status) => {
    const res = await api.patch(`/reviews/${id}/moderate`, { status });
    return res.data;
  },
};
