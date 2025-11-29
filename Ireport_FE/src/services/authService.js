import api from './api';

export const authService = {
  async login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', null, {
      params: {token}
    });
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', {email});
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};