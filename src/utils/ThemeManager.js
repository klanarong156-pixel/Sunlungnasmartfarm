/**
 * SmartFarm V15 - Theme Manager
 * Handles dark mode and light mode theme switching
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = ['light', 'dark'];
    this.storageKey = 'theme';
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Check saved preference
    const savedTheme = localStorage.getItem(this.storageKey);
    if (savedTheme && this.themes.includes(savedTheme)) {
      this.setTheme(savedTheme, false);
      return;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark', false);
    } else {
      this.setTheme('light', false);
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem(this.storageKey)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    console.log(`🎨 Theme initialized: ${this.currentTheme}`);
  }

  /**
   * Set theme
   */
  setTheme(theme, save = true) {
    if (!this.themes.includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }

    const html = document.documentElement;
    const body = document.body;

    // Remove all theme classes
    this.themes.forEach(t => {
      html.classList.remove(t);
      body.classList.remove(`theme-${t}`);
    });

    // Add new theme class
    html.classList.add(theme);
    body.classList.add(`theme-${theme}`);

    // Update currentTheme
    this.currentTheme = theme;

    // Save preference
    if (save) {
      localStorage.setItem(this.storageKey, theme);
    }

    // Dispatch custom event
    const event = new CustomEvent('theme-changed', { detail: { theme } });
    window.dispatchEvent(event);

    console.log(`🎨 Theme changed to: ${theme}`);
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Toggle between light and dark
   */
  toggleTheme() {
    const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Check if dark mode
   */
  isDark() {
    return this.currentTheme === 'dark';
  }

  /**
   * Check if light mode
   */
  isLight() {
    return this.currentTheme === 'light';
  }

  /**
   * Get CSS variable value
   */
  getCSSVariable(varName) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName);
    return value.trim();
  }

  /**
   * Set CSS variable value
   */
  setCSSVariable(varName, value) {
    document.documentElement.style.setProperty(varName, value);
  }

  /**
   * Create color palette for current theme
   */
  getPalette() {
    return {
      primary: this.getCSSVariable('--primary'),
      accent: this.getCSSVariable('--accent'),
      success: this.getCSSVariable('--success'),
      warning: this.getCSSVariable('--warning'),
      error: this.getCSSVariable('--error'),
      info: this.getCSSVariable('--info'),
      bgPrimary: this.getCSSVariable('--bg-primary'),
      bgSecondary: this.getCSSVariable('--bg-secondary'),
      bgTertiary: this.getCSSVariable('--bg-tertiary'),
      textPrimary: this.getCSSVariable('--text-primary'),
      textSecondary: this.getCSSVariable('--text-secondary'),
      border: this.getCSSVariable('--border')
    };
  }

  /**
   * Apply custom theme
   */
  applyCustomTheme(customVars) {
    const html = document.documentElement;
    Object.keys(customVars).forEach(varName => {
      html.style.setProperty(`--${varName}`, customVars[varName]);
    });
  }

  /**
   * Reset to default theme
   */
  resetTheme() {
    localStorage.removeItem(this.storageKey);
    this.init();
  }
}

export default ThemeManager;
