import React, {createContext, useContext, useState, useEffect} from 'react';
import {incidentService} from '../services/incidentService';
import {offlineService} from '../services/offlineService';
import {useAuth} from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({children}) => {
  const [incidents, setIncidents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [offlineActionsCount, setOfflineActionsCount] = useState(0);
  const {isAuthenticated} = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadIncidents();
      checkOfflineActions();
      setupOfflineSync();
    }
  }, [isAuthenticated, filters]);

  useEffect(() => {
    const unsubscribe = offlineService.onConnectionChange((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable);
      
      if (state.isConnected && state.isInternetReachable) {
        syncOfflineActions();
      }
    });

    return unsubscribe;
  }, []);

  const loadIncidents = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = {
        ...filters,
        limit: 20,
        offset: refresh ? 0 : incidents.length,
      };

      const newIncidents = await incidentService.getIncidents(params);
      
      if (refresh) {
        setIncidents(newIncidents);
      } else {
        setIncidents(prev => [...prev, ...newIncidents]);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkOfflineActions = async () => {
    const actions = await offlineService.getOfflineActions();
    setOfflineActionsCount(actions.length);
  };

  const setupOfflineSync = () => {
    // Sync offline actions every minute when online
    const interval = setInterval(async () => {
      if (isOnline) {
        await syncOfflineActions();
      }
    }, 60000);

    return () => clearInterval(interval);
  };

  const syncOfflineActions = async () => {
    try {
      const syncedCount = await offlineService.syncOfflineActions();
      if (syncedCount > 0) {
        await loadIncidents(true); // Refresh incidents after sync
        await checkOfflineActions();
      }
    } catch (error) {
      console.error('Error syncing offline actions:', error);
    }
  };

  const createIncident = async (incidentData, imageFile = null) => {
    try {
      if (isOnline) {
        const result = await incidentService.createIncident(incidentData, imageFile);
        await loadIncidents(true); // Refresh list
        return result;
      } else {
        // Store for offline sync
        await offlineService.storeOfflineAction({
          type: 'CREATE_INCIDENT',
          data: incidentData,
          imageFile,
        });
        await checkOfflineActions();
        return {message: 'Incident saved for sync when online'};
      }
    } catch (error) {
      throw error;
    }
  };

  const updateIncident = async (incidentId, updateData) => {
    try {
      const result = await incidentService.updateIncident(incidentId, updateData);
      
      // Update local state
      setIncidents(prev =>
        prev.map(incident =>
          incident.id === incidentId ? {...incident, ...updateData} : incident
        )
      );
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deleteIncident = async (incidentId) => {
    try {
      const result = await incidentService.deleteIncident(incidentId);
      
      // Remove from local state
      setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const searchIncidents = async (query, searchFilters = {}) => {
    try {
      const results = await incidentService.searchIncidents({
        q: query,
        ...searchFilters,
      });
      return results;
    } catch (error) {
      throw error;
    }
  };

  const addComment = async (incidentId, content) => {
    try {
      if (isOnline) {
        const result = await incidentService.createComment(incidentId, content);
        
        // Update incident in local state
        setIncidents(prev =>
          prev.map(incident =>
            incident.id === incidentId
              ? {...incident, comments_count: incident.comments_count + 1}
              : incident
          )
        );
        
        return result;
      } else {
        await offlineService.storeOfflineAction({
          type: 'CREATE_COMMENT',
          incidentId,
          content,
        });
        await checkOfflineActions();
        return {message: 'Comment saved for sync when online'};
      }
    } catch (error) {
      throw error;
    }
  };

  const toggleReaction = async (incidentId, reactionType) => {
    try {
      if (isOnline) {
        const result = await incidentService.toggleReaction(incidentId, reactionType);
        
        // Update incident in local state
        setIncidents(prev =>
          prev.map(incident =>
            incident.id === incidentId
              ? {
                  ...incident,
                  user_reaction: incident.user_reaction === reactionType ? null : reactionType,
                  reactions_count: incident.user_reaction === reactionType 
                    ? incident.reactions_count - 1
                    : incident.reactions_count + (incident.user_reaction ? 0 : 1)
                }
              : incident
          )
        );
        
        return result;
      } else {
        await offlineService.storeOfflineAction({
          type: 'TOGGLE_REACTION',
          incidentId,
          reactionType,
        });
        await checkOfflineActions();
        return {message: 'Reaction saved for sync when online'};
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        incidents,
        categories,
        loading,
        refreshing,
        filters,
        searchQuery,
        isOnline,
        offlineActionsCount,
        setFilters,
        setSearchQuery,
        loadIncidents,
        createIncident,
        updateIncident,
        deleteIncident,
        searchIncidents,
        addComment,
        toggleReaction,
        syncOfflineActions,
      }}>
      {children}
    </AppContext.Provider>
  );
};