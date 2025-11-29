import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authService} from '../services/authService';
import {notificationService} from '../services/notificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkAuthState();
    setupPushNotifications();
  }, []);

  const checkAuthState = async () => {
    try {
      const [savedToken, savedUser] = await AsyncStorage.multiGet([
        'auth_token',
        'user_data',
      ]);
      
      if (savedToken[1] && savedUser[1]) {
        setToken(savedToken[1]);
        setUser(JSON.parse(savedUser[1]));
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupPushNotifications = async () => {
    try {
      const hasPermission = await notificationService.requestPermission();
      if (hasPermission) {
        await notificationService.saveTokenToServer();
      }
    } catch (error) {
      console.log('Error setting up push notifications:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      await AsyncStorage.multiSet([
        ['auth_token', response.access_token],
        ['user_data', JSON.stringify(response.user)],
      ]);
      
      setToken(response.access_token);
      setUser(response.user);
      
      // Setup push notifications after login
      await notificationService.saveTokenToServer();
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.log('Error during server logout:', error);
    } finally {
      await AsyncStorage.multiRemove([
        'auth_token',
        'user_data',
        'fcm_token',
      ]);
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const updatedUser = {...user, ...updatedUserData};
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.log('Error updating user data:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      
      await AsyncStorage.multiSet([
        ['auth_token', response.access_token],
        ['user_data', JSON.stringify(response.user)],
      ]);
      
      setToken(response.access_token);
      setUser(response.user);
      
      return response;
    } catch (error) {
      await logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isOnline,
        login,
        register,
        logout,
        updateUser,
        refreshToken,
        isAuthenticated: !!user,
        isAdmin: user?.is_admin || false,
      }}>
      {children}
    </AuthContext.Provider>
  );
};