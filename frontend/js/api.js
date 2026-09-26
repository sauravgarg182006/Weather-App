/**
 * WeatherSphere - Centralized REST API Service (api.js)
 * Clean, production-grade Fetch API wrapper with authentication,
 * error handling, and normalized responses.
 */

// Dynamically determine API base URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

const TOKEN_KEY = 'weathersphere_auth_token';

/**
 * Universal fetch wrapper with timeout, token injection, and JSON parsing.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Invalid server response'
    }));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Please check your network.');
    }
    throw error;
  }
}

// ==========================================
// Weather & Geocoding Endpoints
// ==========================================

export async function getCurrentWeatherByCity(city, isSearch = false) {
  if (!city || !city.trim()) throw new Error('Please enter a city name.');
  const searchParam = isSearch ? '&isSearch=true' : '';
  return await request(`/weather?city=${encodeURIComponent(city.trim())}${searchParam}`);
}

export async function getCurrentWeatherByCoordinates(lat, lon) {
  if (lat === undefined || lon === undefined) throw new Error('Invalid coordinates provided.');
  return await request(`/weather/coordinates?lat=${lat}&lon=${lon}`);
}

export async function getForecastByCity(city) {
  if (!city || !city.trim()) throw new Error('Please enter a city name.');
  return await request(`/forecast?city=${encodeURIComponent(city.trim())}`);
}

export async function getForecastByCoordinates(lat, lon) {
  if (lat === undefined || lon === undefined) throw new Error('Invalid coordinates provided.');
  return await request(`/forecast/coordinates?lat=${lat}&lon=${lon}`);
}

export async function searchCities(query) {
  if (!query || !query.trim()) return { success: true, data: [] };
  return await request(`/weather/cities/search?q=${encodeURIComponent(query.trim())}`);
}

// ==========================================
// Authentication Endpoints
// ==========================================

export async function registerUser(name, email, password) {
  const result = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  const token = result.token || result.data?.token;
  if (result.success && token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  return result;
}

export async function loginUser(email, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = result.token || result.data?.token;
  if (result.success && token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  return result;
}

export async function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const res = await request('/auth/me');
    return res.data;
  } catch (err) {
    // If token invalid, remove it
    if (err.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new CustomEvent('weathersphere:authChanged', { detail: { user: null } }));
}

// ==========================================
// Favorites Endpoints (Protected)
// ==========================================

export async function getFavorites() {
  return await request('/favorites');
}

export async function addFavorite(favoriteData) {
  return await request('/favorites', {
    method: 'POST',
    body: JSON.stringify(favoriteData),
  });
}

export async function removeFavorite(id) {
  return await request(`/favorites/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// History Endpoints (Protected)
// ==========================================

export async function getHistory() {
  return await request('/history');
}

export async function deleteHistoryItem(id) {
  return await request(`/history/${id}`, {
    method: 'DELETE',
  });
}

export async function clearHistory() {
  return await request('/history', {
    method: 'DELETE',
  });
}

export async function checkServerHealth() {
  try {
    return await request('/health');
  } catch (e) {
    return { success: false, status: 'offline' };
  }
}
