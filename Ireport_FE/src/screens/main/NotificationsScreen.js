import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useNotifications} from '../../context/NotificationContext';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeoButton';
import EmptyState from '../../components/UI/EmptyState';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {formatTimeAgo} from '../../utils/helpers';

const NotificationsScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  const NotificationItem = ({notification}) => {
    const handlePress = () => {
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
      
      // Navigate based on notification type
      if (notification.related_incident_id) {
        navigation.navigate('Home', {
          screen: 'IncidentDetails',
          params: {incidentId: notification.related_incident_id},
        });
      }
    };

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'comment':
          return 'comment';
        case 'reaction':
          return 'thumb-up';
        case 'incident_update':
          return 'update';
        case 'admin_notice':
          return 'admin-panel-settings';
        default:
          return 'notifications';
      }
    };

    return (
      <NeumorphicCard 
        style={[
          styles.notificationCard,
          !notification.is_read && {borderLeftColor: theme.colors.primary, borderLeftWidth: 4}
        ]}
        onPress={handlePress}
        pressable>
        
        <View style={styles.notificationHeader}>
          <View style={styles.notificationLeft}>
            <Icon 
              name={getNotificationIcon(notification.type)} 
              size={20} 
              color={theme.colors.primary} 
            />
            <View style={styles.notificationContent}>
              <Text style={[
                styles.notificationTitle, 
                {
                  color: theme.colors.text,
                  fontWeight: notification.is_read ? '500' : 'bold'
                }
              ]}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationMessage, {color: theme.colors.textSecondary}]}>
                {notification.message}
              </Text>
              <Text style={[styles.notificationTime, {color: theme.colors.textSecondary}]}>
                {formatTimeAgo(notification.created_at)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => clearNotification(notification.id)}>
            <Icon name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {!notification.is_read && (
          <View style={[styles.unreadDot, {backgroundColor: theme.colors.primary}]} />
        )}
      </NeumorphicCard>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <NeumorphicButton
            title="Mark All Read"
            onPress={markAllAsRead}
            variant="secondary"
            style={styles.markAllButton}
            textStyle={styles.markAllText}
          />
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={({item}) => <NotificationItem notification={item} />}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadNotifications}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-none"
            title="No Notifications"
            subtitle="You're all caught up! New notifications will appear here."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    minHeight: 36,
  },
  markAllText: {
    fontSize: 12,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  notificationCard: {
    marginBottom: 12,
    padding: 16,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationContent: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
  },
  clearButton: {
    padding: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default NotificationsScreen;