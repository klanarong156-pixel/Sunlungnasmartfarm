/**
 * SmartFarm V15 - Notification Service
 * Handles toast notifications, alerts, and browser notifications
 */

class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.notificationId = 0;
    this.container = null;
    this.permission = Notification.permission || 'default';
  }

  /**
   * Initialize notification service
   */
  async init() {
    // Request notification permission
    if ('Notification' in window && this.permission === 'default') {
      try {
        this.permission = await Notification.requestPermission();
        console.log(`Notification permission: ${this.permission}`);
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }

    // Create notification container
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      padding: 1rem;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 500px;
      margin: 0 auto;
      left: 50%;
      transform: translateX(-50%);
    `;
    document.body.appendChild(this.container);

    return this;
  }

  /**
   * Show toast notification
   */
  show(message, type = 'info', details = '', duration = 3000) {
    const id = ++this.notificationId;

    const notification = document.createElement('div');
    notification.id = `notification-${id}`;
    notification.className = `notification notification-${type} fade-in`;
    notification.style.cssText = `
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      background: ${this.getBackgroundColor(type)};
      color: ${this.getTextColor(type)};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      min-width: 250px;
      max-width: 100%;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `;

    const titleElement = document.createElement('div');
    titleElement.style.cssText = 'font-weight: 600; font-size: 0.95rem;';
    titleElement.textContent = message;
    notification.appendChild(titleElement);

    if (details) {
      const detailsElement = document.createElement('div');
      detailsElement.style.cssText = 'font-size: 0.85rem; opacity: 0.9; margin-top: 0.25rem;';
      detailsElement.textContent = details;
      notification.appendChild(detailsElement);
    }

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      opacity: 0.7;
      transition: opacity 0.2s;
      color: inherit;
    `;
    closeButton.onmouseover = () => closeButton.style.opacity = '1';
    closeButton.onmouseout = () => closeButton.style.opacity = '0.7';
    closeButton.onclick = () => this.remove(id);
    notification.style.position = 'relative';
    notification.appendChild(closeButton);

    this.container.appendChild(notification);
    this.notifications.set(id, { element: notification, timeoutId: null });

    // Auto-remove after duration
    if (duration > 0) {
      const timeoutId = setTimeout(() => this.remove(id), duration);
      this.notifications.get(id).timeoutId = timeoutId;
    }

    return id;
  }

  /**
   * Show success notification
   */
  success(message, details = '', duration = 3000) {
    return this.show(message, 'success', details, duration);
  }

  /**
   * Show error notification
   */
  error(message, details = '', duration = 5000) {
    return this.show(message, 'error', details, duration);
  }

  /**
   * Show warning notification
   */
  warning(message, details = '', duration = 4000) {
    return this.show(message, 'warning', details, duration);
  }

  /**
   * Show info notification
   */
  info(message, details = '', duration = 3000) {
    return this.show(message, 'info', details, duration);
  }

  /**
   * Remove notification
   */
  remove(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    const { element, timeoutId } = notification;

    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Fade out
    element.style.animation = 'fadeIn 0.3s ease-out reverse';
    setTimeout(() => {
      element.remove();
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Remove all notifications
   */
  removeAll() {
    this.notifications.forEach((_, id) => this.remove(id));
  }

  /**
   * Send browser notification
   */
  async sendBrowserNotification(title, options = {}) {
    if (!('Notification' in window) || this.permission !== 'granted') {
      console.warn('Browser notifications not available or not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-192x192.png',
        ...options
      });

      return notification;
    } catch (error) {
      console.error('Failed to send browser notification:', error);
    }
  }

  /**
   * Get background color based on type
   */
  getBackgroundColor(type) {
    const colors = {
      info: 'rgba(0, 122, 255, 0.1)',
      success: 'rgba(52, 199, 89, 0.1)',
      warning: 'rgba(255, 149, 0, 0.1)',
      error: 'rgba(255, 59, 48, 0.1)'
    };
    return colors[type] || colors.info;
  }

  /**
   * Get text color based on type
   */
  getTextColor(type) {
    const colors = {
      info: '#007AFF',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30'
    };
    return colors[type] || colors.info;
  }

  /**
   * Show loading notification
   */
  showLoading(message = 'Loading...') {
    const id = ++this.notificationId;

    const notification = document.createElement('div');
    notification.id = `notification-${id}`;
    notification.style.cssText = `
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      background: rgba(0, 122, 255, 0.1);
      color: #007AFF;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 300px;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 122, 255, 0.3);
      border-top-color: #007AFF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    `;
    notification.appendChild(spinner);

    const text = document.createElement('span');
    text.textContent = message;
    text.style.fontWeight = '600';
    notification.appendChild(text);

    this.container.appendChild(notification);
    this.notifications.set(id, { element: notification, timeoutId: null });

    return id;
  }

  /**
   * Update loading notification
   */
  updateLoading(id, message) {
    const notification = this.notifications.get(id);
    if (notification) {
      const text = notification.element.querySelector('span');
      if (text) {
        text.textContent = message;
      }
    }
  }

  /**
   * Show confirmation dialog
   */
  async confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: var(--bg-primary);
        padding: 2rem;
        border-radius: 1rem;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        animation: scaleIn 0.3s ease-out;
      `;

      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      titleEl.style.cssText = 'margin: 0 0 1rem 0;';
      content.appendChild(titleEl);

      const messageEl = document.createElement('p');
      messageEl.textContent = message;
      messageEl.style.cssText = 'margin: 0 0 1.5rem 0; color: var(--text-secondary);';
      content.appendChild(messageEl);

      const buttons = document.createElement('div');
      buttons.style.cssText = 'display: flex; gap: 1rem; justify-content: flex-end;';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.onclick = () => {
        modal.remove();
        resolve(false);
      };

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Confirm';
      confirmBtn.className = 'btn btn-primary';
      confirmBtn.onclick = () => {
        modal.remove();
        resolve(true);
      };

      buttons.appendChild(cancelBtn);
      buttons.appendChild(confirmBtn);
      content.appendChild(buttons);
      modal.appendChild(content);
      document.body.appendChild(modal);
    });
  }

  /**
   * Destroy service
   */
  destroy() {
    this.removeAll();
    if (this.container && this.container.parentElement) {
      this.container.remove();
    }
  }
}

export default NotificationService;
