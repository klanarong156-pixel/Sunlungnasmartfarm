/**
 * SmartFarm V15 - Logger Utility
 * Centralized logging for debugging and monitoring
 */

class Logger {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.level = config.level || 'info';
    this.maxLogs = config.maxLogs || 1000;
    this.persistLogs = config.persistLogs !== false;
    this.logs = [];
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    this.colors = {
      debug: '#7B68EE',
      info: '#007AFF',
      warn: '#FF9500',
      error: '#FF3B30'
    };

    this.loadLogs();
  }

  /**
   * Log message with level
   */
  log(level, message, data = null) {
    if (!this.enabled || this.levels[level] < this.levels[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Add to memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console
    this.logToConsole(level, message, data);

    // Persist to storage
    if (this.persistLogs) {
      this.persistLog(logEntry);
    }
  }

  /**
   * Log to browser console
   */
  logToConsole(level, message, data) {
    const prefix = `[${level.toUpperCase()}]`;
    const color = this.colors[level];
    const styles = `color: ${color}; font-weight: bold;`;

    if (data) {
      console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log'](
        `%c${prefix}`,
        styles,
        message,
        data
      );
    } else {
      console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log'](
        `%c${prefix}`,
        styles,
        message
      );
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = null) {
    this.log('debug', message, data);
  }

  /**
   * Info level logging
   */
  info(message, data = null) {
    this.log('info', message, data);
  }

  /**
   * Warning level logging
   */
  warn(message, data = null) {
    this.log('warn', message, data);
  }

  /**
   * Error level logging
   */
  error(message, data = null) {
    this.log('error', message, data);
  }

  /**
   * Persist log to IndexedDB
   */
  async persistLog(logEntry) {
    try {
      const db = await this.getDB();
      const transaction = db.transaction('logs', 'readwrite');
      const store = transaction.objectStore('logs');
      store.add(logEntry);
    } catch (error) {
      console.error('Failed to persist log:', error);
    }
  }

  /**
   * Get or create IndexedDB
   */
  async getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('smartfarm-logs', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  /**
   * Load logs from storage
   */
  async loadLogs() {
    try {
      const db = await this.getDB();
      const transaction = db.transaction('logs', 'readonly');
      const store = transaction.objectStore('logs');
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          this.logs = request.result || [];
          resolve(this.logs);
        };
      });
    } catch (error) {
      console.error('Failed to load logs:', error);
      return [];
    }
  }

  /**
   * Get all logs
   */
  getLogs(filter = {}) {
    let logs = [...this.logs];

    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    if (filter.startTime) {
      logs = logs.filter(log => new Date(log.timestamp) >= filter.startTime);
    }

    if (filter.endTime) {
      logs = logs.filter(log => new Date(log.timestamp) <= filter.endTime);
    }

    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  /**
   * Export logs as JSON
   */
  exportJSON() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportCSV() {
    const headers = ['Timestamp', 'Level', 'Message', 'Data'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level.toUpperCase(),
      log.message,
      JSON.stringify(log.data || '')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Download logs
   */
  download(format = 'json') {
    const content = format === 'json' ? this.exportJSON() : this.exportCSV();
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartfarm-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all logs
   */
  async clear() {
    this.logs = [];
    try {
      const db = await this.getDB();
      const transaction = db.transaction('logs', 'readwrite');
      const store = transaction.objectStore('logs');
      store.clear();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    }
  }

  /**
   * Get current log level
   */
  getLevel() {
    return this.level;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}

export default Logger;
