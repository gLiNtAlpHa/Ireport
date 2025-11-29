import AsyncStorage from '@react-native-async-storage/async-storage';

export const cacheService = {
  async set(key, data, expirationMinutes = 60) {
    try {
      const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
      const cacheData = {
        data,
        expiration: expirationTime,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async get(key) {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      if (Date.now() > cacheData.expiration) {
        await this.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },
};