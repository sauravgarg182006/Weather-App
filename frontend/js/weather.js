/**
 * WeatherSphere - Current Weather Logic (weather.js)
 * Manages Home page dashboard, search handling, geolocation, and favorite toggling.
 */

import {
  getCurrentWeatherByCity,
  getCurrentWeatherByCoordinates,
  getForecastByCity,
  getForecastByCoordinates,
  getFavorites,
  addFavorite,
  removeFavorite
} from './api.js';

import { getUserCoordinates } from './location.js';
import { themeManager } from './theme.js';
import { authManager } from './auth.js';
import {
  createWeatherHeroCard,
  createMetricsGrid,
  createHourlyCard,
  showLoading,
  showError,
  showToast
} from './components.js';

export class WeatherDashboard {
  constructor() {
    this.currentWeatherData = null;
    this.currentForecastData = null;
    this.userFavorites = [];
    this.activeCity = 'Jaipur'; // Default starter city
  }

  async init() {
    this.bindSearchEvents();
    this.bindLocationEvents();
    this.bindQuickChips();
    this.bindUnitChangeListener();

    // Check URL query parameters for ?city=
    const params = new URLSearchParams(window.location.search);
    const queryCity = params.get('city');

    const lastCity = queryCity || localStorage.getItem('weathersphere_last_city') || 'Jaipur';
    // Page load / refresh is NOT an explicit user search
    await this.loadWeather(lastCity, false);
  }

  bindUnitChangeListener() {
    window.addEventListener('weathersphere:unitChanged', () => {
      if (this.currentWeatherData) {
        this.renderDashboard();
      }
    });
  }

