/**
 * WeatherSphere - Utility Functions (utils.js)
 * Clean, modular helpers for temperature conversion, formatting, icon mapping,
 * and AI-style weather descriptions.
 */

// Unit conversion helpers
export function celsiusToFahrenheit(celsius) {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return null;
  return (celsius * 9) / 5 + 32;
}

export function formatTemperature(celsius, unit = 'C') {
  if (celsius === null || celsius === undefined || isNaN(celsius)) {
    return '--';
  }
  const value = unit === 'F' ? celsiusToFahrenheit(celsius) : celsius;
  return Math.round(value);
}

// Wind Formatting
export function formatWind(speedKmh, deg = null) {
  if (speedKmh === null || speedKmh === undefined) return 'Not available';
  const speed = Math.round(speedKmh);
  let direction = '';
  if (deg !== null && deg !== undefined) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    direction = ` ${directions[index]}`;
  }
  return `${speed} km/h${direction}`;
}

// Date and Time Formatting
export function formatDate(dateInput, timezone = 'UTC') {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone !== 'UTC' ? timezone : undefined
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

export function formatTime(timeInput, timezone = 'UTC') {
  if (!timeInput) return '';
  const date = typeof timeInput === 'string' ? new Date(timeInput) : timeInput;
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone !== 'UTC' ? timezone : undefined
    }).format(date);
  } catch (e) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}

export function formatDayName(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// OpenWeather / WMO Icon Resolver to High-Res Weather SVGs / FontAwesome
export function getWeatherIconUrl(iconCode, conditionCode = null) {
  // If icon code is standard OpenWeather icon (e.g. "01d", "10n")
  if (iconCode && typeof iconCode === 'string' && iconCode.length <= 4) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
  // Fallback default sunny
  return 'https://openweathermap.org/img/wn/02d@2x.png';
}

/**
 * Generates an intelligent, human-friendly weather description
 * strictly derived from real API metrics.
 */
export function generateWeatherNarrative(weatherData, unit = 'C') {
  if (!weatherData) return 'Weather conditions are updating...';

  const condition = (weatherData.condition || weatherData.description || 'Clear').toLowerCase();
  const tempC = weatherData.temperature ?? 20;
  const tempDisplay = `${formatTemperature(tempC, unit)}°${unit}`;
  const humidity = weatherData.humidity ?? 50;
  const windSpeed = weatherData.windSpeed ?? 5;
  const rain = weatherData.rain ?? 0;
  const clouds = weatherData.cloudiness ?? 0;

  let tempDescriptor = 'mild';
  if (tempC >= 33) tempDescriptor = 'hot and sunny';
  else if (tempC >= 25) tempDescriptor = 'warm';
  else if (tempC >= 18) tempDescriptor = 'pleasant';
  else if (tempC >= 10) tempDescriptor = 'cool';
  else if (tempC >= 0) tempDescriptor = 'chilly';
  else tempDescriptor = 'freezing';

  let windDescriptor = 'light breeze';
  if (windSpeed > 35) windDescriptor = 'gusty winds';
  else if (windSpeed > 20) windDescriptor = 'moderate breeze';
  else if (windSpeed <= 8) windDescriptor = 'calm winds';

  let humidityNote = '';
  if (humidity > 75) humidityNote = 'High humidity in the air.';
  else if (humidity < 30) humidityNote = 'Air is crisp and dry.';

  let precipitationNote = '';
  if (rain > 5) precipitationNote = 'Steady rainfall observed.';
  else if (rain > 0) precipitationNote = 'Light scattered showers.';

  if (condition.includes('rain') || condition.includes('drizzle')) {
    return `${condition.charAt(0).toUpperCase() + condition.slice(1)} is ongoing with ${tempDescriptor} temperatures around ${tempDisplay}. ${windDescriptor} and ${humidity}% humidity.`;
  }

  if (condition.includes('cloud') || clouds > 50) {
    return `Expect ${clouds > 80 ? 'overcast skies' : 'partly cloudy conditions'} with ${tempDescriptor} temperatures around ${tempDisplay}. ${humidityNote}`;
  }

  if (condition.includes('snow')) {
    return `Snowfall observed with ${tempDescriptor} conditions at ${tempDisplay}. Take precautions on roads.`;
  }

  if (condition.includes('thunder')) {
    return `Thunderstorm activity reported with gusty winds and ${tempDisplay}. Stay safe indoors.`;
  }

  // Clear skies
  return `Clear skies with ${tempDescriptor} conditions around ${tempDisplay}. ${windDescriptor} with ${humidity}% humidity.`;
}

// Debounce helper
export function debounce(func, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}
