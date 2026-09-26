/**
 * WeatherSphere - Favorite Routes (favoriteRoutes.js)
 */

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(favoriteController.getFavorites)
  .post(favoriteController.addFavorite);

router.route('/:id')
  .delete(favoriteController.removeFavorite);

module.exports = router;
