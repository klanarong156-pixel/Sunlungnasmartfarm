/**
 * SmartFarm V15 - MQTT Service with Auto-Reconnect
 * Handles MQTT broker connection, subscriptions, and message handling
 */

class MQTTService {
  constructor(options = {}) {
    this.brokerUrl = options.brokerUrl || 'ws://localhost:9001';
    this.clientId = options.clientId || `smartfarm-${Date.now()}`;
    this.reconnectPeriod = options.reconnectPeriod || 1000;
    this.maxReconnectDelay = options.maxReconnectDelay || 30000;
    this.onConnect = options.onConnect || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onError = options.onError || (() => {});

    this.client = null;
    this.isConnected_ = false;
    this.reconnectCount = 0;
    this.subscriptions = new Set();
    this.messageQueue = [];
    this.healthCheckInterval = null;
  }

  /**
   * Connect to MQTT broker
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to MQTT broker: ${this.brokerUrl}`);

        this.client = mqtt.connect(this.brokerUrl, {
          clientId: this.clientId,
          clean: true,
          reconnectPeriod: this.reconnectPeriod,
          keepalive: 60,
          connectTimeout: 4000,
          username: localStorage.getItem('mqttUser') || 'admin',
          password: localStorage.getItem('mqttPass') || 'admin'
        });

        this.client.on('connect', () => {
          console.log('✓ MQTT Connected');
          this.isConnected_ = true;
          this.reconnectCount = 0;
          this.onConnect();

          // Resubscribe to all topics
          this.resubscribeAll();

          // Process queued messages
          this.processMessageQueue();

          // Start health check
          this.startHealthCheck();

          resolve(this);
        });

        this.client.on('message', (topic, payload) => {
          try {
            const message = JSON.parse(payload.toString());
            this.onMessage(topic, message);
          } catch (error) {
            console.warn(`Failed to parse message on topic ${topic}:`, error);
            this.onMessage(topic, payload.toString());
          }
        });

        this.client.on('error', (error) => {
          console.error('MQTT Error:', error);
          this.onError(error);
        });

        this.client.on('close', () => {
          console.log('MQTT Connection closed');
          this.isConnected_ = false;
          this.onDisconnect();
          this.stopHealthCheck();
        });

        this.client.on('offline', () => {
          console.log('MQTT Offline');
          this.isConnected_ = false;
          this.onDisconnect();
        });

        this.client.on('reconnect', () => {
          this.reconnectCount++;
          console.log(`MQTT Reconnecting... (attempt ${this.reconnectCount})`);
        });
      } catch (error) {
        console.error('Failed to connect to MQTT:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    return new Promise((resolve) => {
      this.stopHealthCheck();
      if (this.client) {
        this.client.end(true, { timeout: 2000 }, () => {
          console.log('MQTT Disconnected');
          this.isConnected_ = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Subscribe to MQTT topic
   */
  subscribe(topic, qos = 1) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected_) {
        console.warn(`Not connected, queuing subscription: ${topic}`);
        this.subscriptions.add({ topic, qos });
        resolve();
        return;
      }

      this.client.subscribe(topic, { qos }, (error, granted) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`✓ Subscribed to ${topic}`);
          this.subscriptions.add({ topic, qos });
          resolve(granted);
        }
      });
    });
  }

  /**
   * Unsubscribe from MQTT topic
   */
  unsubscribe(topic) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected_) {
        this.subscriptions.delete({ topic });
        resolve();
        return;
      }

      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to unsubscribe from ${topic}:`, error);
          reject(error);
        } else {
          console.log(`✓ Unsubscribed from ${topic}`);
          this.subscriptions.delete({ topic });
          resolve();
        }
      });
    });
  }

  /**
   * Publish message to MQTT topic
   */
  publish(topic, message, qos = 1, retain = false) {
    return new Promise((resolve, reject) => {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);

      if (!this.isConnected_) {
        console.warn(`Not connected, queuing message: ${topic}`);
        this.messageQueue.push({ topic, payload, qos, retain });
        resolve(false);
        return;
      }

      this.client.publish(topic, payload, { qos, retain }, (error) => {
        if (error) {
          console.error(`Failed to publish to ${topic}:`, error);
          this.messageQueue.push({ topic, payload, qos, retain });
          reject(error);
        } else {
          console.log(`✓ Published to ${topic}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Resubscribe to all topics
   */
  resubscribeAll() {
    this.subscriptions.forEach(({ topic, qos }) => {
      this.subscribe(topic, qos).catch((error) => {
        console.error(`Failed to resubscribe to ${topic}:`, error);
      });
    });
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { topic, payload, qos, retain } = this.messageQueue.shift();
      this.client.publish(topic, payload, { qos, retain }, (error) => {
        if (error) {
          console.error(`Failed to process queued message for ${topic}:`, error);
          this.messageQueue.push({ topic, payload, qos, retain });
        }
      });
    }
  }

  /**
   * Health check - verify connection is alive
   */
  healthCheck() {
    if (!this.isConnected_ || !this.client) {
      console.warn('MQTT health check failed - not connected');
      return false;
    }

    // Publish heartbeat
    this.publish('smartfarm/heartbeat', {
      timestamp: new Date().toISOString(),
      clientId: this.clientId
    }).catch((error) => {
      console.error('Health check failed:', error);
    });

    return true;
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.isConnected_ && this.client && !this.client.disconnecting;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected(),
      brokerUrl: this.brokerUrl,
      clientId: this.clientId,
      reconnectCount: this.reconnectCount,
      subscriptionCount: this.subscriptions.size,
      queuedMessages: this.messageQueue.length
    };
  }

  /**
   * Destroy service
   */
  destroy() {
    this.disconnect();
    this.stopHealthCheck();
  }
}

export default MQTTService;
