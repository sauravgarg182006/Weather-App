/**
 * WeatherSphere - SearchHistory Model (SearchHistory.js)
 * Records authenticated user search history with timestamps, clean deletion,
 * and guaranteed de-duplication so each searched city appears only once.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
    default: '',
  },
  searchedAt: {
    type: Date,
    default: Date.now,
  },
});

searchHistorySchema.index({ userId: 1, searchedAt: -1 });

const MongooseSearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

// Resilient Storage Fallback Handler (Compatible with Vercel & Local)
const { readData, writeData } = require('../utils/storageHelper');

function readHistory() {
  return readData('history.json');
}

function writeHistory(items) {
  writeData('history.json', items);
}

// Deduplicate list helper
function deduplicateList(items) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = (item.city || '').trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }
  return deduped;
}

const SearchHistoryModel = {
  schema: searchHistorySchema,
  MongooseSearchHistory,

  async find(query) {
    let items = [];
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
      items = await MongooseSearchHistory.find(q).sort({ searchedAt: -1 }).limit(50);
    } else {
      const all = readHistory();
      items = all
        .filter(h => h.userId === String(query.userId))
        .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt));
    }

    // Always return unique cities (most recent searchedAt timestamp preserved)
    return deduplicateList(items).slice(0, 30);
  },

  async recordSearch(data) {
    const userId = String(data.userId);
    const city = (data.city || '').trim();
    const country = (data.country || '').trim();

    if (!city) return null;

    if (mongoose.connection.readyState === 1) {
      const userCondition = [
        { userId: data.userId },
        { userId },
      ];
      if (mongoose.Types.ObjectId.isValid(data.userId)) {
        userCondition.push({ userId: new mongoose.Types.ObjectId(data.userId) });
      }

      // Find and remove/update any existing entry for this city to prevent duplicates
      const existing = await MongooseSearchHistory.findOne({
        $or: userCondition,
        city: { $regex: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });

      if (existing) {
        existing.city = city;
        if (country) existing.country = country;
        existing.searchedAt = new Date();
        return await existing.save();
      }

      return await MongooseSearchHistory.create({
        userId: data.userId,
        city,
        country,
        searchedAt: new Date(),
      });
    }

    // File-store persistence
    let all = readHistory();

    // Remove any existing entry for this user & city (case-insensitive)
    all = all.filter(
      h => !(h.userId === userId && (h.city || '').trim().toLowerCase() === city.toLowerCase())
    );

    const newEntry = {
      _id: 'hist_' + Date.now() + Math.random().toString(36).substr(2, 6),
      userId,
      city,
      country,
      searchedAt: new Date().toISOString(),
    };

    all.unshift(newEntry);
    writeHistory(all.slice(0, 200));
    return newEntry;
  },

  // Backward compatible create alias that routes to recordSearch
  async create(data) {
    return await this.recordSearch(data);
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
        const res = await MongooseSearchHistory.findOneAndDelete(query);
        if (res) return res;
      }

      // 2. Also try finding and deleting by city name
      if (typeof id === 'string' && id.trim()) {
        const escaped = id.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const query = { city: { $regex: new RegExp(`^${escaped}$`, 'i') } };
        if (userCondition.length) query.$or = userCondition;
        const res = await MongooseSearchHistory.findOneAndDelete(query);
        if (res) return res;
      }

      return null;
    }
    let all = readHistory();
    const item = all.find(h => (h._id === id || h.id === id || h.city.toLowerCase() === String(id).toLowerCase().trim()) && (!userId || h.userId === String(userId)));
    if (!item) return null;
    all = all.filter(h => h._id !== item._id && h.id !== item.id);
    writeHistory(all);
    return item;
  },

  async deleteMany(query) {
    if (mongoose.connection.readyState === 1) {
      const q = {};
      if (query.userId) {
        const userCondition = [
          { userId: query.userId },
          { userId: String(query.userId) },
        ];
        if (mongoose.Types.ObjectId.isValid(query.userId)) {
          userCondition.push({ userId: new mongoose.Types.ObjectId(query.userId) });
        }
        q.$or = userCondition;
      }
      return await MongooseSearchHistory.deleteMany(q);
    }
    let all = readHistory();
    all = all.filter(h => h.userId !== String(query.userId));
    writeHistory(all);
    return { deletedCount: 1 };
  }
};

module.exports = SearchHistoryModel;
