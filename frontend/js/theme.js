/**
 * WeatherSphere - Theme & Unit State Management (theme.js)
 * Manages Dark/Light mode and Celsius/Fahrenheit units with localStorage.
 */

const THEME_KEY = 'weathersphere_theme';
const UNIT_KEY = 'weathersphere_unit';

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
    this.currentUnit = localStorage.getItem(UNIT_KEY) || 'C';
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.applyUnit(this.currentUnit);
    this.attachEventListeners();
  }

  getTheme() {
    return this.currentTheme;
  }

  getUnit() {
    return this.currentUnit;
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update theme toggle icons across all pages
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.innerHTML = theme === 'dark' 
        ? '<i class="fa-solid fa-sun" title="Switch to Light Mode"></i>' 
        : '<i class="fa-solid fa-moon" title="Switch to Dark Mode"></i>';
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
    });

    window.dispatchEvent(new CustomEvent('weathersphere:themeChanged', { detail: { theme } }));
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  applyUnit(unit) {
    this.currentUnit = unit;
    localStorage.setItem(UNIT_KEY, unit);

    // Update pill buttons
    const unitBtns = document.querySelectorAll('.unit-btn');
    unitBtns.forEach(btn => {
      const btnUnit = btn.getAttribute('data-unit');
      if (btnUnit === unit) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.dispatchEvent(new CustomEvent('weathersphere:unitChanged', { detail: { unit } }));
  }

  setUnit(unit) {
    if (unit === 'C' || unit === 'F') {
      this.applyUnit(unit);
    }
  }

  attachEventListeners() {
    document.addEventListener('click', (e) => {
      const themeToggle = e.target.closest('.theme-toggle-btn');
      if (themeToggle) {
        e.preventDefault();
        this.toggleTheme();
        return;
      }

      const unitBtn = e.target.closest('.unit-btn');
      if (unitBtn) {
        e.preventDefault();
        const unit = unitBtn.getAttribute('data-unit');
        if (unit) this.setUnit(unit);
      }
    });
  }
}

export const themeManager = new ThemeManager();
