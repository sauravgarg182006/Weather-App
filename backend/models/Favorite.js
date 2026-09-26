/**
 * WeatherSphere - Favorite Model (Favorite.js)
 * Mongoose Schema for user favorite locations with duplicate prevention.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    city: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

favoriteSchema.index({ userId: 1, city: 1 }, { unique: true });

const MongooseFavorite = mongoose.model('Favorite', favoriteSchema);

// Resilient Storage Fallback Handler (Compatible with Vercel & Local)
const { readData, writeData } = require('../utils/storageHelper');

function readFavorites() {
  return readData('favorites.json');
}

function writeFavorites(items) {
  writeData('favorites.json', items);
}

const FavoriteModel = {
  schema: favoriteSchema,

  async find(query) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseFavorite.find(query).sort({ createdAt: -1 });
    }
    const all = readFavorites();
    return all.filter(f => f.userId === String(query.userId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseFavorite.findOne(query);
    }
    const all = readFavorites();
    return all.find(f => 
      f.userId === String(query.userId) && 
      f.city.toLowerCase() === (query.city || '').toLowerCase()
    ) || null;
  },

  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseFavorite.create(data);
    }
    const all = readFavorites();
    const isDuplicate = all.some(f => 
      f.userId === String(data.userId) && 
      f.city.toLowerCase() === data.city.toLowerCase()
    );
    if (isDuplicate) {
      const err = new Error('City is already in your favorites');
      err.code = 11000;
      throw err;
    }
    const newFav = {
      _id: 'fav_' + Date.now() + Math.random().toString(36).substr(2, 6),
      userId: String(data.userId),
      city: data.city,
      country: data.country || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      createdAt: new Date().toISOString(),
    };
    all.push(newFav);
    writeFavorites(all);
    return newFav;
  },

  async findByIdAndDelete(id, userId) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseFavorite.findOneAndDelete({ _id: id, userId });
    }
    let all = readFavorites();
    const item = all.find(f => (f._id === id || f.id === id) && (!userId || f.userId === String(userId)));
    if (!item) return null;
    all = all.filter(f => f._id !== id && f.id !== id);
    writeFavorites(all);
    return item;
  }
};

module.exports = FavoriteModel;
