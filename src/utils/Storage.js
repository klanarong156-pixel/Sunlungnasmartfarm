/**
 * SmartFarm V15 - Storage Utility
 * Handles local storage and IndexedDB operations
 */

class Storage {
  constructor(dbName = 'smartfarm-v15', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.localStorage = window.localStorage;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not available, using localStorage only');
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('sensors')) {
          db.createObjectStore('sensors', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('devices')) {
          db.createObjectStore('devices', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('pending')) {
          db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
        }

        console.log('IndexedDB upgraded');
      };
    });
  }

  /**
   * Get value from localStorage
   */
  get(key, defaultValue = null) {
    try {
      const value = this.localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set value in localStorage
   */
  set(key, value) {
    try {
      this.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
      return false;
    }
  }

  /**
   * Remove value from localStorage
   */
  remove(key) {
    try {
      this.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage
   */
  clear() {
    try {
      this.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Add data to IndexedDB
   */
  async addToDb(storeName, data) {
    if (!this.db) {
      console.warn('IndexedDB not available');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put data to IndexedDB (update or insert)
   */
  async putToDb(storeName, data) {
    if (!this.db) {
      console.warn('IndexedDB not available');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from IndexedDB
   */
  async getFromDb(storeName, key) {
    if (!this.db) {
      console.warn('IndexedDB not available');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from IndexedDB
   */
  async getAllFromDb(storeName) {
    if (!this.db) {
      console.warn('IndexedDB not available');
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete from IndexedDB
   */
  async deleteFromDb(storeName, key) {
    if (!this.db) {
      console.warn('IndexedDB not available');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear IndexedDB store
   */
  async clearDb(storeName) {
    if (!this.db) {
      console.warn('IndexedDB not available');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage size
   */
  getSize() {
    let size = 0;
    for (let key in this.localStorage) {
      if (this.localStorage.hasOwnProperty(key)) {
        size += this.localStorage[key].length + key.length;
      }
    }
    return size;
  }

  /**
   * Destroy storage
   */
  destroy() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default Storage;
