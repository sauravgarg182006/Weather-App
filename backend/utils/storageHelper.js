/**
 * WeatherSphere - Resilient Storage Helper (storageHelper.js)
 * Provides unified, crash-proof file & memory storage.
 * Seamlessly adapts between local environment and serverless platforms (Vercel / AWS Lambda).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Detect serverless environment
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// On Vercel / Lambda, deployment folder is strictly read-only.
// Use os.tmpdir() which is guaranteed writable.
const BASE_DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'weathersphere_data')
  : path.join(__dirname, '..', 'data');

const memoryCache = new Map();

function ensureDataFile(filename) {
  try {
    if (!fs.existsSync(BASE_DATA_DIR)) {
      fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
    }
    const targetFile = path.join(BASE_DATA_DIR, filename);
    if (!fs.existsSync(targetFile)) {
      // Check if bundled seed data exists in repository
      const seedFile = path.join(__dirname, '..', 'data', filename);
      if (fs.existsSync(seedFile)) {
        try {
          const content = fs.readFileSync(seedFile, 'utf-8');
          fs.writeFileSync(targetFile, content);
          return;
        } catch (copyErr) {
          // Fall through to empty file creation
        }
      }
      fs.writeFileSync(targetFile, JSON.stringify([]));
    }
  } catch (err) {
    // If filesystem write fails, fallback to memoryCache
  }
}

function readData(filename) {
  ensureDataFile(filename);
  const targetFile = path.join(BASE_DATA_DIR, filename);

  try {
    if (fs.existsSync(targetFile)) {
      const parsed = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
      memoryCache.set(filename, parsed);
      return parsed;
    }
  } catch (err) {
    // Read error fallback
  }

  if (memoryCache.has(filename)) {
    return memoryCache.get(filename);
  }

  // Fallback to bundled seed file if target wasn't readable
  const seedFile = path.join(__dirname, '..', 'data', filename);
  try {
    if (fs.existsSync(seedFile)) {
      const parsed = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
      memoryCache.set(filename, parsed);
      return parsed;
    }
  } catch (e) {}

  return [];
}

function writeData(filename, data) {
  // Always update in-memory cache first
  memoryCache.set(filename, data);

  ensureDataFile(filename);
  const targetFile = path.join(BASE_DATA_DIR, filename);
  try {
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2));
  } catch (err) {
    // Silently preserved in memoryCache
  }
}

module.exports = {
  readData,
  writeData,
  BASE_DATA_DIR,
};
