import api from './api';

export const admissionService = {
  async getAdmissions(params = {}) {
    const response = await api.get('/admissions', { params });
    return response.data;
  },

  async getBeds(ward) {
    const params = ward ? { ward } : {};
    const response = await api.get('/admissions/beds', { params });
    return response.data;
  },

  async getAdmission(id) {
    const response = await api.get(`/admissions/${id}`);
    return response.data;
  },

  async admitPatient(data) {
    const response = await api.post('/admissions', data);
    return response.data;
  },

  async dischargePatient(id) {
    const response = await api.patch(`/admissions/${id}/discharge`);
    return response.data;
  },

  async requestIcuTransfer(id, data = {}) {
    const response = await api.post(`/admissions/${id}/request-icu-transfer`, data);
    return response.data;
  },

  async completeIcuTransfer(id, data) {
    const response = await api.post(`/admissions/${id}/complete-icu-transfer`, data);
    return response.data;
  },

  async cancelIcuTransfer(id) {
    const response = await api.post(`/admissions/${id}/cancel-icu-transfer`);
    return response.data;
  },

  async requestStepDown(id, data = {}) {
    const response = await api.post(`/admissions/${id}/request-step-down`, data);
    return response.data;
  },

  async completeStepDown(id, data) {
    const response = await api.post(`/admissions/${id}/complete-step-down`, data);
    return response.data;
  },

  async cancelStepDown(id) {
    const response = await api.post(`/admissions/${id}/cancel-step-down`);
    return response.data;
  },
};

