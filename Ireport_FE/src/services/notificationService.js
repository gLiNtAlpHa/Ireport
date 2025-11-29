import api from './api';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const notificationService = {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications/', {params});
    return response.data;
  },

  async markNotificationRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllNotificationsRead() {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Push Notifications
  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  },

  async getToken() {
    return await messaging().getToken();
  },

  async saveTokenToServer() {
    try {
      const token = await this.getToken();
      if (token) {
        // Save token to backend for push notifications
        await api.post('/notifications/register-token', {
          fcm_token: token,
          platform: Platform.OS,
        });
        await AsyncStorage.setItem('fcm_token', token);
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  },

  onMessage(callback) {
    return messaging().onMessage(callback);
  },

  onNotificationOpenedApp(callback) {
    messaging().onNotificationOpenedApp(callback);
  },

  getInitialNotification() {
    return messaging().getInitialNotification();
  },

  setBackgroundMessageHandler(handler) {
    messaging().setBackgroundMessageHandler(handler);
  },
};
