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
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);

// Resilient File-Store Fallback Handler
const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readUsers() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// Transparent Proxy Layer
const UserModel = {
  schema: userSchema,

  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseUser.findOne(query);
    }
    const users = readUsers();
    const user = users.find(u => {
      if (query.email && u.email.toLowerCase() === query.email.toLowerCase()) return true;
      if (query._id && u._id === query._id) return true;
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
      return await MongooseUser.findById(id).select('-password');
    }
    const users = readUsers();
    const user = users.find(u => u._id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async create({ name, email, password }) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseUser.create({ name, email, password });
    }
    const users = readUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error('User already exists');
      err.code = 11000;
      throw err;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      _id: 'usr_' + Date.now() + Math.random().toString(36).substr(2, 6),
      name,
      email: email.toLowerCase(),
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
