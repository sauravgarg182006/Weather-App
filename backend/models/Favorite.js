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
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
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

favoriteSchema.index({ userId: 1, city: 1 });

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
  MongooseFavorite,

  async find(query) {
    if (mongoose.connection.readyState === 1) {
      const q = {};
      if (query.userId) {
        const orConditions = [
          { userId: query.userId },
          { userId: String(query.userId) },
        ];
        if (mongoose.Types.ObjectId.isValid(query.userId)) {
          orConditions.push({ userId: new mongoose.Types.ObjectId(query.userId) });
        }
        q.$or = orConditions;
      }
      return await MongooseFavorite.find(q).sort({ createdAt: -1 });
    }
    const all = readFavorites();
    return all.filter(f => f.userId === String(query.userId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      const q = {};
      if (query.userId) {
        const orConditions = [
          { userId: query.userId },
          { userId: String(query.userId) },
        ];
        if (mongoose.Types.ObjectId.isValid(query.userId)) {
          orConditions.push({ userId: new mongoose.Types.ObjectId(query.userId) });
        }
        q.$or = orConditions;
      }
      if (query.city && typeof query.city === 'string') {
        const escaped = query.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        q.city = { $regex: new RegExp(`^${escaped}$`, 'i') };
      }
      return await MongooseFavorite.findOne(q);
    }
    const all = readFavorites();
    const city = (query.city || '').trim().toLowerCase();
    return all.find(f => 
      f.userId === String(query.userId) && 
      f.city.toLowerCase() === city
    ) || null;
  },

  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseFavorite.create({
        userId: data.userId,
        city: data.city ? data.city.trim() : '',
        country: data.country ? data.country.trim() : '',
        latitude: data.latitude !== undefined ? data.latitude : null,
        longitude: data.longitude !== undefined ? data.longitude : null,
      });
    }
    const all = readFavorites();
    const city = (data.city || '').trim().toLowerCase();
    const isDuplicate = all.some(f => 
      f.userId === String(data.userId) && 
      f.city.toLowerCase() === city
    );
    if (isDuplicate) {
      const err = new Error('City is already in your favorites');
      err.code = 11000;
      throw err;
    }
    const newFav = {
      _id: 'fav_' + Date.now() + Math.random().toString(36).substr(2, 6),
      userId: String(data.userId),
      city: data.city.trim(),
      country: data.country ? data.country.trim() : '',
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
      const userCondition = [];
      if (userId) {
        userCondition.push({ userId });
        userCondition.push({ userId: String(userId) });
        if (mongoose.Types.ObjectId.isValid(userId)) {
          userCondition.push({ userId: new mongoose.Types.ObjectId(userId) });
        }
      }

      // 1. Try finding and deleting by ObjectId if valid
      if (mongoose.Types.ObjectId.isValid(id)) {
        const query = { _id: id };
        if (userCondition.length) query.$or = userCondition;
        const res = await MongooseFavorite.findOneAndDelete(query);
        if (res) return res;
      }

      // 2. Also try finding and deleting by city name
      if (typeof id === 'string' && id.trim()) {
        const escaped = id.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const query = { city: { $regex: new RegExp(`^${escaped}$`, 'i') } };
        if (userCondition.length) query.$or = userCondition;
        const res = await MongooseFavorite.findOneAndDelete(query);
        if (res) return res;
      }

      return null;
    }
    let all = readFavorites();
    const item = all.find(f => (f._id === id || f.id === id || f.city.toLowerCase() === String(id).toLowerCase().trim()) && (!userId || f.userId === String(userId)));
    if (!item) return null;
    all = all.filter(f => f._id !== item._id && f.id !== item.id);
    writeFavorites(all);
    return item;
  }
};

module.exports = FavoriteModel;
