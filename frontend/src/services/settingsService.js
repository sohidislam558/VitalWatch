import api from './api';

export const settingsService = {
  async getAlertRules(params = {}) {
    const response = await api.get('/alert-rules', { params });
    return response.data;
  },

  async createAlertRule(data) {
    const response = await api.post('/alert-rules', data);
    return response.data;
  },

  async updateAlertRule(id, data) {
    const response = await api.put(`/alert-rules/${id}`, data);
    return response.data;
  },

  async toggleAlertRule(id, isActive) {
    const response = await api.patch(`/alert-rules/${id}/status`, { is_active: isActive });
    return response.data;
  },
};

export const dashboardService = {
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  async getMonitoringPatients(params = {}) {
    const response = await api.get('/dashboard/patients', { params });
    return response.data;
  },

  async getActiveAlerts(params = {}) {
    const response = await api.get('/dashboard/alerts', { params });
    return response.data;
  },

  async getActivities(params = {}) {
    const response = await api.get('/dashboard/activities', { params });
    return response.data;
  },

  async deleteActivity(id) {
    const response = await api.delete(`/audit-logs/${id}`);
    return response.data;
  },

  async deleteActivitiesByDate(params) {
    const response = await api.post('/audit-logs/delete-by-date', params);
    return response.data;
  },

  async clearAllActivities() {
    const response = await api.delete('/audit-logs/all');
    return response.data;
  },
};

