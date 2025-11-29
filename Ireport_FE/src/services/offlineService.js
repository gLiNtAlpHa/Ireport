import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo';

export const offlineService = {
  async storeOfflineAction(action) {
    try {
      const offlineActions = await this.getOfflineActions();
      offlineActions.push({
        ...action,
        id: Date.now().toString(),
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem('offline_actions', JSON.stringify(offlineActions));
    } catch (error) {
      console.error('Error storing offline action:', error);
    }
  },

  async getOfflineActions() {
    try {
      const actions = await AsyncStorage.getItem('offline_actions');
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  },

  async removeOfflineAction(actionId) {
    try {
      const actions = await this.getOfflineActions();
      const filteredActions = actions.filter(action => action.id !== actionId);
      await AsyncStorage.setItem('offline_actions', JSON.stringify(filteredActions));
    } catch (error) {
      console.error('Error removing offline action:', error);
    }
  },

  async syncOfflineActions() {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    if (!isConnected) return false;

    const actions = await this.getOfflineActions();
    let syncedCount = 0;

    for (const action of actions) {
      try {
        await this.executeOfflineAction(action);
        await this.removeOfflineAction(action.id);
        syncedCount++;
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }

    return syncedCount;
  },

  async executeOfflineAction(action) {
    switch (action.type) {
      case 'CREATE_INCIDENT':
        return await incidentService.createIncident(action.data, action.imageFile);
      case 'CREATE_COMMENT':
        return await incidentService.createComment(action.incidentId, action.content);
      case 'TOGGLE_REACTION':
        return await incidentService.toggleReaction(action.incidentId, action.reactionType);
      case 'UPDATE_PROFILE':
        return await userService.updateProfile(action.data);
      default:
        throw new Error(`Unknown offline action type: ${action.type}`);
    }
  },

  async isOnline() {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  },

  onConnectionChange(callback) {
    return NetInfo.addEventListener(callback);
  },
};