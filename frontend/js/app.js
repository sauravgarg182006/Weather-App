/**
 * WeatherSphere - Main Frontend Application Entry Point (app.js)
 * Global layout, navbar interactions, authentication state, and routing glue.
 */

import { themeManager } from './theme.js';
import { authManager } from './auth.js';
import { logoutUser } from './api.js';
import { renderNavbarAuth, showToast } from './components.js';

class WeatherSphereApp {
  constructor() {
    this.currentUser = null;
  }

  async init() {
    // 1. Initialize Theme & Unit
    themeManager.init();

    // 2. Setup Navbar Controls & Mobile Menu
    this.setupNavigation();

    // 3. Initialize Authentication State
    this.currentUser = await authManager.init();
    renderNavbarAuth(this.currentUser);

    // 4. Listen for Auth Changes
    window.addEventListener('weathersphere:authChanged', (e) => {
      this.currentUser = e.detail?.user || null;
      renderNavbarAuth(this.currentUser);
    });

    // 5. Global Logout Handler
    document.addEventListener('click', (e) => {
      if (e.target.closest('#logout-btn')) {
        e.preventDefault();
        logoutUser();
        showToast('You have been signed out.', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });

    // 6. Highlight Active Navigation Link
    this.highlightActiveNav();
  }

  setupNavigation() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const navLinks = document.querySelector('.nav-links');

    if (hamburgerBtn && navLinks) {
      hamburgerBtn.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        hamburgerBtn.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!hamburgerBtn.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('open');
          hamburgerBtn.classList.remove('active');
        }
      });
    }
  }

  highlightActiveNav() {
    const currentPath = window.location.pathname.toLowerCase();
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
      const href = link.getAttribute('href').toLowerCase();
      // Determine if active
      if (
        (currentPath.endsWith('/') || currentPath.endsWith('index.html')) && (href === 'index.html' || href === './index.html' || href === '../index.html')
      ) {
        link.classList.add('active');
      } else if (href && currentPath.includes(href.replace('../', '').replace('./', ''))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new WeatherSphereApp();
  app.init();
});
