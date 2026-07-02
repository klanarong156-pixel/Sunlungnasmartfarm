/**
 * SmartFarm V15 - Connection Status Service
 * Monitors internet and MQTT connectivity
 */

class ConnectionStatusService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.mqttConnected = false;
    this.statusElement = null;
    this.listeners = new Set();
  }

  /**
   * Initialize connection monitoring
   */
  init() {
    // Create status indicator
    this.createStatusIndicator();

    // Listen for online/offline events
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    // Periodic connectivity check
    this.startConnectivityCheck();

    return this;
  }

  /**
   * Create status indicator element
   */
  createStatusIndicator() {
    this.statusElement = document.createElement('div');
    this.statusElement.id = 'connection-status-indicator';
    this.statusElement.style.cssText = `
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      padding: 0.75rem 1rem;
      border-radius: 2rem;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      z-index: 999;
      transition: all 0.3s;
    `;

    this.updateStatusIndicator();
    document.body.appendChild(this.statusElement);
  }

  /**
   * Update status indicator appearance
   */
  updateStatusIndicator() {
    if (!this.statusElement) return;

    const isConnected = this.isOnline && this.mqttConnected;

    this.statusElement.innerHTML = `
      <span style="
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${isConnected ? '#34C759' : this.isOnline ? '#FF9500' : '#FF3B30'};
        animation: ${isConnected ? 'pulse 2s infinite' : 'none'};
      "></span>
      <span>${isConnected ? '✓ Connected' : this.isOnline ? '⚠ Offline (MQTT)' : '✗ Offline'}</span>
    `;

    this.statusElement.style.color = isConnected ? '#34C759' : this.isOnline ? '#FF9500' : '#FF3B30';
    this.statusElement.style.background = isConnected
      ? 'rgba(52, 199, 89, 0.1)'
      : this.isOnline
      ? 'rgba(255, 149, 0, 0.1)'
      : 'rgba(255, 59, 48, 0.1)';
  }

  /**
   * On online event
   */
  onOnline() {
    this.isOnline = true;
    console.log('✓ Online');
    this.updateStatusIndicator();
    this.notifyListeners('online');
  }

  /**
   * On offline event
   */
  onOffline() {
    this.isOnline = false;
    console.log('✗ Offline');
    this.updateStatusIndicator();
    this.notifyListeners('offline');
  }

  /**
   * Set MQTT connection status
   */
  setMQTTConnected(connected) {
    this.mqttConnected = connected;
    this.updateStatusIndicator();
    this.notifyListeners(connected ? 'mqtt-connected' : 'mqtt-disconnected');
  }

  /**
   * Add status change listener
   */
  listen(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback({ status, isOnline: this.isOnline, mqttConnected: this.mqttConnected });
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Start periodic connectivity check
   */
  startConnectivityCheck() {
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Every 30 seconds
  }

  /**
   * Check connectivity by making a small request
   */
  async checkConnectivity() {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-store'
      });
      if (!this.isOnline && response.ok) {
        this.onOnline();
      }
    } catch (error) {
      if (this.isOnline) {
        this.onOffline();
      }
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      online: this.isOnline,
      mqttConnected: this.mqttConnected,
      connected: this.isOnline && this.mqttConnected
    };
  }

  /**
   * Destroy service
   */
  destroy() {
    if (this.statusElement && this.statusElement.parentElement) {
      this.statusElement.remove();
    }
    this.listeners.clear();
  }
}

export default ConnectionStatusService;
