/**
 * WeatherSphere - Auth Controller (authController.js)
 * User registration, authentication, and session identity.
 */

const UserModel = require('../models/User');
const { generateToken, sendSuccess, sendError } = require('../utils/helpers');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return sendError(res, 'Please provide name, email, and password.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const userExists = await UserModel.findOne({ email: cleanEmail });
    if (userExists) {
      return sendError(res, 'An account with this email already exists.', 400);
    }

    const user = await UserModel.create({
      name: cleanName,
      email: cleanEmail,
      password,
    });

    const token = generateToken(user._id || user.id);
    const userPayload = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
    };

    return res.status(201).json({
      success: true,
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return sendError(res, 'Please provide both email and password.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = generateToken(user._id || user.id);
    const userPayload = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
    };

    return res.status(200).json({
      success: true,
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
