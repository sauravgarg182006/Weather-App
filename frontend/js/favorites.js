/**
 * WeatherSphere - Favorites Management (favorites.js)
 * Manages user's saved cities with live weather previews and direct navigation.
 */

import { getFavorites, removeFavorite, getCurrentWeatherByCity } from './api.js';
import { authManager } from './auth.js';
import { themeManager } from './theme.js';
import { createFavoriteCard, showLoading, showError, showToast } from './components.js';

export class FavoritesManager {
  constructor() {
    this.favorites = [];
    this.weatherCache = {};
  }

  async init() {
    if (!authManager.requireAuth('Please sign in to view your favorite cities.')) {
      return;
    }

    this.bindUnitChangeListener();
    await this.loadFavorites();
  }

  bindUnitChangeListener() {
    window.addEventListener('weathersphere:unitChanged', () => {
      this.renderFavorites();
    });
  }

  async loadFavorites() {
    const container = document.getElementById('favorites-grid');
    showLoading(container, 'Loading your favorite cities...');

    try {
      const res = await getFavorites();
      if (!res.success) throw new Error(res.message || 'Failed to load favorites');

      this.favorites = res.data || [];
      if (this.favorites.length === 0) {
        this.renderEmptyState();
        return;
      }

      // Fetch live weather previews in parallel
      await Promise.all(
        this.favorites.map(async (fav) => {
          if (!this.weatherCache[fav.city]) {
            try {
              const wRes = await getCurrentWeatherByCity(fav.city);
              if (wRes.success) this.weatherCache[fav.city] = wRes.data;
            } catch (e) {
              // Weather unavailable for that city
            }
          }
        })
      );

      this.renderFavorites();
    } catch (err) {
      showError(container, err.message, () => this.loadFavorites());
    }
  }

  renderFavorites() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;

    if (this.favorites.length === 0) {
      this.renderEmptyState();
      return;
    }

    container.innerHTML = '';
    const unit = themeManager.getUnit();

    this.favorites.forEach((fav) => {
      const weather = this.weatherCache[fav.city] || null;
      const card = createFavoriteCard(
        fav,
        weather,
        unit,
        (city) => this.viewCityWeather(city),
        (id, city) => this.deleteFavorite(id, city)
      );
      container.appendChild(card);
    });
  }

  renderEmptyState() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon"><i class="fa-regular fa-star" style="color: #fbbf24;"></i></div>
        <h3 class="empty-title">No Favorite Cities Yet</h3>
        <p class="empty-desc">Search for any city on the home page and click the star icon to save it here for quick access.</p>
        <a href="../index.html" class="btn-search" style="display: inline-flex; margin: 0 auto;">
          <i class="fa-solid fa-magnifying-glass"></i> Explore Weather
        </a>
      </div>
    `;
  }

  viewCityWeather(city) {
    window.location.href = `../index.html?city=${encodeURIComponent(city)}`;
  }

  async deleteFavorite(id, cityName) {
    try {
      const res = await removeFavorite(id);
      if (res.success) {
        this.favorites = this.favorites.filter(f => (f._id || f.id) !== id);
        showToast(`${cityName} removed from your favorites.`, 'info');
        this.renderFavorites();
      }
    } catch (err) {
      showToast(err.message || 'Unable to remove favorite.', 'error');
    }
  }
}
