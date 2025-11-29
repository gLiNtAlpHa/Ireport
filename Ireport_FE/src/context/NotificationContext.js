import React, {createContext, useContext, useState, useEffect} from 'react';
import {notificationService} from '../services/notificationService';
import {useAuth} from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({children}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const {isAuthenticated} = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      setupPushNotificationHandlers();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const notifs = await notificationService.getNotifications({
        limit: 50,
        unread_only: false,
      });
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupPushNotificationHandlers = () => {
    // Handle notifications when app is in foreground
    const unsubscribeForeground = notificationService.onMessage(
      (remoteMessage) => {
        console.log('Foreground notification:', remoteMessage);
        addNotification(remoteMessage);
      }
    );

    // Handle notification press when app is in background
    notificationService.onNotificationOpenedApp((remoteMessage) => {
      console.log('Background notification opened:', remoteMessage);
      handleNotificationPress(remoteMessage);
    });

    // Handle notification when app was opened from quit state
    notificationService
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Quit state notification:', remoteMessage);
          handleNotificationPress(remoteMessage);
        }
      });

    return unsubscribeForeground;
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      title: notification.notification?.title || 'New Notification',
      message: notification.notification?.body || '',
      type: notification.data?.type || 'general',
      is_read: false,
      created_at: new Date().toISOString(),
      related_incident_id: notification.data?.incident_id || null,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleNotificationPress = (notification) => {
    // Handle navigation based on notification type
    const {data} = notification;
    
    if (data?.incident_id) {
      // Navigate to incident details
      // This would be implemented with your navigation system
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationRead(notificationId);
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? {...notif, is_read: true} : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      
      setNotifications(prev =>
        prev.map(notif => ({...notif, is_read: true}))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.is_read ? prev - 1 : prev;
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        addNotification,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};