  bindSearchEvents() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = searchInput.value.trim();
        if (!city) {
          showToast('Please enter a city name to search.', 'warning');
          return;
        }
        // Explicit user search
        await this.loadWeather(city, true);
      });
    }
  }

  bindLocationEvents() {
    const locBtn = document.getElementById('btn-use-location');
    if (!locBtn) return;

    locBtn.addEventListener('click', async () => {
      const origHtml = locBtn.innerHTML;
      locBtn.disabled = true;
      locBtn.innerHTML = '<i class="fa-solid fa-spinner spinner-icon"></i> Locating...';

      const heroContainer = document.getElementById('hero-card-container');
      const metricsContainer = document.getElementById('metrics-container');
      showLoading(heroContainer, 'Accessing your coordinates...');

      try {
        const coords = await getUserCoordinates();
        await this.loadWeatherByCoords(coords.latitude, coords.longitude);
        showToast('Weather updated for your current location!', 'success');
      } catch (err) {
        showToast(err.message, 'warning');
        if (this.currentWeatherData) {
          this.renderDashboard();
        } else {
          showError(heroContainer, err.message, () => this.loadWeather('Jaipur', false));
        }
      } finally {
        locBtn.disabled = false;
        locBtn.innerHTML = origHtml;
      }
    });
  }

  bindQuickChips() {
    const chips = document.querySelectorAll('.city-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const city = chip.getAttribute('data-city');
        // Explicit user chip click search
        if (city) this.loadWeather(city, true);
      });
    });
  }

  async loadWeather(city, isSearch = false) {
    const heroContainer = document.getElementById('hero-card-container');
    const metricsContainer = document.getElementById('metrics-container');
    const hourlyContainer = document.getElementById('hourly-container');

    showLoading(heroContainer, `Fetching weather for ${city}...`);
    if (metricsContainer) metricsContainer.innerHTML = '';
    if (hourlyContainer) hourlyContainer.innerHTML = '';

    try {
      // Parallel fetch current weather & forecast
      const [weatherRes, forecastRes] = await Promise.all([
        getCurrentWeatherByCity(city, isSearch),
        getForecastByCity(city).catch(() => null)
      ]);

      if (!weatherRes.success) {
        throw new Error(weatherRes.message || 'City not found.');
      }

      this.currentWeatherData = weatherRes.data;
      this.currentForecastData = forecastRes?.data || null;
      this.activeCity = this.currentWeatherData.city;
      localStorage.setItem('weathersphere_last_city', this.activeCity);

      // Check favorites if user is authenticated
      if (authManager.isAuthenticated()) {
        try {
          const favRes = await getFavorites();
          this.userFavorites = favRes.data || [];
        } catch (e) {
          this.userFavorites = [];
        }
      }

      this.renderDashboard();
    } catch (err) {
      const msg = err.message || 'City not found. Please check the spelling.';
      showError(heroContainer, msg, () => this.loadWeather('Jaipur'));
      showToast(msg, 'error');
    }
  }

  async loadWeatherByCoords(lat, lon) {
    const heroContainer = document.getElementById('hero-card-container');
    const metricsContainer = document.getElementById('metrics-container');
    const hourlyContainer = document.getElementById('hourly-container');

    showLoading(heroContainer, 'Fetching weather for your coordinates...');
    if (metricsContainer) metricsContainer.innerHTML = '';
    if (hourlyContainer) hourlyContainer.innerHTML = '';

    try {
      const [weatherRes, forecastRes] = await Promise.all([
        getCurrentWeatherByCoordinates(lat, lon),
        getForecastByCoordinates(lat, lon).catch(() => null)
      ]);

      if (!weatherRes.success) {
        throw new Error(weatherRes.message || 'Location not found.');
      }

      this.currentWeatherData = weatherRes.data;
      this.currentForecastData = forecastRes?.data || null;
      this.activeCity = this.currentWeatherData.city;
      localStorage.setItem('weathersphere_last_city', this.activeCity);

      if (authManager.isAuthenticated()) {
        try {
          const favRes = await getFavorites();
          this.userFavorites = favRes.data || [];
        } catch (e) {
          this.userFavorites = [];
        }
      }

      this.renderDashboard();
    } catch (err) {
      showError(heroContainer, err.message, () => this.loadWeather('Jaipur'));
      showToast(err.message, 'error');
    }
  }

  renderDashboard() {
    const heroContainer = document.getElementById('hero-card-container');
    const metricsContainer = document.getElementById('metrics-container');
    const hourlyContainer = document.getElementById('hourly-container');

    if (!heroContainer || !this.currentWeatherData) return;

    const unit = themeManager.getUnit();
    const isFavorited = this.userFavorites.some(f => 
      f.city.toLowerCase() === this.currentWeatherData.city.toLowerCase()
    );

    // 1. Render Hero Card
    heroContainer.innerHTML = '';
    const heroCard = createWeatherHeroCard(this.currentWeatherData, isFavorited, unit);
    heroContainer.appendChild(heroCard);

    // Favorite toggle listener on Hero Card
    const favBtn = heroCard.querySelector('#hero-fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', () => this.toggleFavorite());
    }

    // 2. Render Metrics Grid
    if (metricsContainer) {
      metricsContainer.innerHTML = '';
      const metricsGrid = createMetricsGrid(this.currentWeatherData, unit);
      metricsContainer.appendChild(metricsGrid);
    }

    // 3. Render 24h Hourly mini-track if forecast available
    if (hourlyContainer && this.currentForecastData?.hourly) {
      hourlyContainer.innerHTML = '';
      const track = document.createElement('div');
      track.className = 'hourly-scroll-container';
      
      const hoursToDisplay = this.currentForecastData.hourly.slice(0, 12);
      hoursToDisplay.forEach((hour, idx) => {
        const card = createHourlyCard(hour, unit, idx === 0);
        track.appendChild(card);
      });

      hourlyContainer.appendChild(track);
    }
  }

  async toggleFavorite() {
    if (!authManager.isAuthenticated()) {
      showToast('Please sign in to save cities to your favorites!', 'info');
      return;
    }

    const city = this.currentWeatherData.city;
    const country = this.currentWeatherData.country;
    const existing = this.userFavorites.find(f => f.city.toLowerCase() === city.toLowerCase());

    try {
      if (existing) {
        await removeFavorite(existing._id || existing.id);
        this.userFavorites = this.userFavorites.filter(f => f._id !== existing._id && f.id !== existing.id);
        showToast(`${city} removed from favorites.`, 'info');
      } else {
        const res = await addFavorite({
          city,
          country,
          latitude: this.currentWeatherData.coordinates?.lat,
          longitude: this.currentWeatherData.coordinates?.lon
        });
        if (res.success && res.data) {
          this.userFavorites.push(res.data);
          showToast(`⭐ ${city} added to favorites!`, 'success');
        }
      }
      this.renderDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to update favorite', 'error');
    }
  }
}
