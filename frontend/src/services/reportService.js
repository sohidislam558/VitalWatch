import api from './api';

export const reportService = {
  async getReportPreview(patientId, params = {}) {
    const response = await api.get(`/reports/patients/${patientId}`, { params });
    return response.data;
  },

  async downloadReportPdf(patientId, params = {}) {
    const response = await api.get(`/reports/patients/${patientId}/pdf`, {
      params,
      responseType: 'blob',
    });

    // Create download trigger
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VitalWatch-Report-PAT-${patientId}-${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

