import api from './api';

export const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.data?.token) {
      sessionStorage.setItem('vitalwatch_token', response.data.data.token);
      sessionStorage.setItem('vitalwatch_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.data?.token) {
      sessionStorage.setItem('vitalwatch_token', response.data.data.token);
      sessionStorage.setItem('vitalwatch_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('vitalwatch_token');
      sessionStorage.removeItem('vitalwatch_user');
    }
  },

  async me() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getCurrentUser() {
    const raw = sessionStorage.getItem('vitalwatch_user');
    return raw ? JSON.parse(raw) : null;
  },

  getToken() {
    return sessionStorage.getItem('vitalwatch_token');
  },
};

