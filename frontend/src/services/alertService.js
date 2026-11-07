import api from './api';

export const alertService = {
  async getAlerts(params = {}) {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  async getAlert(id) {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },

  async markDoctorInAction(id, note = '') {
    const response = await api.patch(`/alerts/${id}/doctor-in-action`, { note });
    return response.data;
  },

  async markAssessmentDone(id, note = '') {
    const response = await api.patch(`/alerts/${id}/assessment-done`, { note });
    return response.data;
  },

  async acknowledgeAlert(id, note = '') {
    const response = await api.patch(`/alerts/${id}/acknowledge`, { note });
    return response.data;
  },

  async resolveAlert(id, note = '') {
    const response = await api.patch(`/alerts/${id}/resolve`, { note });
    return response.data;
  },

  async getAlertHistory(id) {
    const response = await api.get(`/alerts/${id}/history`);
    return response.data;
  },
};

