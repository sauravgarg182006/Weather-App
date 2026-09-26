/**
 * WeatherSphere - Reusable UI Components & Renderers (components.js)
 * High-performance vanilla JavaScript component generators.
 */

import {
  formatTemperature,
  formatWind,
  formatDate,
  formatTime,
  formatDayName,
  getWeatherIconUrl,
  generateWeatherNarrative
} from './utils.js';

// ==========================================
// Toast Notification Engine
// ==========================================

export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-triangle-exclamation',
    warning: 'fa-solid fa-circle-exclamation',
    info: 'fa-solid fa-circle-info'
  };

  toast.innerHTML = `
    <i class="${iconMap[type] || iconMap.info}" style="color: var(--color-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'}); font-size: 1.2rem;"></i>
    <span style="flex: 1; font-size: 0.92rem; font-weight: 500;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ==========================================
// Loading & Skeleton States
// ==========================================

export function showLoading(container, text = 'Loading weather data...') {
  if (!container) return;
  container.innerHTML = `
    <div style="text-align: center; padding: 4rem 1rem;">
      <i class="fa-solid fa-spinner spinner-icon" style="font-size: 2.5rem; color: var(--accent-primary);"></i>
      <p style="margin-top: 1.25rem; font-size: 1.05rem; color: var(--text-secondary); font-weight: 500;">${text}</p>
    </div>
  `;
}

export function showError(container, message, onRetry = null) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><i class="fa-solid fa-circle-exclamation" style="color: var(--color-error);"></i></div>
      <h3 class="empty-title">Something went wrong</h3>
      <p class="empty-desc">${message}</p>
      ${onRetry ? `<button class="btn-search" id="btn-retry" style="margin: 0 auto;"><i class="fa-solid fa-rotate-right"></i> Try Again</button>` : ''}
    </div>
  `;
  if (onRetry) {
    const retryBtn = container.querySelector('#btn-retry');
    if (retryBtn) retryBtn.addEventListener('click', onRetry);
  }
}

// ==========================================
// Weather Hero Card Component
// ==========================================

export function createWeatherHeroCard(data, isFavorited = false, unit = 'C') {
  const narrative = generateWeatherNarrative(data, unit);
  const iconUrl = getWeatherIconUrl(data.icon, data.weatherCode);
  const temp = formatTemperature(data.temperature, unit);
  const feelsLike = formatTemperature(data.feelsLike, unit);
  const tempMin = formatTemperature(data.tempMin, unit);
  const tempMax = formatTemperature(data.tempMax, unit);

  const regionString = [data.state, data.country].filter(Boolean).join(', ');

  const card = document.createElement('div');
  card.className = 'weather-hero-card fade-in';
  card.innerHTML = `
    <div class="hero-card-header">
      <div class="location-info">
        <h2 class="location-title">
          <i class="fa-solid fa-location-dot" style="color: var(--accent-primary); font-size: 1.3rem;"></i>
          ${data.city}
        </h2>
        <span class="location-subtitle">${regionString || 'Location'} • ${formatDate(data.localTime || new Date(), data.timezone)} ${formatTime(data.localTime || new Date(), data.timezone)}</span>
      </div>
      <button class="btn-favorite-toggle ${isFavorited ? 'active' : ''}" id="hero-fav-btn" title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}" aria-label="Toggle favorite">
        <i class="${isFavorited ? 'fa-solid' : 'fa-regular'} fa-star"></i>
      </button>
    </div>

    <div class="temp-condition-block">
      <div class="temp-primary-wrap">
        <span class="temp-huge">${temp}</span>
        <span class="temp-unit-symbol">°${unit}</span>
      </div>
      <div class="condition-visual">
        <img class="condition-icon-img" src="${iconUrl}" alt="${data.description || data.condition}" />
        <span class="condition-text">${data.description || data.condition}</span>
      </div>
    </div>

    <div class="temp-ranges">
      <div class="range-item">
        <i class="fa-solid fa-temperature-half" style="color: var(--accent-primary);"></i>
        <span>Feels like: <strong>${feelsLike}°${unit}</strong></span>
      </div>
      <div class="range-item">
        <i class="fa-solid fa-arrow-up" style="color: var(--accent-warm);"></i>
        <span>High: <strong>${tempMax}°${unit}</strong></span>
      </div>
      <div class="range-item">
        <i class="fa-solid fa-arrow-down" style="color: var(--accent-primary);"></i>
        <span>Low: <strong>${tempMin}°${unit}</strong></span>
      </div>
    </div>

    <div class="weather-narrative">
      <i class="fa-solid fa-wand-magic-sparkles narrative-icon"></i>
      <p class="narrative-text">${narrative}</p>
    </div>
  `;

  return card;
}

