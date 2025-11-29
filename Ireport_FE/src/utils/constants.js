import {Platform} from 'react-native';

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'ios' 
    ? 'http://localhost:8000' 
    : 'http://10.0.2.2:8000'
  : 'https://your-production-api.com';

export const API_TIMEOUT = 10000;

// File Configuration
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const IMAGE_QUALITY = 0.8;
export const MAX_IMAGE_DIMENSION = 1024;

// Incident Categories
export const INCIDENT_CATEGORIES = [
  { key: 'damages', label: 'Damages', color: '#ef4444', emoji: '🔨' },
  { key: 'lost_and_found', label: 'Lost & Found', color: '#3b82f6', emoji: '🔍' },
  { key: 'accidents', label: 'Accidents', color: '#f59e0b', emoji: '⚠️' },
  { key: 'environmental_hazards', label: 'Environmental Hazards', color: '#10b981', emoji: '🌿' },
  { key: 'notices_suggestions', label: 'Notices & Suggestions', color: '#8b5cf6', emoji: '💡' },
  { key: 'complaints', label: 'Complaints', color: '#f97316', emoji: '📢' },
];

// Incident Status
export const INCIDENT_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
  FLAGGED: 'flagged',
};

// Reaction Types
export const REACTION_TYPES = [
  { key: 'like', label: '👍', name: 'Like' },
  { key: 'helpful', label: '💡', name: 'Helpful' },
  { key: 'concerned', label: '😟', name: 'Concerned' },
  { key: 'resolved', label: '✅', name: 'Resolved' },
];

// Validation Rules
export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  phone: /^\+?1?\d{9,15}$/,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  FCM_TOKEN: 'fcm_token',
  OFFLINE_ACTIONS: 'offline_actions',
  RECENT_SEARCHES: 'recent_searches',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  PERMISSION_ERROR: 'Permission denied. Please enable required permissions.',
  FILE_SIZE_ERROR: 'File size exceeds the maximum limit.',
  FILE_TYPE_ERROR: 'File type not supported.',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Student iReport',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@studentireport.com',
  PRIVACY_URL: 'https://studentireport.com/privacy',
  TERMS_URL: 'https://studentireport.com/terms',
};