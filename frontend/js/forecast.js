/**
 * WeatherSphere - Detailed Forecast Logic (forecast.js)
 * Controls hourly timeline, 7-day daily forecast rows, and city search for forecast page.
 */

import { getForecastByCity, getForecastByCoordinates } from './api.js';
import { themeManager } from './theme.js';
import { getUserCoordinates } from './location.js';
import {
  createHourlyCard,
  createDailyCard,
  showLoading,
  showError,
  showToast
} from './components.js';

export class ForecastManager {
  constructor() {
    this.forecastData = null;
    this.activeCity = 'Jaipur';
  }

  async init() {
    this.bindSearchEvents();
    this.bindLocationEvents();
    this.bindUnitChangeListener();

    const params = new URLSearchParams(window.location.search);
    const city = params.get('city') || localStorage.getItem('weathersphere_last_city') || 'Jaipur';
    await this.loadForecast(city);
  }

  bindUnitChangeListener() {
    window.addEventListener('weathersphere:unitChanged', () => {
      if (this.forecastData) {
        this.renderForecast();
      }
    });
  }

  bindSearchEvents() {
    const form = document.getElementById('forecast-search-form');
    const input = document.getElementById('forecast-search-input');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = input.value.trim();
        if (city) this.loadForecast(city);
      });
    }
  }

  bindLocationEvents() {
    const locBtn = document.getElementById('btn-forecast-location');
    if (!locBtn) return;

    locBtn.addEventListener('click', async () => {
      const origHtml = locBtn.innerHTML;
      locBtn.disabled = true;
      locBtn.innerHTML = '<i class="fa-solid fa-spinner spinner-icon"></i>';
      try {
        const coords = await getUserCoordinates();
        await this.loadForecastByCoords(coords.latitude, coords.longitude);
        showToast('Forecast loaded for your current location!', 'success');
      } catch (err) {
        showToast(err.message, 'warning');
      } finally {
        locBtn.disabled = false;
        locBtn.innerHTML = origHtml;
      }
    });
  }

  async loadForecast(city) {
    const hourlyContainer = document.getElementById('hourly-track-container');
    const dailyContainer = document.getElementById('daily-list-container');
    const titleEl = document.getElementById('forecast-city-title');

    showLoading(hourlyContainer, `Loading forecast for ${city}...`);
    if (dailyContainer) dailyContainer.innerHTML = '';

    try {
      const res = await getForecastByCity(city);
      if (!res.success) throw new Error(res.message || 'Forecast unavailable.');

      this.forecastData = res.data;
      this.activeCity = res.data.city;
      localStorage.setItem('weathersphere_last_city', this.activeCity);

      if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-calendar-days" style="color: var(--accent-primary);"></i> Forecast for ${this.forecastData.city}, ${this.forecastData.country}`;
      }

      this.renderForecast();
    } catch (err) {
      const msg = err.message || 'Unable to fetch forecast.';
      showError(hourlyContainer, msg, () => this.loadForecast('Jaipur'));
      showToast(msg, 'error');
    }
  }

  async loadForecastByCoords(lat, lon) {
    const hourlyContainer = document.getElementById('hourly-track-container');
    const dailyContainer = document.getElementById('daily-list-container');
    const titleEl = document.getElementById('forecast-city-title');

    showLoading(hourlyContainer, 'Loading forecast for your coordinates...');
    if (dailyContainer) dailyContainer.innerHTML = '';

    try {
      const res = await getForecastByCoordinates(lat, lon);
      if (!res.success) throw new Error(res.message || 'Forecast unavailable.');

      this.forecastData = res.data;
      this.activeCity = res.data.city;
      localStorage.setItem('weathersphere_last_city', this.activeCity);

      if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-location-dot" style="color: var(--accent-primary);"></i> Forecast for ${this.forecastData.city}, ${this.forecastData.country}`;
      }

      this.renderForecast();
    } catch (err) {
      showError(hourlyContainer, err.message, () => this.loadForecast('Jaipur'));
      showToast(err.message, 'error');
    }
  }

  renderForecast() {
    const hourlyContainer = document.getElementById('hourly-track-container');
    const dailyContainer = document.getElementById('daily-list-container');

    if (!this.forecastData) return;
    const unit = themeManager.getUnit();

    // 1. Render Hourly Cards (24 hours)
    if (hourlyContainer && this.forecastData.hourly) {
      hourlyContainer.innerHTML = '';
      const track = document.createElement('div');
      track.className = 'hourly-scroll-container';

      this.forecastData.hourly.slice(0, 24).forEach((hour, idx) => {
        const card = createHourlyCard(hour, unit, idx === 0);
        track.appendChild(card);
      });

      hourlyContainer.appendChild(track);
    }

    // 2. Render Daily Cards (7 Days)
    if (dailyContainer && this.forecastData.daily) {
      dailyContainer.innerHTML = '';
      this.forecastData.daily.forEach((day) => {
        const row = createDailyCard(day, unit);
        dailyContainer.appendChild(row);
      });
    }
  }
}
