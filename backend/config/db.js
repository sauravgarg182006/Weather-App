/**
 * WeatherSphere - Database Configuration (db.js)
 * Connects to MongoDB via Mongoose with high resilience and fallback.
 */

const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weathersphere';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000, // Quick failover if local daemon isn't running
    });

    isMongoConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB at ${mongoURI} (${error.message}).`);
    console.warn(`[MongoDB] Operating in resilient file-backed persistence mode for User, Favorite, and SearchHistory.`);
    return null;
  }
};

const getDBStatus = () => ({
  connected: isMongoConnected,
  readyState: mongoose.connection.readyState,
  host: isMongoConnected ? mongoose.connection.host : 'Resilient File Store',
});

module.exports = { connectDB, getDBStatus };
