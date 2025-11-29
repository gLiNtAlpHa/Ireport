import React, {createContext, useContext, useState, useEffect} from 'react';
import {adminService} from '../services/adminService';
import {useAuth} from './AuthContext';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({children}) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [trendsData, setTrendsData] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const {isAdmin, isAuthenticated} = useAuth();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    }
  }, [isAuthenticated, isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [stats, analytics, trends, performance, sysInfo] = await Promise.all([
        adminService.getDashboard(),
        adminService.getCategoryAnalytics(),
        adminService.getTrendsAnalytics(30),
        adminService.getPerformanceAnalytics(),
        adminService.getSystemInfo(),
      ]);

      setDashboardStats(stats);
      setCategoryAnalytics(analytics);
      setTrendsData(trends);
      setPerformanceMetrics(performance);
      setSystemInfo(sysInfo);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    try {
      const stats = await adminService.getDashboard();
      setDashboardStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  };

  const moderateIncident = async (incidentId, action, reason = null) => {
    try {
      const result = await adminService.moderateIncident(incidentId, action, reason);
      await refreshDashboard(); // Refresh stats after moderation
      return result;
    } catch (error) {
      throw error;
    }
  };

  const moderateUser = async (userId, action, params = {}) => {
    try {
      let result;
      
      switch (action) {
        case 'activate':
        case 'deactivate':
          result = await adminService.updateUserStatus(userId, action === 'activate', params.reason);
          break;
        case 'make_admin':
        case 'remove_admin':
          result = await adminService.updateUserAdminStatus(userId, action === 'make_admin');
          break;
        case 'delete':
          result = await adminService.deleteUser(userId, params.reason);
          break;
        default:
          throw new Error(`Unknown user action: ${action}`);
      }
      
      await refreshDashboard();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const generateReport = async (type, params = {}) => {
    try {
      let report;
      
      switch (type) {
        case 'incidents':
          report = await adminService.getIncidentsReport(params);
          break;
        case 'users':
          report = await adminService.getUsersReport(params);
          break;
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
      
      return report;
    } catch (error) {
      throw error;
    }
  };

  const getAnalyticsTrends = async (days = 30) => {
    try {
      const trends = await adminService.getTrendsAnalytics(days);
      setTrendsData(trends);
      return trends;
    } catch (error) {
      throw error;
    }
  };

  const cleanupFiles = async (days = 30) => {
    try {
      const result = await adminService.cleanupOldFiles(days);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        dashboardStats,
        categoryAnalytics,
        trendsData,
        performanceMetrics,
        systemInfo,
        loading,
        lastUpdated,
        loadAdminData,
        refreshDashboard,
        moderateIncident,
        moderateUser,
        generateReport,
        getAnalyticsTrends,
        cleanupFiles,
      }}>
      {children}
    </AdminContext.Provider>
  );
};