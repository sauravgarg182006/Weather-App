/**
 * WeatherSphere - Main Server Entry Point
 * Express REST API
 * Vercel-compatible backend
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { connectDB, getDBStatus } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const weatherRoutes = require('./routes/weatherRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const authRoutes = require('./routes/authRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const historyRoutes = require('./routes/historyRoutes');

// Initialize Express App
const app = express();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().catch(() => { });

// =====================================================
// GLOBAL MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// SERVERLESS DB RECONNECT
// =====================================================

app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      console.error('Database reconnect failed:', e.message);
    }
  }

  next();
});

// =====================================================
// ROOT ENDPOINT
// =====================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🌦️ WeatherSphere API is running',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      weather: '/api/weather',
      forecast: '/api/forecast',
      auth: '/api/auth',
      favorites: '/api/favorites',
      history: '/api/history',
    },
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

const healthCheckHandler = (req, res) => {
  const dbStatus = getDBStatus();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      app: 'WeatherSphere API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,

      weatherProvider:
        process.env.WEATHER_API_KEY &&
          process.env.WEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY'
          ? 'OpenWeather API'
          : 'Open-Meteo',
    },
  });
};

app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WeatherSphere API is live and healthy.',
    version: '1.0.0',
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Weather
app.use('/api/weather', weatherRoutes);
app.use('/weather', weatherRoutes);

// Forecast
app.use('/api/forecast', forecastRoutes);
app.use('/forecast', forecastRoutes);

// Authentication
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Favorites
app.use('/api/favorites', favoriteRoutes);
app.use('/favorites', favoriteRoutes);

// Search History
app.use('/api/history', historyRoutes);
app.use('/history', historyRoutes);

// =====================================================
// FRONTEND STATIC FILES
// =====================================================

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// =====================================================
// ERROR HANDLING
// =====================================================

app.use(notFound);
app.use(errorHandler);

// =====================================================
// LOCAL SERVER
// =====================================================

// Vercel handles the server automatically.
// app.listen() is only used for local development.

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🌦️ WeatherSphere Backend Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(
      `   Client: ${process.env.CLIENT_URL || 'http://localhost:5500'}`
    );
    console.log('====================================================');
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[UnhandledRejection] ${err.message}`);
  });
}

// =====================================================
// VERCEL EXPORT
// =====================================================

module.exports = app;