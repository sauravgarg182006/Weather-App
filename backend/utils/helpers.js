/**
 * WeatherSphere - Backend Helpers (helpers.js)
 * Token generation, meteorological normalizers, and response formatters.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'weathersphere_super_secret_jwt_key_2026_secure';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

const sendSuccess = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

const sendError = (res, message, status = 400) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

// Maps WMO standard weather code (0-99) to OpenWeather icon and condition text
const mapWmoToWeather = (code, isDay = 1) => {
  const d = isDay ? 'd' : 'n';
  const table = {
    0: { condition: 'Clear', description: 'Clear sky', icon: `01${d}` },
    1: { condition: 'Mainly Clear', description: 'Mainly clear skies', icon: `02${d}` },
    2: { condition: 'Partly Cloudy', description: 'Partly cloudy', icon: `03${d}` },
    3: { condition: 'Overcast', description: 'Overcast clouds', icon: `04${d}` },
    45: { condition: 'Fog', description: 'Dense fog', icon: `50${d}` },
    48: { condition: 'Freezing Fog', description: 'Depositing rime fog', icon: `50${d}` },
    51: { condition: 'Light Drizzle', description: 'Light drizzle', icon: `09${d}` },
    53: { condition: 'Moderate Drizzle', description: 'Moderate drizzle', icon: `09${d}` },
    55: { condition: 'Heavy Drizzle', description: 'Dense intensity drizzle', icon: `09${d}` },
    61: { condition: 'Light Rain', description: 'Slight rain showers', icon: `10${d}` },
    63: { condition: 'Rain', description: 'Moderate rain', icon: `10${d}` },
    65: { condition: 'Heavy Rain', description: 'Heavy intensity rain', icon: `10${d}` },
    71: { condition: 'Light Snow', description: 'Slight snow fall', icon: `13${d}` },
    73: { condition: 'Snow', description: 'Moderate snow fall', icon: `13${d}` },
    75: { condition: 'Heavy Snow', description: 'Heavy intensity snow', icon: `13${d}` },
    80: { condition: 'Rain Showers', description: 'Slight rain showers', icon: `09${d}` },
    81: { condition: 'Heavy Showers', description: 'Moderate rain showers', icon: `09${d}` },
    82: { condition: 'Violent Showers', description: 'Violent rain showers', icon: `09${d}` },
    95: { condition: 'Thunderstorm', description: 'Thunderstorm with slight rain', icon: `11${d}` },
    96: { condition: 'Thunderstorm Hail', description: 'Thunderstorm with slight hail', icon: `11${d}` },
    99: { condition: 'Heavy Thunderstorm', description: 'Thunderstorm with heavy hail', icon: `11${d}` },
  };

  return table[code] || { condition: 'Cloudy', description: 'Scattered clouds', icon: `03${d}` };
};

module.exports = {
  generateToken,
  sendSuccess,
  sendError,
  mapWmoToWeather,
};
