/**
 * WeatherSphere - Geocoding Service (geocodingService.js)
 * Resolves cities to coordinates and coordinates to city metadata.
 */

const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.WEATHER_API_KEY;

/**
 * Searches for matching cities by name.
 */
async function searchLocations(query, limit = 5) {
  if (!query || !query.trim()) return [];

  // 1. Try OpenWeather Geocoding if API key is provided and not default placeholder
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY') {
    try {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${OPENWEATHER_API_KEY}`;
      const response = await axios.get(url, { timeout: 6000 });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map(item => ({
          name: item.name,
          country: item.country,
          state: item.state || '',
          lat: item.lat,
          lon: item.lon,
        }));
      }
    } catch (err) {
      console.warn(`[Geocoding] OpenWeather geocoding error (${err.message}). Falling back to secondary geocoder.`);
    }
  }

  // 2. High-reliability Open-Meteo Global Geocoding API
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${limit}&language=en&format=json`;
    const response = await axios.get(url, { timeout: 7000 });
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results.map(item => ({
        name: item.name,
        country: item.country || item.country_code || '',
        state: item.admin1 || '',
        lat: item.latitude,
        lon: item.longitude,
        timezone: item.timezone || 'UTC'
      }));
    }
  } catch (err) {
    console.error(`[Geocoding] Secondary geocoder error: ${err.message}`);
  }

  return [];
}

/**
 * Resolves the primary coordinates for a city.
 */
async function resolveCoordinates(cityName) {
  const matches = await searchLocations(cityName, 1);
  if (!matches || matches.length === 0) {
    throw new Error(`City "${cityName}" not found. Please verify the spelling.`);
  }
  return matches[0];
}

/**
 * Reverse geocodes coordinates to a friendly city name.
 */
async function reverseGeocode(lat, lon) {
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY') {
    try {
      const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const res = await axios.get(url, { timeout: 6000 });
      if (res.data && res.data[0]) {
        return {
          name: res.data[0].name,
          country: res.data[0].country,
          state: res.data[0].state || '',
        };
      }
    } catch (e) {
      // Fallback
    }
  }

  // Fallback to BigDataCloud free client-safe reverse geocode or coordinate label
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await axios.get(url, { timeout: 5000 });
    if (res.data) {
      return {
        name: res.data.city || res.data.locality || res.data.principalSubdivision || 'Current Location',
        country: res.data.countryName || res.data.countryCode || '',
        state: res.data.principalSubdivision || '',
      };
    }
  } catch (e) {
    // Return fallback
  }

  return {
    name: 'Current Location',
    country: '',
    state: '',
  };
}

module.exports = {
  searchLocations,
  resolveCoordinates,
  reverseGeocode,
};
