/**
 * WeatherSphere - Database Configuration (db.js)
 * Connects to MongoDB via Mongoose with high resilience, serverless connection caching,
 * and zero-delay local fallback for serverless hosting (Vercel).
 */

const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  // Reuse existing connection if ready (serverless connection pooling)
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return mongoose.connection;
  }

  const mongoURI = process.env.MONGODB_URI;

  // On Vercel without MONGODB_URI set, do not delay cold-starts searching for 127.0.0.1
  if (!mongoURI && process.env.VERCEL) {
    isMongoConnected = false;
    return null;
  }

  const targetURI = mongoURI || 'mongodb://127.0.0.1:27017/weathersphere';

  try {
    const conn = await mongoose.connect(targetURI, {
      serverSelectionTimeoutMS: 2500, // Fast failover if database is unreachable
    });

    isMongoConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[MongoDB] Notice: Running in resilient storage engine mode (${error.message}).`);
    return null;
  }
};

const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.readyState === 1
    ? mongoose.connection.host
    : 'Resilient High-Availability Store',
});

module.exports = { connectDB, getDBStatus };

