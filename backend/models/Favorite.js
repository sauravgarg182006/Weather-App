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

const DATA_FILE = path.join(__dirname, '..', 'data', 'favorites.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readFavorites() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function writeFavorites(items) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
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
