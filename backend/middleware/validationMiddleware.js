/**
 * WeatherSphere - Validation Middleware (validationMiddleware.js)
 * Clean input validation and sanitization for request payloads.
 */

const validateCoordinates = (req, res, next) => {
  const { lat, lon } = req.query;

  if (lat === undefined || lon === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Both latitude (lat) and longitude (lon) query parameters are required.',
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      message: 'Invalid latitude value. Latitude must be a number between -90 and 90.',
    });
  }

  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: 'Invalid longitude value. Longitude must be a number between -180 and 180.',
    });
  }

  req.coordinates = { latitude, longitude };
  next();
};

const validateCity = (req, res, next) => {
  const city = req.query.city || req.body.city;

  if (!city || typeof city !== 'string' || !city.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid city name.',
    });
  }

  req.cityName = city.trim();
  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password' });
  }

  next();
};

module.exports = {
  validateCoordinates,
  validateCity,
  validateRegister,
  validateLogin,
};
