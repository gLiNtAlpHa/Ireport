import api from './api';

export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type,
      name: imageFile.fileName || 'profile.jpg',
    });

    const response = await api.post('/users/profile/image', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return response.data;
  },

  async getUserById(userId) {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  },

  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data;
  },

  async getMyIncidents() {
    const response = await api.get('/users/my-incidents');
    return response.data;
  },
};