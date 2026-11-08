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
};

