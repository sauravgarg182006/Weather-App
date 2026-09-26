/**
 * WeatherSphere - Main Server Entry Point
 * Express REST API
 * Vercel-compatible backend
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

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

// Connect to Database
connectDB();

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

app.get('/api/health', (req, res) => {
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
});

// =====================================================
// API ROUTES
// =====================================================

app.use('/api/weather', weatherRoutes);

app.use('/api/forecast', forecastRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/favorites', favoriteRoutes);

app.use('/api/history', historyRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

app.use(notFound);

app.use(errorHandler);

// =====================================================
// VERCEL EXPORT
// =====================================================

// IMPORTANT:
// Do not use app.listen() here when deploying to Vercel.
// Vercel will handle the server automatically.

module.exports = app;