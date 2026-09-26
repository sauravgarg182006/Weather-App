/**
 * WeatherSphere - Weather Controller (weatherController.js)
 * Manages weather endpoints, coordinates resolution, and search logging.
 */

const weatherService = require('../services/weatherService');
const geocodingService = require('../services/geocodingService');
const SearchHistoryModel = require('../models/SearchHistory');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Get current weather by city name
// @route   GET /api/weather?city=Jaipur&isSearch=true
// @access  Public (optional auth logs history only when isSearch=true)
const getWeather = async (req, res, next) => {
  try {
    const city = req.query.city;
    const isSearch = req.query.isSearch === 'true' || req.query.saveHistory === 'true';

    if (!city || !city.trim()) {
      return sendError(res, 'City name is required.', 400);
    }

    const weatherData = await weatherService.getWeatherByCity(city.trim());

    // Record in search history ONLY on explicit user searches (not on automatic page refresh)
    if (isSearch && req.user && weatherData && weatherData.city) {
      try {
        await SearchHistoryModel.recordSearch({
          userId: req.user._id || req.user.id,
          city: weatherData.city,
          country: weatherData.country || '',
        });
      } catch (logErr) {
        // Silently continue if history write fails
      }
    }

    return sendSuccess(res, weatherData);
  } catch (error) {
    return sendError(res, error.message || 'City not found or weather service unavailable.', 404);
  }
};

// @desc    Get current weather by coordinates
// @route   GET /api/weather/coordinates?lat=26.9&lon=75.8
// @access  Public
const getWeatherByCoords = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.coordinates;
    const weatherData = await weatherService.getWeatherByCoordinates(latitude, longitude);
    return sendSuccess(res, weatherData);
  } catch (error) {
    return sendError(res, error.message || 'Unable to retrieve weather for provided coordinates.', 500);
  }
};

// @desc    Search matching cities
// @route   GET /api/weather/cities/search?q=Mumbai
// @access  Public
const searchCities = async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) {
      return sendSuccess(res, []);
    }
    const locations = await geocodingService.searchLocations(query.trim());
    return sendSuccess(res, locations);
  } catch (error) {
    return sendError(res, error.message || 'Failed to search cities.', 500);
  }
};

module.exports = {
  getWeather,
  getWeatherByCoords,
  searchCities,
};
