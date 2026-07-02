/**
 * SmartFarm V15 - API Service
 * Handles REST API communications with backend
 */

class APIService {
  constructor(baseURL = '/api', timeout = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  /**
   * Make HTTP request
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: { ...this.headers, ...options.headers },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new APIError(
          `API error: ${response.status} ${response.statusText}`,
          response.status,
          await response.json().catch(() => ({}))
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(error.message, 0, { error: error.message });
    }
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  /**
   * Login endpoint
   */
  async login(username, password) {
    const response = await this.post('/auth/login', { username, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  /**
   * Logout endpoint
   */
  async logout() {
    try {
      await this.post('/auth/logout', {});
    } finally {
      this.setToken(null);
    }
  }

  /**
   * Get sensor data
   */
  getSensors(deviceId = null) {
    const endpoint = deviceId ? `/sensors/${deviceId}` : '/sensors';
    return this.get(endpoint);
  }

  /**
   * Get devices
   */
  getDevices() {
    return this.get('/devices');
  }

  /**
   * Control pump
   */
  async controlPump(deviceId, action) {
    return this.post(`/pumps/${deviceId}/control`, { action });
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return this.get('/system/status');
  }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, status = 0, data = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export { APIService, APIError };
