import api from './api.js';

export const supportApi = {
  getSupportQueue: async (params = {}) => {
    const res = await api.get('/support/operations/queue', { params });
    return res.data;
  },

  getTicketDetails: async (ticketId) => {
    const res = await api.get(`/support/${ticketId}`);
    return res.data;
  },

  updateTicketStatus: async (ticketId, status, priority) => {
    const res = await api.patch(`/support/operations/${ticketId}/status`, { status, priority });
    return res.data;
  },

  replyToTicket: async (ticketId, message) => {
    const res = await api.post(`/support/${ticketId}/reply`, { message });
    return res.data;
  },
};
