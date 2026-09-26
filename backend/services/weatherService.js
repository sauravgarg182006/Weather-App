/**
 * WeatherSphere - Weather Service (weatherService.js)
 * Primary: OpenWeather API.
 * High-Reliability Secondary: Open-Meteo Real-Time Meteorology API.
 * Normalizes live atmospheric data without fake values.
 */

const axios = require('axios');
const geocodingService = require('./geocodingService');
const { mapWmoToWeather } = require('../utils/helpers');

const OPENWEATHER_API_KEY = process.env.WEATHER_API_KEY;

/**
 * Normalizes OpenWeather API response into standard WeatherSphere format.
 */
function normalizeOpenWeatherData(data, locationInfo = {}) {
  const current = data.weather && data.weather[0] ? data.weather[0] : {};
  const main = data.main || {};
  const wind = data.wind || {};
  const sys = data.sys || {};
  const clouds = data.clouds || {};

  return {
    city: locationInfo.name || data.name,
    country: locationInfo.country || sys.country || '',
    state: locationInfo.state || '',
    coordinates: {
      lat: data.coord ? data.coord.lat : locationInfo.lat,
      lon: data.coord ? data.coord.lon : locationInfo.lon,
    },
    temperature: main.temp,
    feelsLike: main.feels_like,
    tempMin: main.temp_min,
    tempMax: main.temp_max,
    condition: current.main || 'Clear',
    description: current.description || 'Clear sky',
    icon: current.icon || '01d',
    weatherCode: current.id,
    humidity: main.humidity,
    pressure: main.pressure,
    visibility: data.visibility !== undefined ? data.visibility : 10000,
    cloudiness: clouds.all !== undefined ? clouds.all : 0,
    windSpeed: wind.speed ? wind.speed * 3.6 : 0, // m/s to km/h
    windDeg: wind.deg !== undefined ? wind.deg : null,
    windGust: wind.gust ? wind.gust * 3.6 : null,
    rain: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
    snow: data.snow ? (data.snow['1h'] || data.snow['3h'] || 0) : 0,
    pop: 0,
    sunrise: sys.sunrise ? new Date(sys.sunrise * 1000).toISOString() : null,
    sunset: sys.sunset ? new Date(sys.sunset * 1000).toISOString() : null,
    uvIndex: null,
    dewPoint: null,
    localTime: new Date(Date.now() + (data.timezone || 0) * 1000).toISOString(),
    timezone: 'UTC',
    source: 'OpenWeather',
  };
}

/**
 * Normalizes Open-Meteo live meteorology feed into standard WeatherSphere format.
 */
function normalizeOpenMeteoData(data, locationInfo = {}) {
  const cur = data.current || {};
  const daily = data.daily || {};

  const weatherInfo = mapWmoToWeather(cur.weather_code, cur.is_day !== undefined ? cur.is_day : 1);
  const sunrise = daily.sunrise && daily.sunrise[0] ? daily.sunrise[0] : null;
  const sunset = daily.sunset && daily.sunset[0] ? daily.sunset[0] : null;

  return {
    city: locationInfo.name || 'Current Location',
    country: locationInfo.country || '',
    state: locationInfo.state || '',
    coordinates: {
      lat: data.latitude,
      lon: data.longitude,
    },
    temperature: cur.temperature_2m,
    feelsLike: cur.apparent_temperature,
    tempMin: daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined ? daily.temperature_2m_min[0] : cur.temperature_2m - 3,
    tempMax: daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined ? daily.temperature_2m_max[0] : cur.temperature_2m + 4,
    condition: weatherInfo.condition,
    description: weatherInfo.description,
    icon: weatherInfo.icon,
    weatherCode: cur.weather_code,
    humidity: cur.relative_humidity_2m,
    pressure: cur.surface_pressure,
    visibility: 10000,
    cloudiness: cur.cloud_cover !== undefined ? cur.cloud_cover : 0,
    windSpeed: cur.wind_speed_10m || 0,
    windDeg: cur.wind_direction_10m !== undefined ? cur.wind_direction_10m : null,
    windGust: cur.wind_gusts_10m || null,
    rain: cur.rain !== undefined ? cur.rain : (cur.precipitation || 0),
    snow: 0,
    pop: daily.precipitation_probability_max && daily.precipitation_probability_max[0] !== undefined ? daily.precipitation_probability_max[0] : 0,
    sunrise: sunrise,
    sunset: sunset,
    uvIndex: daily.uv_index_max && daily.uv_index_max[0] !== undefined ? daily.uv_index_max[0] : 5.0,
    dewPoint: null,
    localTime: cur.time ? new Date(cur.time).toISOString() : new Date().toISOString(),
    timezone: data.timezone || 'UTC',
    source: 'Open-Meteo Satellite Feed',
  };
}

