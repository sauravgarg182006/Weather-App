/**
 * WeatherSphere - Authentication Handler (auth.js)
 * Manages user login, registration, token validation, and auth guards.
 */

import { loginUser, registerUser, getCurrentUser, logoutUser } from './api.js';
import { showToast } from './components.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      this.user = await getCurrentUser();
    } catch (e) {
      this.user = null;
    }
    this.isInitialized = true;
    return this.user;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return Boolean(localStorage.getItem('weathersphere_auth_token'));
  }

  setupLoginForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please enter both email and password.', 'warning');
        return;
      }

      const origBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner spinner-icon"></i> Signing in...';

      try {
        const res = await loginUser(email, password);
        if (res.success) {
          showToast(`Welcome back, ${res.user.name}!`, 'success');
          setTimeout(() => {
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
            window.location.href = redirectUrl;
          }, 800);
        } else {
          showToast(res.message || 'Login failed', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Unable to sign in. Please check credentials.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }
    });
  }

  setupRegisterForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;
      const confirmPassword = form.confirmPassword.value;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!name || !email || !password) {
        showToast('Please fill in all required fields.', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'warning');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'warning');
        return;
      }

      const origBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner spinner-icon"></i> Creating account...';

      try {
        const res = await registerUser(name, email, password);
        if (res.success) {
          showToast('Account created successfully! Please sign in.', 'success');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1200);
        } else {
          showToast(res.message || 'Registration failed', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Registration failed. Email might already be taken.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }
    });
  }

  requireAuth(redirectMessage = 'Please sign in to access this page.') {
    if (!this.isAuthenticated()) {
      showToast(redirectMessage, 'info');
      const isPagesDir = window.location.pathname.includes('/pages/');
      const loginPath = isPagesDir ? 'login.html' : 'pages/login.html';
      const currentUrl = encodeURIComponent(window.location.href);
      setTimeout(() => {
        window.location.href = `${loginPath}?redirect=${currentUrl}`;
      }, 900);
      return false;
    }
    return true;
  }
}

export const authManager = new AuthManager();