// ==========================================
// Weather Metrics Grid Component
// ==========================================

export function createMetricsGrid(data, unit = 'C') {
  const grid = document.createElement('div');
  grid.className = 'metrics-grid fade-in';

  // UV index interpretation
  let uvSeverity = 'Low';
  let uvColor = 'var(--color-success)';
  const uv = data.uvIndex !== undefined && data.uvIndex !== null ? Number(data.uvIndex) : null;
  if (uv !== null) {
    if (uv >= 11) { uvSeverity = 'Extreme'; uvColor = 'var(--color-error)'; }
    else if (uv >= 8) { uvSeverity = 'Very High'; uvColor = 'var(--color-error)'; }
    else if (uv >= 6) { uvSeverity = 'High'; uvColor = 'var(--accent-warm)'; }
    else if (uv >= 3) { uvSeverity = 'Moderate'; uvColor = 'var(--color-warning)'; }
  }

  const metrics = [
    {
      label: 'Humidity',
      icon: 'fa-solid fa-droplet',
      value: data.humidity !== undefined && data.humidity !== null ? `${data.humidity}%` : 'Not available',
      sub: data.dewPoint !== undefined && data.dewPoint !== null ? `Dew point: ${formatTemperature(data.dewPoint, unit)}°${unit}` : 'Relative atmospheric'
    },
    {
      label: 'Wind',
      icon: 'fa-solid fa-wind',
      value: formatWind(data.windSpeed, data.windDeg),
      sub: data.windGust ? `Gusts up to ${Math.round(data.windGust)} km/h` : 'Surface wind speed'
    },
    {
      label: 'Air Pressure',
      icon: 'fa-solid fa-gauge-high',
      value: data.pressure ? `${data.pressure} hPa` : 'Not available',
      sub: data.pressure >= 1013 ? 'Normal/High pressure' : 'Low atmospheric pressure'
    },
    {
      label: 'Visibility',
      icon: 'fa-solid fa-eye',
      value: data.visibility !== undefined && data.visibility !== null ? `${(data.visibility / 1000).toFixed(1)} km` : 'Not available',
      sub: data.visibility >= 10000 ? 'Clear visibility' : 'Moderate visibility'
    },
    {
      label: 'Cloud Cover',
      icon: 'fa-solid fa-cloud',
      value: data.cloudiness !== undefined && data.cloudiness !== null ? `${data.cloudiness}%` : 'Not available',
      sub: data.cloudiness < 20 ? 'Mostly clear skies' : data.cloudiness < 70 ? 'Partly cloudy' : 'Overcast'
    },
    {
      label: 'UV Index',
      icon: 'fa-solid fa-sun',
      value: uv !== null ? `${uv.toFixed(1)}` : 'Not available',
      sub: uv !== null ? `<span style="color: ${uvColor}; font-weight: 600;">${uvSeverity}</span> UV risk` : 'Sun exposure'
    },
    {
      label: 'Precipitation',
      icon: 'fa-solid fa-cloud-showers-heavy',
      value: data.rain !== undefined && data.rain !== null ? `${data.rain} mm` : data.pop !== undefined ? `${data.pop}%` : '0 mm',
      sub: data.pop !== undefined ? `${data.pop}% chance of rain` : 'Recent rainfall'
    },
    {
      label: 'Sun Cycle',
      icon: 'fa-solid fa-sun-plant-wilt',
      isSun: true,
      sunrise: data.sunrise ? formatTime(data.sunrise, data.timezone) : '06:00 AM',
      sunset: data.sunset ? formatTime(data.sunset, data.timezone) : '06:30 PM'
    }
  ];

  metrics.forEach(m => {
    const card = document.createElement('div');
    card.className = 'metric-card';

    if (m.isSun) {
      card.innerHTML = `
        <div class="metric-header">
          <span class="metric-label">${m.label}</span>
          <i class="${m.icon} metric-icon"></i>
        </div>
        <div class="sun-metric-grid">
          <div class="sun-box">
            <span><i class="fa-solid fa-arrow-up" style="color: #fbbf24;"></i> Sunrise</span>
            <strong>${m.sunrise}</strong>
          </div>
          <div class="sun-box">
            <span><i class="fa-solid fa-arrow-down" style="color: #f97316;"></i> Sunset</span>
            <strong>${m.sunset}</strong>
          </div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="metric-header">
          <span class="metric-label">${m.label}</span>
          <i class="${m.icon} metric-icon"></i>
        </div>
        <div class="metric-value">${m.value}</div>
        <div class="metric-sub">${m.sub}</div>
      `;
    }

    grid.appendChild(card);
  });

  return grid;
}

