/**
 * WeatherSphere - History Controller (historyController.js)
 * Manages user search history retrieval, item deletion, and clear all.
 */

const SearchHistoryModel = require('../models/SearchHistory');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Get user search history (guaranteed unique cities)
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const history = await SearchHistoryModel.find({ userId: req.user._id || req.user.id });
    const seen = new Set();
    const uniqueHistory = [];
    for (const item of history) {
      const cityKey = (item.city || '').trim().toLowerCase();
      if (!seen.has(cityKey)) {
        seen.add(cityKey);
        uniqueHistory.push(item);
      }
    }
    return sendSuccess(res, uniqueHistory);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single history item
// @route   DELETE /api/history/:id
// @access  Private
const deleteHistoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const item = await SearchHistoryModel.findByIdAndDelete(id, userId);
    if (!item) {
      return sendError(res, 'History item not found or unauthorized to delete.', 404);
    }

    return sendSuccess(res, { message: 'History entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all user search history
// @route   DELETE /api/history
// @access  Private
const clearHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    await SearchHistoryModel.deleteMany({ userId });
    return sendSuccess(res, { message: 'Search history cleared successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,
  deleteHistoryItem,
  clearHistory,
};
