/**
 * WeatherSphere - Auth Middleware (authMiddleware.js)
 * Protects private endpoints using JSON Web Tokens (JWT).
 */

const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'weathersphere_super_secret_jwt_key_2026_secure'
      );

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please sign in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    });
  }
};

// Optional auth to attach user if logged in, but not block if anonymous
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'weathersphere_super_secret_jwt_key_2026_secure'
      );
      const user = await UserModel.findById(decoded.id);
      if (user) req.user = user;
    } catch (e) {
      // Ignore token errors for optional auth
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