// ==========================================
// Hourly Forecast Card Component
// ==========================================

export function createHourlyCard(hour, unit = 'C', isFirst = false) {
  const temp = formatTemperature(hour.temperature, unit);
  const feelsLike = formatTemperature(hour.feelsLike, unit);
  const iconUrl = getWeatherIconUrl(hour.icon, hour.weatherCode);

  const card = document.createElement('div');
  card.className = `hourly-card ${isFirst ? 'active-hour' : ''}`;
  card.innerHTML = `
    <span class="hourly-time">${isFirst ? 'Now' : formatTime(hour.time, hour.timezone || 'UTC')}</span>
    <img class="hourly-icon" src="${iconUrl}" alt="${hour.condition || 'Weather'}" />
    <span class="hourly-temp">${temp}°${unit}</span>
    <span class="hourly-rain"><i class="fa-solid fa-droplet"></i> ${hour.pop !== undefined && hour.pop !== null ? hour.pop : (hour.rain ? 100 : 0)}%</span>
    <span class="hourly-wind">${Math.round(hour.windSpeed || 0)} km/h</span>
  `;
  return card;
}

// ==========================================
// Daily Forecast Row Component
// ==========================================

export function createDailyCard(day, unit = 'C') {
  const minTemp = formatTemperature(day.tempMin, unit);
  const maxTemp = formatTemperature(day.tempMax, unit);
  const iconUrl = getWeatherIconUrl(day.icon, day.weatherCode);

  const row = document.createElement('div');
  row.className = 'daily-card-row fade-in';
  row.innerHTML = `
    <div class="daily-date-col">
      <span class="daily-day-name">${formatDayName(day.date)}</span>
      <span class="daily-day-sub">${formatDate(day.date)}</span>
    </div>
    <div class="daily-condition-col">
      <img class="daily-icon-sm" src="${iconUrl}" alt="${day.condition}" />
      <span class="daily-condition-name">${day.condition || day.description}</span>
    </div>
    <div class="daily-rain-col">
      <i class="fa-solid fa-cloud-rain"></i>
      <span>${day.pop !== undefined && day.pop !== null ? day.pop : (day.rain ? 100 : 0)}%</span>
    </div>
    <div class="daily-temp-bar-col">
      <span class="temp-min-text">${minTemp}°</span>
      <div class="temp-bar-track">
        <div class="temp-bar-fill" style="width: 75%;"></div>
      </div>
      <span class="temp-max-text">${maxTemp}°</span>
    </div>
  `;
  return row;
}

// ==========================================
// City Card Component (Cities Page)
// ==========================================

export function createCityCard(cityData, unit = 'C', onSelect = null) {
  const temp = formatTemperature(cityData.temperature, unit);
  const iconUrl = getWeatherIconUrl(cityData.icon, cityData.weatherCode);

  const card = document.createElement('div');
  card.className = 'city-search-card fade-in';
  card.innerHTML = `
    <div class="city-card-header">
      <div>
        <h3 class="city-card-name">${cityData.name || cityData.city}</h3>
        <span class="city-card-country">${[cityData.state, cityData.country].filter(Boolean).join(', ')}</span>
      </div>
      <img src="${iconUrl}" alt="${cityData.condition}" style="width: 48px; height: 48px; object-fit: contain;" />
    </div>
    <div class="city-card-body">
      <span class="city-card-temp">${temp}°${unit}</span>
      <span style="font-weight: 600; color: var(--text-secondary); text-transform: capitalize;">${cityData.condition || cityData.description || 'Clear'}</span>
    </div>
    <div class="city-card-actions">
      <button class="btn-view-weather view-city-btn" data-city="${cityData.name || cityData.city}">
        <i class="fa-solid fa-arrow-right"></i> View Weather
      </button>
    </div>
  `;

  if (onSelect) {
    const btn = card.querySelector('.view-city-btn');
    if (btn) btn.addEventListener('click', () => onSelect(cityData.name || cityData.city));
  }

  return card;
}

