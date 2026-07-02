/**
 * SmartFarm V15 - Application Configuration
 */

const CONFIG = {
  // Application
  app: {
    name: 'SmartFarm V15 Premium',
    version: '15.0.0',
    environment: process.env.NODE_ENV || 'production'
  },

  // API Configuration
  api: {
    baseURL: '/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // MQTT Configuration
  mqtt: {
    brokers: [
      'ws://localhost:9001',
      'ws://broker.smartfarm.local:9001'
    ],
    reconnectPeriod: 1000,
    maxReconnectDelay: 30000,
    keepalive: 60,
    qos: 1,
    username: 'admin',
    password: 'admin'
  },

  // Storage Configuration
  storage: {
    dbName: 'smartfarm-v15',
    dbVersion: 1,
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    maxStorageSize: 50 * 1024 * 1024 // 50 MB
  },

  // UI Configuration
  ui: {
    theme: 'auto', // 'light', 'dark', 'auto'
    animationsEnabled: true,
    notificationsEnabled: true,
    soundEnabled: false
  },

  // Feature Flags
  features: {
    offlineMode: true,
    realTimeUpdates: true,
    backgroundSync: true,
    pushNotifications: true,
    darkMode: true,
    advancedCharts: true,
    adminPanel: true,
    dataExport: true
  },

  // Device Configuration
  devices: {
    updateInterval: 10000, // 10 seconds
    sensorReadInterval: 10000, // 10 seconds
    healthCheckInterval: 30000, // 30 seconds
    reconnectInterval: 5000 // 5 seconds
  },

  // Sensor Configuration
  sensors: {
    temperatureUnit: '°C',
    humidityUnit: '%',
    soilMoistureUnit: '%',
    lightUnit: 'lux',
    rainUnit: 'mm',
    calibrationRequired: false
  },

  // Notification Configuration
  notifications: {
    enabled: true,
    position: 'top-right',
    duration: 3000,
    browserNotifications: true,
    soundNotifications: false
  },

  // Logging Configuration
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    maxLogs: 1000,
    persistLogs: true
  },

  // Security Configuration
  security: {
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    requireSSL: false,
    csrfProtection: true
  }
};

/**
 * Get config value with dot notation
 */
CONFIG.get = function(path, defaultValue = null) {
  const keys = path.split('.');
  let value = this;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
};

/**
 * Set config value with dot notation
 */
CONFIG.set = function(path, value) {
  const keys = path.split('.');
  let obj = this;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in obj) || typeof obj[key] !== 'object') {
      obj[key] = {};
    }
    obj = obj[key];
  }

  obj[keys[keys.length - 1]] = value;
};

/**
 * Merge config with custom values
 */
CONFIG.merge = function(custom) {
  const merge = (target, source) => {
    Object.keys(source).forEach(key => {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        if (typeof target[key] !== 'object') {
          target[key] = {};
        }
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    });
  };

  merge(this, custom);
};

export default CONFIG;
