/**
 * SmartFarm V15 - Admin Panel
 * Admin dashboard for system management
 */

class AdminPanel {
  constructor() {
    this.currentPage = 'dashboard';
    this.storage = localStorage;
  }

  async initialize() {
    console.log('🔐 Admin Panel Initializing...');

    // Check authentication
    const token = this.storage.getItem('authToken');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }

    // Set up event listeners
    this.setupEventListeners();

    console.log('✓ Admin Panel Initialized');
  }

  setupEventListeners() {
    // Navigation items
    const navItems = document.querySelectorAll('[data-page]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.toggle('open');
        }
      });
    }

    // Close sidebar when clicking on main content
    const content = document.querySelector('.content');
    if (content && window.innerWidth < 768) {
      content.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.remove('open');
        }
      });
    }
  }

  navigateTo(page) {
    console.log(`Navigating to: ${page}`);

    this.currentPage = page;

    // Update active nav item
    const navItems = document.querySelectorAll('[data-page]');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) {
        item.classList.add('active');
      }
    });

    // Update page title
    const titleMap = {
      dashboard: 'Admin Dashboard',
      users: 'User Management',
      devices: 'Device Management',
      sensors: 'Sensor Management',
      logs: 'Audit Logs',
      system: 'System Health',
      backup: 'Backup & Restore',
      settings: 'Settings'
    };

    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      titleEl.textContent = titleMap[page] || 'Admin Panel';
    }

    // Load page content
    this.loadPageContent(page);
  }

  loadPageContent(page) {
    const content = document.getElementById('admin-content');
    if (!content) return;

    let html = '';

    switch (page) {
      case 'dashboard':
        html = this.getDashboardContent();
        break;
      case 'users':
        html = this.getUsersContent();
        break;
      case 'devices':
        html = this.getDevicesContent();
        break;
      case 'sensors':
        html = this.getSensorsContent();
        break;
      case 'logs':
        html = this.getLogsContent();
        break;
      case 'system':
        html = this.getSystemContent();
        break;
      case 'backup':
        html = this.getBackupContent();
        break;
      case 'settings':
        html = this.getSettingsContent();
        break;
      default:
        html = '<p>Page not found</p>';
    }

    content.innerHTML = html;
  }

  getDashboardContent() {
    return `
      <div class="glass-lg">
        <h3>Admin Dashboard</h3>
        <div class="responsive-grid">
          <div class="premium-card">
            <h4>👥 Total Users</h4>
            <p style="font-size: 2rem; font-weight: 700; color: var(--primary); margin: 0;">12</p>
          </div>
          <div class="premium-card">
            <h4>🔧 Total Devices</h4>
            <p style="font-size: 2rem; font-weight: 700; color: var(--primary); margin: 0;">8</p>
          </div>
          <div class="premium-card">
            <h4>📊 Total Sensors</h4>
            <p style="font-size: 2rem; font-weight: 700; color: var(--primary); margin: 0;">24</p>
          </div>
          <div class="premium-card">
            <h4>✅ System Health</h4>
            <p style="font-size: 2rem; font-weight: 700; color: var(--success); margin: 0;">99.9%</p>
          </div>
        </div>
        <div class="premium-card" style="margin-top: 1.5rem;">
          <h4>Recent Activity</h4>
          <ul class="animated-list">
            <li>User 'admin' logged in at 10:30 AM</li>
            <li>Device 'pump-1' status changed to ON at 10:25 AM</li>
            <li>Sensor 'temp-1' reading: 25.5°C at 10:20 AM</li>
            <li>System backup completed successfully at 02:00 AM</li>
          </ul>
        </div>
      </div>
    `;
  }

  getUsersContent() {
    return `
      <div class="glass-lg">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3>User Management</h3>
          <button class="btn btn-primary btn-sm">+ Add User</button>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border);">
                <th style="text-align: left; padding: 1rem;">Name</th>
                <th style="text-align: left; padding: 1rem;">Email</th>
                <th style="text-align: left; padding: 1rem;">Role</th>
                <th style="text-align: left; padding: 1rem;">Status</th>
                <th style="text-align: left; padding: 1rem;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">Admin User</td>
                <td style="padding: 1rem;">admin@smartfarm.local</td>
                <td style="padding: 1rem;"><span class="badge badge-primary">Admin</span></td>
                <td style="padding: 1rem;"><span class="badge badge-success">Active</span></td>
                <td style="padding: 1rem;">
                  <button class="btn btn-secondary btn-sm">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  getDevicesContent() {
    return `
      <div class="glass-lg">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3>Device Management</h3>
          <button class="btn btn-primary btn-sm">+ Add Device</button>
        </div>
        <div class="responsive-grid">
          <div class="premium-card">
            <h4>💧 Pump #1</h4>
            <p><strong>Status:</strong> <span class="badge badge-success">Online</span></p>
            <p><strong>Last Seen:</strong> 2 mins ago</p>
            <button class="btn btn-secondary btn-sm" style="width: 100%;">View Details</button>
          </div>
          <div class="premium-card">
            <h4>💧 Pump #2</h4>
            <p><strong>Status:</strong> <span class="badge badge-success">Online</span></p>
            <p><strong>Last Seen:</strong> 5 mins ago</p>
            <button class="btn btn-secondary btn-sm" style="width: 100%;">View Details</button>
          </div>
        </div>
      </div>
    `;
  }

  getSensorsContent() {
    return `
      <div class="glass-lg">
        <h3>Sensor Management</h3>
        <div class="responsive-grid">
          <div class="premium-card">
            <h4>🌡️ Temperature Sensor</h4>
            <p><strong>Current Value:</strong> 25.5°C</p>
            <p><strong>Status:</strong> <span class="badge badge-success">Active</span></p>
          </div>
          <div class="premium-card">
            <h4>💧 Humidity Sensor</h4>
            <p><strong>Current Value:</strong> 65%</p>
            <p><strong>Status:</strong> <span class="badge badge-success">Active</span></p>
          </div>
          <div class="premium-card">
            <h4>🌱 Soil Moisture Sensor</h4>
            <p><strong>Current Value:</strong> 45%</p>
            <p><strong>Status:</strong> <span class="badge badge-success">Active</span></p>
          </div>
        </div>
      </div>
    `;
  }

  getLogsContent() {
    return `
      <div class="glass-lg">
        <h3>Audit Logs</h3>
        <ul class="animated-list">
          <li><strong>10:30 AM:</strong> Admin login from 192.168.1.100</li>
          <li><strong>10:25 AM:</strong> Pump control command executed</li>
          <li><strong>10:20 AM:</strong> Sensor data received from device-1</li>
          <li><strong>10:15 AM:</strong> Configuration updated</li>
          <li><strong>10:10 AM:</strong> System health check passed</li>
        </ul>
      </div>
    `;
  }

  getSystemContent() {
    return `
      <div class="glass-lg">
        <h3>System Health</h3>
        <div class="responsive-grid">
          <div class="premium-card">
            <h4>CPU Usage</h4>
            <div style="height: 100px; background: var(--bg-secondary); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
              <strong style="font-size: 2rem; color: var(--warning);">35%</strong>
            </div>
          </div>
          <div class="premium-card">
            <h4>Memory Usage</h4>
            <div style="height: 100px; background: var(--bg-secondary); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
              <strong style="font-size: 2rem; color: var(--success);">42%</strong>
            </div>
          </div>
          <div class="premium-card">
            <h4>Uptime</h4>
            <div style="height: 100px; background: var(--bg-secondary); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
              <strong style="font-size: 2rem; color: var(--primary);">45 Days</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getBackupContent() {
    return `
      <div class="glass-lg">
        <h3>Backup & Restore</h3>
        <div class="premium-card" style="margin-bottom: 1.5rem;">
          <h4>Create Backup</h4>
          <p style="color: var(--text-secondary);">Create a full backup of system data and configurations.</p>
          <button class="btn btn-primary">💾 Create Backup Now</button>
        </div>
        <div class="premium-card">
          <h4>Recent Backups</h4>
          <ul class="animated-list">
            <li><strong>2026-07-02 02:00 AM</strong> - 125.4 MB</li>
            <li><strong>2026-07-01 02:00 AM</strong> - 124.8 MB</li>
            <li><strong>2026-06-30 02:00 AM</strong> - 124.2 MB</li>
          </ul>
        </div>
      </div>
    `;
  }

  getSettingsContent() {
    return `
      <div class="glass-lg">
        <h3>Settings</h3>
        <div class="premium-card">
          <h4>MQTT Configuration</h4>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Broker URL</label>
            <input type="text" value="ws://localhost:9001" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Username</label>
            <input type="text" value="admin" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          </div>
          <button class="btn btn-primary">✓ Save Changes</button>
        </div>
      </div>
    `;
  }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
  const admin = new AdminPanel();
  admin.initialize();
  window.adminPanel = admin;
});

export default AdminPanel;
