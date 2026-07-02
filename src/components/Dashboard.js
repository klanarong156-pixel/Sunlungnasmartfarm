/**
 * SmartFarm V15 - Dashboard Component
 * Main dashboard view with real-time sensor data and controls
 */

class Dashboard {
  constructor(options = {}) {
    this.container = options.container || '#root';
    this.mqtt = options.mqtt;
    this.storage = options.storage;
    this.notifications = options.notifications;
    this.element = null;
    this.charts = {};
    this.sensors = {};
    this.devices = {};
    this.updateInterval = null;
  }

  /**
   * Render dashboard
   */
  async render() {
    console.log('📊 Rendering Dashboard...');

    const container = document.querySelector(this.container);
    if (!container) {
      throw new Error(`Container ${this.container} not found`);
    }

    // Create dashboard HTML
    this.element = document.createElement('div');
    this.element.className = 'dashboard';
    this.element.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
    `;

    this.element.innerHTML = `
      <header class="dashboard-header">
        <div class="dashboard-title">
          <h1>🌾 SmartFarm V15 Premium</h1>
          <p id="connection-status" class="connection-status offline">Offline</p>
        </div>
        <div class="dashboard-actions">
          <button id="theme-toggle" class="btn btn-secondary btn-sm">🌙 Dark Mode</button>
          <button id="refresh-btn" class="btn btn-primary btn-sm">🔄 Refresh</button>
        </div>
      </header>

      <main class="dashboard-main">
        <div class="dashboard-content">
          <!-- Summary Cards -->
          <section class="premium-card" id="summary-section">
            <h2>📊 Summary</h2>
            <div class="data-grid" id="summary-grid">
              <div class="data-item">
                <div class="data-label">Temperature</div>
                <div class="data-value" id="temp-value">--°C</div>
              </div>
              <div class="data-item">
                <div class="data-label">Humidity</div>
                <div class="data-value" id="humidity-value">--%</div>
              </div>
              <div class="data-item">
                <div class="data-label">Soil Moisture</div>
                <div class="data-value" id="moisture-value">--%</div>
              </div>
              <div class="data-item">
                <div class="data-label">Light Level</div>
                <div class="data-value" id="light-value">-- lux</div>
              </div>
            </div>
          </section>

          <!-- Pump Controls -->
          <section class="premium-card" id="controls-section">
            <h2>💧 Pump Controls</h2>
            <div class="controls-panel" id="controls-panel">
              <div class="control-item">
                <label>Main Pump</label>
                <label class="toggle">
                  <input type="checkbox" id="pump-1" data-device="pump-1">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="control-item">
                <label>Secondary Pump</label>
                <label class="toggle">
                  <input type="checkbox" id="pump-2" data-device="pump-2">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="control-item">
                <label>Fertilizer Pump</label>
                <label class="toggle">
                  <input type="checkbox" id="pump-3" data-device="pump-3">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          <!-- Charts -->
          <section class="premium-card" id="charts-section">
            <h2>📈 Temperature Trend</h2>
            <div class="chart-container">
              <canvas id="temp-chart"></canvas>
            </div>
          </section>

          <!-- Status -->
          <section class="premium-card" id="status-section">
            <h2>🔌 System Status</h2>
            <div id="status-content">
              <div class="status-item">
                <span>MQTT Connection:</span>
                <span id="mqtt-status" class="status-offline">Disconnected</span>
              </div>
              <div class="status-item">
                <span>Internet:</span>
                <span id="internet-status" class="status-online">Connected</span>
              </div>
              <div class="status-item">
                <span>Last Update:</span>
                <span id="last-update">--</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer class="dashboard-footer">
        <p>SmartFarm V15 Premium © 2026 | Real-time Farm Management System</p>
      </footer>
    `;

    container.innerHTML = '';
    container.appendChild(this.element);

    // Apply styles
    this.applyStyles();

    // Set up event listeners
    this.setupEventListeners();

    // Load initial data
    await this.updateData();

    // Subscribe to MQTT topics
    await this.subscribeToTopics();

    // Start periodic updates
    this.startPeriodicUpdates();

    console.log('✓ Dashboard rendered');
  }

  /**
   * Apply inline styles
   */
  applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .dashboard {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .dashboard-header {
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        color: white;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        flex-wrap: wrap;
        gap: 1rem;
      }

      .dashboard-header h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
      }

      .dashboard-title {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .connection-status {
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        font-size: 0.875rem;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.2);
      }

      .connection-status.online {
        background: rgba(52, 199, 89, 0.3);
        color: #34C759;
      }

      .connection-status.offline {
        background: rgba(255, 59, 48, 0.3);
        color: #FF3B30;
      }

      .dashboard-actions {
        display: flex;
        gap: 0.5rem;
      }

      .dashboard-main {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }

      .dashboard-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      .dashboard-footer {
        text-align: center;
        padding: 1rem;
        border-top: 1px solid var(--border);
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .premium-card {
        margin-bottom: 1.5rem;
      }

      .premium-card h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.25rem;
      }

      .status-item {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem;
        border-bottom: 1px solid var(--border);
        font-size: 0.95rem;
      }

      .status-item:last-child {
        border-bottom: none;
      }

      .status-online {
        color: var(--success);
        font-weight: 600;
      }

      .status-offline {
        color: var(--error);
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .dashboard-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .dashboard-header h1 {
          font-size: 1.5rem;
        }

        .dashboard-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        .dashboard-main {
          padding: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Theme toggle
    const themeToggle = this.element.querySelector('#theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const theme = this.storage.get('theme') === 'dark' ? 'light' : 'dark';
        this.storage.set('theme', theme);
        document.documentElement.classList.toggle('dark');
        themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
      });
    }

    // Refresh button
    const refreshBtn = this.element.querySelector('#refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.updateData());
    }

    // Pump controls
    const pumpControls = this.element.querySelectorAll('[data-device]');
    pumpControls.forEach(control => {
      control.addEventListener('change', (e) => {
        const deviceId = e.target.dataset.device;
        const state = e.target.checked;
        this.controlPump(deviceId, state);
      });
    });
  }

  /**
   * Update dashboard data
   */
  async updateData() {
    console.log('📊 Updating dashboard data...');

    try {
      // Simulate fetching sensor data (replace with real API call)
      const sensorData = this.storage.get('sensorData') || {
        temperature: 25.5,
        humidity: 65.0,
        soilMoisture: 45.0,
        lightLevel: 800
      };

      // Update display
      this.element.querySelector('#temp-value').textContent = `${sensorData.temperature.toFixed(1)}°C`;
      this.element.querySelector('#humidity-value').textContent = `${sensorData.humidity.toFixed(1)}%`;
      this.element.querySelector('#moisture-value').textContent = `${sensorData.soilMoisture.toFixed(1)}%`;
      this.element.querySelector('#light-value').textContent = `${sensorData.lightLevel.toFixed(0)} lux`;

      // Update timestamp
      this.element.querySelector('#last-update').textContent = new Date().toLocaleTimeString();
    } catch (error) {
      console.error('Failed to update data:', error);
    }
  }

  /**
   * Control pump
   */
  async controlPump(deviceId, state) {
    console.log(`Controlling pump ${deviceId}: ${state ? 'ON' : 'OFF'}`);

    try {
      await this.mqtt.publish(`smartfarm/pump/${deviceId}/command`, {
        action: state ? 'ON' : 'OFF',
        timestamp: new Date().toISOString()
      });

      this.notifications.success(`Pump ${deviceId} turned ${state ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error(`Failed to control pump ${deviceId}:`, error);
      this.notifications.error('Failed to control pump');
    }
  }

