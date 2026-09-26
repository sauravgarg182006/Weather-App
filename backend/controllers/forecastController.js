/**
 * WeatherSphere - Forecast Controller (forecastController.js)
 * Manages hourly and 7-day extended forecasts.
 */

const weatherService = require('../services/weatherService');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Get forecast by city name
// @route   GET /api/forecast?city=Jaipur
// @access  Public
const getForecast = async (req, res, next) => {
  try {
    const city = req.query.city;
    if (!city || !city.trim()) {
      return sendError(res, 'City name is required.', 400);
    }

    const forecastData = await weatherService.getForecastByCity(city.trim());
    return sendSuccess(res, forecastData);
  } catch (error) {
    return sendError(res, error.message || 'Forecast not found for this city.', 404);
  }
};

// @desc    Get forecast by coordinates
// @route   GET /api/forecast/coordinates?lat=26.9&lon=75.8
// @access  Public
const getForecastByCoords = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.coordinates;
    const forecastData = await weatherService.getForecastByCoordinates(latitude, longitude);
    return sendSuccess(res, forecastData);
  } catch (error) {
    return sendError(res, error.message || 'Unable to retrieve forecast for coordinates.', 500);
  }
};

module.exports = {
  getForecast,
  getForecastByCoords,
};
