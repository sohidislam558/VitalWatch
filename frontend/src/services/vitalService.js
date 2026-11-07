import api from './api';

export const vitalService = {
  async getVitals(params = {}) {
    const response = await api.get('/vitals', { params });
    return response.data;
  },

  async recordVitals(data) {
    const response = await api.post('/vitals', data);
    return response.data;
  },

  async getVital(id) {
    const response = await api.get(`/vitals/${id}`);
    return response.data;
  },

  async getPatientHistory(patientId, params = {}) {
    const response = await api.get(`/patients/${patientId}/vitals`, { params });
    return response.data;
  },
};

