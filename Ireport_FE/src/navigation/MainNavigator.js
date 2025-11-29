import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {useNotifications} from '../context/NotificationContext';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import CreateIncidentScreen from '../screens/main/CreateIncidentScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

// Detail Screens
import IncidentDetailsScreen from '../screens/main/IncidentDetailsScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import MyIncidentsScreen from '../screens/main/MyIncidentsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminIncidentsScreen from '../screens/admin/AdminIncidentsScreen';
import AdminCommentsScreen from '../screens/admin/AdminCommentsScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
const HomeStack = () => {
  const {theme} = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
      }}>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="IncidentDetails" 
        component={IncidentDetailsScreen}
        options={{title: 'Incident Details'}}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{title: 'User Profile'}}
      />
    </Stack.Navigator>
  );
};

// Search Stack
const SearchStack = () => {
  const {theme} = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
      }}>
      <Stack.Screen 
        name="SearchMain" 
        component={SearchScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="IncidentDetails" 
        component={IncidentDetailsScreen}
        options={{title: 'Incident Details'}}
      />
    </Stack.Navigator>
  );
};

// Profile Stack
const ProfileStack = () => {
  const {theme} = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
      }}>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{title: 'Edit Profile'}}
      />
      <Stack.Screen 
        name="MyIncidents" 
        component={MyIncidentsScreen}
        options={{title: 'My Reports'}}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{title: 'Settings'}}
      />
    </Stack.Navigator>
  );
};

// Admin Stack
const AdminStack = () => {
  const {theme} = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
      }}>
      <Stack.Screen 
        name="AdminMain" 
        component={AdminDashboardScreen} 
        options={{title: 'Admin Dashboard'}} 
      />
      <Stack.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen}
        options={{title: 'User Management'}}
      />
      <Stack.Screen 
        name="AdminIncidents" 
        component={AdminIncidentsScreen}
        options={{title: 'Incident Moderation'}}
      />
      <Stack.Screen 
        name="AdminComments" 
        component={AdminCommentsScreen}
        options={{title: 'Comment Moderation'}}
      />
      <Stack.Screen 
        name="AdminAnalytics" 
        component={AdminAnalyticsScreen}
        options={{title: 'Analytics'}}
      />
      <Stack.Screen 
        name="AdminReports" 
        component={AdminReportsScreen}
        options={{title: 'Reports'}}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const {unreadCount} = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Search':
              iconName = 'search';
              break;
            case 'Create':
              iconName = 'add-circle';
              break;
            case 'Notifications':
              iconName = 'notifications';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Admin':
              iconName = 'admin-panel-settings';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <Icon 
              name={iconName} 
              size={size} 
              color={color}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}>
      
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{title: 'Home'}}
      />
      
      <Tab.Screen 
        name="Search" 
        component={SearchStack}
        options={{title: 'Search'}}
      />
      
      <Tab.Screen 
        name="Create" 
        component={CreateIncidentScreen}
        options={{title: 'Report'}}
      />
      
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Updates',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount.toString()) : null,
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{title: 'Profile'}}
      />
      
      {user?.is_admin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminStack}
          options={{title: 'Admin'}}
        />
      )}
    </Tab.Navigator>
  );
};

export default MainNavigator;
