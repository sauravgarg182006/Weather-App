/**
 * WeatherSphere - Weather Routes (weatherRoutes.js)
 */

const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { validateCoordinates, validateCity } = require('../middleware/validationMiddleware');

router.get('/', optionalAuth, validateCity, weatherController.getWeather);
router.get('/coordinates', validateCoordinates, weatherController.getWeatherByCoords);
router.get('/cities/search', weatherController.searchCities);

module.exports = router;
