/**
 * WeatherSphere - History Routes (historyRoutes.js)
 */

const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(historyController.getHistory)
  .delete(historyController.clearHistory);

router.route('/:id')
  .delete(historyController.deleteHistoryItem);

module.exports = router;
