/**
 * SmartFarm V15 Premium - Main Application Entry Point
 * Initializes dashboard, MQTT connection, and UI components
 */

import Dashboard from './components/Dashboard.js';
import MQTTService from './modules/MQTTService.js';
import Storage from './utils/Storage.js';
import ThemeManager from './utils/ThemeManager.js';
import NotificationService from './modules/NotificationService.js';

class App {
  constructor() {
    this.dashboard = null;
    this.mqtt = null;
    this.storage = new Storage();
    this.theme = new ThemeManager();
    this.notifications = new NotificationService();
    this.isOnline = navigator.onLine;
  }

  async initialize() {
    console.log('🚀 SmartFarm V15 Premium - Initializing...');

    try {
      // Initialize theme
      this.theme.init();

      // Initialize storage
      await this.storage.init();

      // Check for authentication
      const token = this.storage.get('authToken');
      if (!token) {
        console.log('No auth token found, redirecting to login...');
        window.location.href = '/login.html';
        return;
      }

      // Initialize MQTT service
      this.mqtt = new MQTTService({
        brokerUrl: this.storage.get('mqttBroker') || 'ws://localhost:9001',
        clientId: `smartfarm-${Date.now()}`,
        reconnectPeriod: 1000,
        onConnect: () => this.onMQTTConnect(),
        onMessage: (topic, message) => this.onMQTTMessage(topic, message),
        onDisconnect: () => this.onMQTTDisconnect(),
        onError: (error) => this.onMQTTError(error)
      });

      // Initialize Dashboard
      this.dashboard = new Dashboard({
        container: '#root',
        mqtt: this.mqtt,
        storage: this.storage,
        notifications: this.notifications
      });

      // Set up event listeners
      this.setupEventListeners();

      // Initialize notifications
      await this.notifications.init();

      // Connect MQTT
      await this.mqtt.connect();

      // Render dashboard
      await this.dashboard.render();

      console.log('✓ SmartFarm V15 Premium - Initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application', error.message);
    }
  }

  setupEventListeners() {
    // Handle online/offline events
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('App became visible, updating data...');
        this.dashboard?.updateData();
      }
    });

    // Handle theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const theme = e.matches ? 'dark' : 'light';
      if (!this.storage.get('theme')) {
        this.theme.setTheme(theme);
      }
    });

    // Handle app focus
    window.addEventListener('focus', () => {
      console.log('App focused');
      if (this.mqtt) {
        this.mqtt.healthCheck();
      }
    });

    // Handle app blur
    window.addEventListener('blur', () => {
      console.log('App blurred');
    });

    // Handle key events
    document.addEventListener('keydown', (e) => {
      // Dark mode toggle: Ctrl/Cmd + Shift + D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.theme.toggleTheme();
      }
    });
  }

  onOnline() {
    console.log('📡 Connection restored');
    document.body.classList.remove('offline');
    this.notifications.show('Connection restored', 'success');
    
    // Reconnect MQTT if disconnected
    if (this.mqtt && !this.mqtt.isConnected()) {
      this.mqtt.connect();
    }

    // Sync any pending data
    if (this.dashboard) {
      this.dashboard.syncPendingData();
    }
  }

  onOffline() {
    console.log('⚠️ Connection lost');
    document.body.classList.add('offline');
    this.notifications.show('You are offline', 'warning');
  }

  onMQTTConnect() {
    console.log('✓ MQTT Connected');
    this.notifications.show('MQTT Connected', 'success');
    document.body.classList.remove('mqtt-disconnected');
    document.body.classList.add('mqtt-connected');
    
    if (this.dashboard) {
      this.dashboard.onMQTTConnect();
    }
  }

  onMQTTDisconnect() {
    console.log('⚠️ MQTT Disconnected');
    document.body.classList.remove('mqtt-connected');
    document.body.classList.add('mqtt-disconnected');
    
    if (this.dashboard) {
      this.dashboard.onMQTTDisconnect();
    }
  }

  onMQTTMessage(topic, message) {
    console.log(`MQTT Message - ${topic}:`, message);
    if (this.dashboard) {
      this.dashboard.handleMQTTMessage(topic, message);
    }
  }

  onMQTTError(error) {
    console.error('MQTT Error:', error);
    this.notifications.show('MQTT Connection Error', 'error');
  }

  showError(title, message) {
    this.notifications.show(title, 'error', message);
  }

  async destroy() {
    console.log('Destroying app...');
    if (this.mqtt) {
      await this.mqtt.disconnect();
    }
    if (this.dashboard) {
      this.dashboard.destroy();
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
    window.smartfarmApp = app; // Expose for debugging
  });
} else {
  const app = new App();
  app.initialize();
  window.smartfarmApp = app;
}

export default App;
