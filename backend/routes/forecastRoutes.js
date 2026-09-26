/**
 * WeatherSphere - Forecast Routes (forecastRoutes.js)
 */

const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');
const { validateCoordinates, validateCity } = require('../middleware/validationMiddleware');

router.get('/', validateCity, forecastController.getForecast);
router.get('/coordinates', validateCoordinates, forecastController.getForecastByCoords);

module.exports = router;
