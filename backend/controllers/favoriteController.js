/**
 * WeatherSphere - Favorite Controller (favoriteController.js)
 * Manages user saved cities.
 */

const FavoriteModel = require('../models/Favorite');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Get user's favorite cities
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await FavoriteModel.find({ userId: req.user._id || req.user.id });
    return sendSuccess(res, favorites);
  } catch (error) {
    next(error);
  }
};

// @desc    Add city to favorites
// @route   POST /api/favorites
// @access  Private
const addFavorite = async (req, res, next) => {
  try {
    const { city, country, latitude, longitude } = req.body;

    if (!city || !city.trim()) {
      return sendError(res, 'City name is required.', 400);
    }

    const userId = req.user._id || req.user.id;

    // Check duplicate
    const existing = await FavoriteModel.findOne({
      userId,
      city: city.trim(),
    });

    if (existing) {
      return sendError(res, `"${city}" is already in your favorites.`, 400);
    }

    const favorite = await FavoriteModel.create({
      userId,
      city: city.trim(),
      country: country ? country.trim() : '',
      latitude: latitude !== undefined ? latitude : null,
      longitude: longitude !== undefined ? longitude : null,
    });

    return sendSuccess(res, favorite, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove city from favorites
// @route   DELETE /api/favorites/:id
// @access  Private
const removeFavorite = async (req, res, next) => {
  try {
    const rawId = req.params.id || '';
    const id = decodeURIComponent(rawId).trim();

    if (!id) {
      return sendError(res, 'Favorite identifier or city name is required.', 400);
    }

    const userId = req.user._id || req.user.id;

    const favorite = await FavoriteModel.findByIdAndDelete(id, userId);

    if (!favorite) {
      return sendError(res, 'Favorite not found or unauthorized to remove.', 404);
    }

    return sendSuccess(res, { message: 'Favorite city removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