// ==========================================
// Favorite Card Component (Favorites Page)
// ==========================================

export function createFavoriteCard(fav, weather, unit = 'C', onView = null, onDelete = null) {
  const card = document.createElement('div');
  card.className = 'city-search-card fade-in';

  const temp = weather ? `${formatTemperature(weather.temperature, unit)}°${unit}` : '--';
  const condition = weather ? (weather.condition || weather.description) : 'Saved City';
  const iconUrl = weather ? getWeatherIconUrl(weather.icon, weather.weatherCode) : 'https://openweathermap.org/img/wn/02d@2x.png';

  card.innerHTML = `
    <div class="city-card-header">
      <div>
        <h3 class="city-card-name">⭐ ${fav.city}</h3>
        <span class="city-card-country">${fav.country || ''}</span>
      </div>
      <img src="${iconUrl}" alt="${condition}" style="width: 48px; height: 48px; object-fit: contain;" />
    </div>
    <div class="city-card-body">
      <span class="city-card-temp">${temp}</span>
      <span style="font-weight: 600; color: var(--text-secondary); text-transform: capitalize;">${condition}</span>
    </div>
    <div class="city-card-actions">
      <button class="btn-view-weather fav-view-btn" data-city="${fav.city}">
        <i class="fa-solid fa-eye"></i> View Weather
      </button>
      <button class="btn-delete-item fav-del-btn" title="Remove from favorites" data-id="${fav._id || fav.id}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;

  if (onView) {
    const viewBtn = card.querySelector('.fav-view-btn');
    if (viewBtn) viewBtn.addEventListener('click', () => onView(fav.city));
  }
  if (onDelete) {
    const delBtn = card.querySelector('.fav-del-btn');
    if (delBtn) delBtn.addEventListener('click', () => onDelete(fav._id || fav.id, fav.city));
  }

  return card;
}

// ==========================================
// History Item Component (History Page)
// ==========================================

export function createHistoryItem(item, onSelect = null, onDelete = null) {
  const row = document.createElement('div');
  row.className = 'history-item-row fade-in';
  row.innerHTML = `
    <div class="history-left" data-city="${item.city}">
      <div class="history-icon-badge">
        <i class="fa-solid fa-clock-rotate-left"></i>
      </div>
      <div>
        <h4 class="history-city-name">${item.city}</h4>
        <span class="history-time-stamp">${item.country ? item.country + ' • ' : ''}${formatDate(item.searchedAt || item.createdAt)} ${formatTime(item.searchedAt || item.createdAt)}</span>
      </div>
    </div>
    <button class="btn-delete-item history-del-btn" title="Delete search record" data-id="${item._id || item.id}">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  if (onSelect) {
    const left = row.querySelector('.history-left');
    if (left) left.addEventListener('click', () => onSelect(item.city));
  }
  if (onDelete) {
    const delBtn = row.querySelector('.history-del-btn');
    if (delBtn) delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete(item._id || item.id);
    });
  }

  return row;
}

// ==========================================
// Navbar Auth State Renderer
// ==========================================

export function renderNavbarAuth(user) {
  const authContainer = document.getElementById('navbar-auth-section');
  if (!authContainer) return;

  if (user) {
    authContainer.innerHTML = `
      <div class="btn-user-profile" id="user-profile-btn" title="Signed in as ${user.name}">
        <span class="user-avatar-sm">${(user.name || 'U').charAt(0).toUpperCase()}</span>
        <span>${(user.name || '').split(' ')[0]}</span>
        <button id="logout-btn" title="Sign out" style="margin-left: 0.4rem; color: var(--color-error);"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    `;
  } else {
    // Relative link to login page depending on current path
    const isPagesDir = window.location.pathname.includes('/pages/');
    const loginPath = isPagesDir ? 'login.html' : 'pages/login.html';
    authContainer.innerHTML = `
      <a href="${loginPath}" class="btn-auth">
        <i class="fa-solid fa-user"></i>
        <span>Sign In</span>
      </a>
    `;
  }
}
