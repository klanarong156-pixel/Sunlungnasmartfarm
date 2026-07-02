/**
 * SmartFarm V15 - Device Manager
 * Manages farm devices, sensors, and their states
 */

class DeviceManager {
  constructor(storage = {}, mqtt = null) {
    this.storage = storage;
    this.mqtt = mqtt;
    this.devices = new Map();
    this.sensors = new Map();
    this.listeners = new Set();
  }

  /**
   * Initialize device manager
   */
  async init() {
    console.log('Initializing Device Manager...');
    await this.loadDevices();
    await this.loadSensors();
    console.log('Device Manager initialized');
  }

  /**
   * Load devices from storage
   */
  async loadDevices() {
    try {
      const devices = this.storage.get('devices') || [];
      devices.forEach(device => {
        this.devices.set(device.id, this.normalizeDevice(device));
      });
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  }

  /**
   * Load sensors from storage
   */
  async loadSensors() {
    try {
      const sensors = this.storage.get('sensors') || [];
      sensors.forEach(sensor => {
        this.sensors.set(sensor.id, this.normalizeSensor(sensor));
      });
    } catch (error) {
      console.error('Failed to load sensors:', error);
    }
  }

  /**
   * Register device
   */
  registerDevice(device) {
    const normalized = this.normalizeDevice(device);
    this.devices.set(normalized.id, normalized);
    this.persistDevices();
    this.notifyListeners('device-added', normalized);
    return normalized;
  }

  /**
   * Register sensor
   */
  registerSensor(sensor) {
    const normalized = this.normalizeSensor(sensor);
    this.sensors.set(normalized.id, normalized);
    this.persistSensors();
    this.notifyListeners('sensor-added', normalized);
    return normalized;
  }

  /**
   * Update device state
   */
  updateDevice(deviceId, updates) {
    const device = this.devices.get(deviceId);
    if (!device) {
      console.warn(`Device ${deviceId} not found`);
      return null;
    }

    const updated = { ...device, ...updates, updatedAt: new Date().toISOString() };
    this.devices.set(deviceId, updated);
    this.persistDevices();
    this.notifyListeners('device-updated', updated);
    return updated;
  }

  /**
   * Update sensor reading
   */
  updateSensorReading(sensorId, value) {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) {
      console.warn(`Sensor ${sensorId} not found`);
      return null;
    }

    const updated = {
      ...sensor,
      currentValue: value,
      lastReadAt: new Date().toISOString(),
      history: [...(sensor.history || []), { value, timestamp: new Date().toISOString() }].slice(-100) // Keep last 100 readings
    };

    this.sensors.set(sensorId, updated);
    this.persistSensors();
    this.notifyListeners('sensor-updated', updated);
    return updated;
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  /**
   * Get sensor by ID
   */
  getSensor(sensorId) {
    return this.sensors.get(sensorId);
  }

  /**
   * Get all devices
   */
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  /**
   * Get all sensors
   */
  getAllSensors() {
    return Array.from(this.sensors.values());
  }

  /**
   * Get devices by type
   */
  getDevicesByType(type) {
    return this.getAllDevices().filter(device => device.type === type);
  }

  /**
   * Get sensors by type
   */
  getSensorsByType(type) {
    return this.getAllSensors().filter(sensor => sensor.type === type);
  }

  /**
   * Control device
   */
  async controlDevice(deviceId, action, params = {}) {
    if (!this.mqtt || !this.mqtt.isConnected()) {
      console.warn('MQTT not connected');
      return false;
    }

    const topic = `smartfarm/device/${deviceId}/command`;
    const message = {
      action,
      params,
      timestamp: new Date().toISOString()
    };

    try {
      await this.mqtt.publish(topic, message);
      this.updateDevice(deviceId, { lastCommand: action, lastCommandAt: new Date().toISOString() });
      return true;
    } catch (error) {
      console.error(`Failed to control device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Control pump
   */
  async controlPump(pumpId, action) {
    return this.controlDevice(pumpId, action);
  }

  /**
   * Get device status summary
   */
  getStatusSummary() {
    const devices = this.getAllDevices();
    const sensors = this.getAllSensors();

    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.online).length,
      totalSensors: sensors.length,
      activeSensors: sensors.filter(s => s.active).length,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Normalize device object
   */
  normalizeDevice(device) {
    return {
      id: device.id,
      name: device.name || 'Unnamed Device',
      type: device.type || 'unknown',
      online: device.online !== false,
      lastSeen: device.lastSeen || new Date().toISOString(),
      createdAt: device.createdAt || new Date().toISOString(),
      updatedAt: device.updatedAt || new Date().toISOString(),
      ...device
    };
  }

  /**
   * Normalize sensor object
   */
  normalizeSensor(sensor) {
    return {
      id: sensor.id,
      name: sensor.name || 'Unnamed Sensor',
      type: sensor.type || 'unknown',
      unit: sensor.unit || '',
      currentValue: sensor.currentValue || null,
      active: sensor.active !== false,
      lastReadAt: sensor.lastReadAt || new Date().toISOString(),
      createdAt: sensor.createdAt || new Date().toISOString(),
      updatedAt: sensor.updatedAt || new Date().toISOString(),
      history: sensor.history || [],
      ...sensor
    };
  }

  /**
   * Persist devices to storage
   */
  persistDevices() {
    try {
      this.storage.set('devices', this.getAllDevices());
    } catch (error) {
      console.error('Failed to persist devices:', error);
    }
  }

  /**
   * Persist sensors to storage
   */
  persistSensors() {
    try {
      this.storage.set('sensors', this.getAllSensors());
    } catch (error) {
      console.error('Failed to persist sensors:', error);
    }
  }

  /**
   * Add listener
   */
  listen(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ event, data });
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Remove device
   */
  removeDevice(deviceId) {
    this.devices.delete(deviceId);
    this.persistDevices();
    this.notifyListeners('device-removed', { id: deviceId });
  }

  /**
   * Remove sensor
   */
  removeSensor(sensorId) {
    this.sensors.delete(sensorId);
    this.persistSensors();
    this.notifyListeners('sensor-removed', { id: sensorId });
  }

  /**
   * Clear all devices
   */
  clearDevices() {
    this.devices.clear();
    this.persistDevices();
    this.notifyListeners('devices-cleared', null);
  }

  /**
   * Clear all sensors
   */
  clearSensors() {
    this.sensors.clear();
    this.persistSensors();
    this.notifyListeners('sensors-cleared', null);
  }

  /**
   * Get device health
   */
  getDeviceHealth(deviceId) {
    const device = this.getDevice(deviceId);
    if (!device) return null;

    const now = new Date();
    const lastSeen = new Date(device.lastSeen);
    const timeDiff = now - lastSeen;

    return {
      id: deviceId,
      online: device.online,
      healthy: device.online && timeDiff < 5 * 60 * 1000, // 5 minutes
      lastSeenSeconds: Math.floor(timeDiff / 1000)
    };
  }

  /**
   * Destroy manager
   */
  destroy() {
    this.listeners.clear();
    this.devices.clear();
    this.sensors.clear();
  }
}

export default DeviceManager;
