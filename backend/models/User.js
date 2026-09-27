/**
 * WeatherSphere - User Model (User.js)
 * Mongoose Schema with password hashing and verification.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving in Mongoose
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  // Prevent double-hashing if password is already a valid bcrypt hash
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);

// Resilient Storage Fallback Handler (Compatible with Vercel & Local)
const { readData, writeData } = require('../utils/storageHelper');

function readUsers() {
  return readData('users.json');
}

function writeUsers(users) {
  writeData('users.json', users);
}

// Transparent Proxy Layer
const UserModel = {
  schema: userSchema,
  MongooseUser,

  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      const q = { ...query };
      if (q.email && typeof q.email === 'string') {
        q.email = q.email.toLowerCase().trim();
      }
      return await MongooseUser.findOne(q);
    }
    const users = readUsers();
    const cleanEmail = query.email ? query.email.toLowerCase().trim() : null;
    const user = users.find(u => {
      if (cleanEmail && u.email.toLowerCase() === cleanEmail) return true;
      if (query._id && (u._id === query._id || u.id === query._id)) return true;
      return false;
    });
    if (!user) return null;
    return {
      ...user,
      matchPassword: async (pwd) => await bcrypt.compare(pwd, user.password),
    };
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await MongooseUser.findById(id).select('-password');
    }
    const users = readUsers();
    const user = users.find(u => u._id === id || u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async create({ name, email, password }) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();

    if (mongoose.connection.readyState === 1) {
      return await MongooseUser.create({
        name: cleanName,
        email: cleanEmail,
        password,
      });
    }
    const users = readUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      const err = new Error('User already exists');
      err.code = 11000;
      throw err;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      _id: 'usr_' + Date.now() + Math.random().toString(36).substr(2, 6),
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);
    return {
      ...newUser,
      matchPassword: async (pwd) => await bcrypt.compare(pwd, hashedPassword),
    };
  }
};

module.exports = UserModel;