  /**
   * Subscribe to MQTT topics
   */
  async subscribeToTopics() {
    const topics = [
      'smartfarm/sensor/+/temperature',
      'smartfarm/sensor/+/humidity',
      'smartfarm/sensor/+/soil_moisture',
      'smartfarm/sensor/+/light',
      'smartfarm/pump/+/status',
      'smartfarm/device/+/status'
    ];

    for (const topic of topics) {
      try {
        await this.mqtt.subscribe(topic, 1);
      } catch (error) {
        console.error(`Failed to subscribe to ${topic}:`, error);
      }
    }
  }

  /**
   * Handle MQTT message
   */
  handleMQTTMessage(topic, message) {
    console.log(`📨 MQTT Message: ${topic}`, message);

    if (topic.includes('temperature')) {
      this.element.querySelector('#temp-value').textContent = `${message.value.toFixed(1)}°C`;
    } else if (topic.includes('humidity')) {
      this.element.querySelector('#humidity-value').textContent = `${message.value.toFixed(1)}%`;
    } else if (topic.includes('soil_moisture')) {
      this.element.querySelector('#moisture-value').textContent = `${message.value.toFixed(1)}%`;
    } else if (topic.includes('light')) {
      this.element.querySelector('#light-value').textContent = `${message.value.toFixed(0)} lux`;
    }

    // Update timestamp
    this.element.querySelector('#last-update').textContent = new Date().toLocaleTimeString();
  }

  /**
   * On MQTT connect
   */
  onMQTTConnect() {
    const status = this.element.querySelector('#mqtt-status');
    if (status) {
      status.textContent = 'Connected';
      status.className = 'status-online';
    }
    this.subscribeToTopics();
  }

  /**
   * On MQTT disconnect
   */
  onMQTTDisconnect() {
    const status = this.element.querySelector('#mqtt-status');
    if (status) {
      status.textContent = 'Disconnected';
      status.className = 'status-offline';
    }
  }

  /**
   * Sync pending data
   */
  async syncPendingData() {
    console.log('Syncing pending data...');
    // Implement pending data sync
  }

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateData();
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    this.stopPeriodicUpdates();
    if (this.element && this.element.parentElement) {
      this.element.remove();
    }
  }
}

export default Dashboard;
