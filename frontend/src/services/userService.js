import api from './api';

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getUser(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(data) {
    const response = await api.post('/users', data);
    return response.data;
  },

  async updateUser(id, data) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async toggleStatus(id, status) {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  async getAuditLogs(params = {}) {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },
};

