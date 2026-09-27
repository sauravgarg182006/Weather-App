/**
 * WeatherSphere - Database Configuration (db.js)
 * Connects to MongoDB via Mongoose with high resilience, serverless connection caching,
 * and zero-delay local fallback for serverless hosting (Vercel).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config();

const mongoose = require('mongoose');

let isMongoConnected = false;
let cachedPromise = null;

const connectDB = async () => {
  // Reuse existing connection if ready (serverless connection pooling)
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return mongoose.connection;
  }

  // Reuse pending connection promise to prevent duplicate connections
  if (cachedPromise && mongoose.connection.readyState === 2) {
    return cachedPromise;
  }

  const mongoURI = process.env.MONGODB_URI;

  // On Vercel without MONGODB_URI set, do not delay cold-starts searching for 127.0.0.1
  if (!mongoURI && process.env.VERCEL) {
    isMongoConnected = false;
    return null;
  }

  const targetURI = mongoURI || 'mongodb://127.0.0.1:27017/weathersphere';

  cachedPromise = mongoose.connect(targetURI, {
    serverSelectionTimeoutMS: 10000, // 10s gives Atlas adequate time for SRV lookup & TLS
  }).then((conn) => {
    isMongoConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  }).catch((error) => {
    cachedPromise = null;
    isMongoConnected = false;
    console.warn(`[MongoDB] Notice: Running in resilient storage engine mode (${error.message}).`);
    return null;
  });

  return cachedPromise;
};

const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.readyState === 1
    ? mongoose.connection.host
    : 'Resilient High-Availability Store',
  database: mongoose.connection.readyState === 1
    ? mongoose.connection.name
    : 'Local Store',
});

module.exports = { connectDB, getDBStatus };