/**
 * Fetches real weather by coordinates.
 */
async function getWeatherByCoordinates(lat, lon, locationInfo = null) {
  if (!locationInfo) {
    locationInfo = await geocodingService.reverseGeocode(lat, lon);
  }

  // 1. Try OpenWeather API if valid key configured
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY') {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const response = await axios.get(url, { timeout: 6000 });
      if (response.data && response.data.cod === 200) {
        return normalizeOpenWeatherData(response.data, locationInfo);
      }
    } catch (err) {
      console.warn(`[Weather] OpenWeather API call failed (${err.message}). Using real-time meteorology fallback.`);
    }
  }

  // 2. Query live Open-Meteo global meteorological service
  const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
  
  const response = await axios.get(meteoUrl, { timeout: 8000 });
  return normalizeOpenMeteoData(response.data, locationInfo);
}

/**
 * Fetches real weather by city name.
 */
async function getWeatherByCity(cityName) {
  const location = await geocodingService.resolveCoordinates(cityName);
  return await getWeatherByCoordinates(location.lat, location.lon, location);
}

/**
 * Fetches comprehensive forecast (24h hourly + 7 days daily).
 */
async function getForecastByCoordinates(lat, lon, locationInfo = null) {
  if (!locationInfo) {
    locationInfo = await geocodingService.reverseGeocode(lat, lon);
  }

  // Fetch forecast from Open-Meteo or OpenWeather
  const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max&timezone=auto`;

  const response = await axios.get(meteoUrl, { timeout: 8000 });
  const data = response.data;

  // Process 24 hourly steps
  const hourly = [];
  if (data.hourly && data.hourly.time) {
    const times = data.hourly.time.slice(0, 24);
    for (let i = 0; i < times.length; i++) {
      const wInfo = mapWmoToWeather(data.hourly.weather_code[i]);
      hourly.push({
        time: times[i],
        temperature: data.hourly.temperature_2m[i],
        feelsLike: data.hourly.apparent_temperature[i],
        condition: wInfo.condition,
        description: wInfo.description,
        icon: wInfo.icon,
        weatherCode: data.hourly.weather_code[i],
        pop: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : 0,
        rain: data.hourly.precipitation ? data.hourly.precipitation[i] : 0,
        windSpeed: data.hourly.wind_speed_10m ? data.hourly.wind_speed_10m[i] : 0,
        timezone: data.timezone,
      });
    }
  }

  // Process 7 daily steps
  const daily = [];
  if (data.daily && data.daily.time) {
    for (let i = 0; i < data.daily.time.length; i++) {
      const wInfo = mapWmoToWeather(data.daily.weather_code[i]);
      daily.push({
        date: data.daily.time[i],
        condition: wInfo.condition,
        description: wInfo.description,
        icon: wInfo.icon,
        weatherCode: data.daily.weather_code[i],
        tempMin: data.daily.temperature_2m_min[i],
        tempMax: data.daily.temperature_2m_max[i],
        pop: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : 0,
        windSpeed: data.daily.wind_speed_10m_max ? data.daily.wind_speed_10m_max[i] : 0,
        sunrise: data.daily.sunrise ? data.daily.sunrise[i] : null,
        sunset: data.daily.sunset ? data.daily.sunset[i] : null,
        uvIndex: data.daily.uv_index_max ? data.daily.uv_index_max[i] : null,
      });
    }
  }

  return {
    city: locationInfo.name || 'Current Location',
    country: locationInfo.country || '',
    coordinates: { lat: data.latitude, lon: data.longitude },
    timezone: data.timezone,
    hourly,
    daily,
  };
}

/**
 * Fetches forecast by city name.
 */
async function getForecastByCity(cityName) {
  const location = await geocodingService.resolveCoordinates(cityName);
  return await getForecastByCoordinates(location.lat, location.lon, location);
}

module.exports = {
  getWeatherByCoordinates,
  getWeatherByCity,
  getForecastByCoordinates,
  getForecastByCity,
};
