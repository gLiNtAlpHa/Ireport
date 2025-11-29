import api from './api';

export const incidentService = {
  async createIncident(incidentData, imageFile = null) {
    const formData = new FormData();
    formData.append('title', incidentData.title);
    formData.append('description', incidentData.description);
    formData.append('category', incidentData.category);
    
    if (incidentData.location) {
      formData.append('location', incidentData.location);
    }

    if (imageFile) {
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.fileName || 'incident.jpg',
      });
    }

    const response = await api.post('/incidents/', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return response.data;
  },

  async getIncidents(params = {}) {
    const response = await api.get('/incidents/', {params});
    return response.data;
  },

  async searchIncidents(searchParams) {
    const response = await api.get('/incidents/search', {params: searchParams});
    return response.data;
  },

  async getIncidentById(incidentId) {
    const response = await api.get(`/incidents/${incidentId}`);
    return response.data;
  },

  async updateIncident(incidentId, updateData) {
    const response = await api.put(`/incidents/${incidentId}`, updateData);
    return response.data;
  },

  async deleteIncident(incidentId) {
    const response = await api.delete(`/incidents/${incidentId}`);
    return response.data;
  },

  async updateIncidentImage(incidentId, imageFile) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type,
      name: imageFile.fileName || 'incident.jpg',
    });

    const response = await api.put(`/incidents/${incidentId}/image`, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return response.data;
  },

  // Comments
  async createComment(incidentId, content) {
    const response = await api.post(`/incidents/${incidentId}/comments`, {
      content,
    });
    return response.data;
  },

  async getComments(incidentId, params = {}) {
    const response = await api.get(`/incidents/${incidentId}/comments`, {
      params,
    });
    return response.data;
  },

  async deleteComment(incidentId, commentId) {
    const response = await api.delete(
      `/incidents/${incidentId}/comments/${commentId}`
    );
    return response.data;
  },

  // Reactions
  async toggleReaction(incidentId, reactionType) {
    const response = await api.post(`/incidents/${incidentId}/reactions`, {
      reaction_type: reactionType,
    });
    return response.data;
  },

  async getReactions(incidentId) {
    const response = await api.get(`/incidents/${incidentId}/reactions`);
    return response.data;
  },
};