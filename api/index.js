/**
 * WeatherSphere - Vercel Serverless Function Entry Point (api/index.js)
 * Exports the Express application to be executed as a Vercel Serverless Function.
 */

const app = require('../backend/server');

module.exports = app;
