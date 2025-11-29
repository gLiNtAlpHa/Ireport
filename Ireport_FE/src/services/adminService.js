import api from './api';

export const adminService = {
  // Dashboard & Analytics
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  async getCategoryAnalytics() {
    const response = await api.get('/admin/analytics/categories');
    return response.data;
  },

  async getTrendsAnalytics(days = 30) {
    const response = await api.get('/admin/analytics/trends', {
      params: {days},
    });
    return response.data;
  },

  async getPerformanceAnalytics() {
    const response = await api.get('/admin/analytics/performance');
    return response.data;
  },

  // User Management
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', {params});
    return response.data;
  },

  async getUserDetails(userId) {
    const response = await api.get(`/admin/users/${userId}/details`);
    return response.data;
  },

  async updateUserStatus(userId, isActive, reason = null) {
    const response = await api.put(`/admin/users/${userId}/status`, null, {
      params: {is_active: isActive, reason},
    });
    return response.data;
  },

  async updateUserAdminStatus(userId, isAdmin) {
    const response = await api.put(`/admin/users/${userId}/admin-status`, null, {
      params: {is_admin: isAdmin},
    });
    return response.data;
  },

  async deleteUser(userId, reason = null) {
    const response = await api.delete(`/admin/users/${userId}`, {
      params: {reason},
    });
    return response.data;
  },

  // Incident Moderation
  async getIncidentsForModeration(params = {}) {
    const response = await api.get('/admin/incidents', {params});
    return response.data;
  },

  async moderateIncident(incidentId, action, reason = null, notifyUser = true) {
    const response = await api.put(`/admin/incidents/${incidentId}/moderate`, {
      action,
      reason,
      notify_user: notifyUser,
    });
    return response.data;
  },

  async bulkModerateIncidents(action, itemIds, reason = null) {
    const response = await api.post('/admin/incidents/bulk-moderate', {
      action,
      item_ids: itemIds,
      reason,
    });
    return response.data;
  },

  // Comment Moderation
  async getCommentsForModeration(params = {}) {
    const response = await api.get('/admin/comments', {params});
    return response.data;
  },

  async moderateComment(commentId, action, reason = null) {
    const response = await api.put(`/admin/comments/${commentId}/moderate`, {
      action,
      reason,
    });
    return response.data;
  },

  // System Management
  async getSystemInfo() {
    const response = await api.get('/admin/system/info');
    return response.data;
  },

  async getSystemLogs(params = {}) {
    const response = await api.get('/admin/logs', {params});
    return response.data;
  },

  async initializeAdminSystem() {
    const response = await api.post('/admin/init');
    return response.data;
  },

  // File Management
  async getFileStats() {
    const response = await api.get('/admin/files/stats');
    return response.data;
  },

  async cleanupOldFiles(days = 30) {
    const response = await api.post('/admin/files/cleanup', null, {
      params: {days},
    });
    return response.data;
  },

  // Reports
  async getIncidentsReport(params = {}) {
    const response = await api.get('/admin/reports/incidents', {params});
    return response.data;
  },

  async getUsersReport(params = {}) {
    const response = await api.get('/admin/reports/users', {params});
    return response.data;
  },
};