# 🌦️ WeatherSphere

> **"Weather, wherever you are."**  
> Professional full-stack weather application engineered with pure Vanilla web standards, an Express.js REST API gateway, and live satellite meteorological telemetry.

---

## 📖 Overview

**WeatherSphere** is a high-performance, real-time meteorological intelligence platform designed to deliver hyper-local atmospheric forecasts, 24-hour hourly outlooks, 7-day extended forecasts, and global city exploration without frontend framework bloat.

It follows a **strictly decoupled client-server architecture**:
- **Frontend:** Pure HTML5, Modern CSS3 (CSS Variables, Flexbox, Grid, Glassmorphism), and modular ES6+ JavaScript.
- **Backend:** Node.js & Express.js REST API proxy layer that enforces complete security by concealing all secret API keys from the browser.
- **Database:** MongoDB & Mongoose schemas for User authentication (bcryptjs + JWT), favorite cities, and search history, supported by an offline file-backed persistence fallback.
- **Live Meteorology:** Dual-tier real weather provider integration (OpenWeather API with automatic fallback to live Open-Meteo satellite observations for zero fake data).

---

## ✨ Features

- 📍 **Browser Geolocation:** Instant 1-click current location weather detection with permission handling.
- 🔍 **Live Global City Search:** Fast search for any city, state, or country worldwide.
- 📊 **Comprehensive Atmospheric Dashboard:**
  - Temperature, "Feels Like", Daily Minimum & Maximum
  - Humidity, Dew Point, and Atmospheric Pressure (hPa)
  - Surface Wind Speed, Wind Direction (compass degrees), and Wind Gusts
  - Cloud Cover (%), Visibility (km), and Precipitation (mm / Probability %)
  - UV Index with real-time risk level indicators (Low to Extreme)
  - Sunrise and Sunset solar cycle tracking
- 🪄 **Dynamic Weather Narrative:** Human-friendly condition descriptions intelligently generated from real sensor readings.
- 🕒 **24-Hour Hourly Timeline:** Smooth scrollable forecast track displaying hourly temperature, rain probabilities, and conditions.
- 📅 **7-Day Extended Forecast:** Complete daily breakdown with temperature range bars and condition badges.
- 🌍 **Global City Explorer:** Previews featured metropolises with instant search.
- ⭐ **Personalized Favorites:** Save favorite cities, view live mini-weather cards, and manage saved locations.
- 📜 **Search History:** Automatically logs successful queries for authenticated users with one-click re-search and clearing.
- ☀️ / 🌙 **Dark & Light Mode:** System-wide glassmorphism and theme toggle with `localStorage` persistence.
- 🌡️ **°C / °F Unit Switcher:** Instant temperature conversion across all displayed cards without reloading.
- 🔒 **Secure Authentication:** Account registration, login, salted bcrypt hashing, and JSON Web Tokens.
- 📱 **100% Responsive Design:** Optimized for 320px, 375px, 425px, 768px, 1024px, and 1440px displays.

---

## 🏛️ System Architecture

```
Browser Client (HTML5 / Vanilla JavaScript / CSS3)
     │
     ▼ (REST Fetch Requests with Bearer JWT)
Express.js REST API Gateway (Port 5000)
     ├── Authentication Middleware (JWT Validation & bcryptjs)
     ├── Validation Middleware (Coordinates & Payload Sanitization)
     ├── Weather & Geocoding Services (API Key Enclosure)
     └── Data Access Layer (Mongoose / MongoDB Models)
     │
     ▼ (Encrypted HTTPS Outbound Requests)
External Weather Telemetry (OpenWeather API & Satellite Feeds)
```

---

## 📁 Folder Structure

```
WeatherSphere/
│
├── frontend/
│   ├── index.html                  # Home Dashboard
│   ├── pages/
│   │   ├── forecast.html           # 24h & 7-Day Extended Forecast
│   │   ├── cities.html             # Global City Explorer
│   │   ├── favorites.html          # Saved User Locations
│   │   ├── history.html            # Search History Management
│   │   ├── login.html              # User Sign In
│   │   ├── register.html           # Account Registration
│   │   └── about.html              # Architecture & API Documentation
│   ├── css/
│   │   ├── style.css               # Core Styles, Navbar, Layout & Footer
│   │   ├── responsive.css          # Responsive Breakpoints (320px - 1440px)
│   │   ├── components.css          # Cards, Metrics Grid, Skeletons, Toasts
│   │   └── themes.css              # Dark & Light Design Tokens
│   ├── js/
│   │   ├── app.js                  # Global Application Orchestrator
│   │   ├── api.js                  # Centralized REST API Client
│   │   ├── weather.js              # Home Dashboard Controller
│   │   ├── forecast.js             # Forecast Page Controller
│   │   ├── location.js             # Browser Geolocation Service
│   │   ├── favorites.js            # Favorites Manager
│   │   ├── history.js              # History Manager
│   │   ├── auth.js                 # Authentication State Manager
│   │   ├── theme.js                # Theme & Unit State Manager
│   │   ├── components.js           # Reusable Component Renderers
│   │   └── utils.js                # Formatting, Calculations & Narratives
│   └── assets/
│       ├── images/
│       └── icons/
│
├── backend/
│   ├── config/
│   │   └── db.js                   # Mongoose & Resilient DB Adapter
│   ├── controllers/
│   │   ├── weatherController.js    # Current Weather & City Search
│   │   ├── forecastController.js   # Hourly & Daily Projections
│   │   ├── authController.js       # Register, Login & Profile
│   │   ├── favoriteController.js   # Favorites CRUD
│   │   └── historyController.js    # Search History CRUD
│   ├── routes/
│   │   ├── weatherRoutes.js        # /api/weather
│   │   ├── forecastRoutes.js       # /api/forecast
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── favoriteRoutes.js       # /api/favorites
│   │   └── historyRoutes.js        # /api/history
│   ├── services/
│   │   ├── weatherService.js       # Weather Telemetry & Normalization
│   │   └── geocodingService.js     # Forward & Reverse Geocoding
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT Protection & Optional Auth
│   │   ├── errorMiddleware.js      # Global Error & 404 Handlers
│   │   └── validationMiddleware.js # Input Validation
│   ├── models/
│   │   ├── User.js                 # User Schema & Password Hashing
│   │   ├── Favorite.js             # Favorite Locations Schema
│   │   └── SearchHistory.js        # User Search Logs Schema
│   ├── utils/
│   │   └── helpers.js              # Tokens, Status Helpers & WMO Mapper
│   ├── server.js                   # Express Server Entry Point
│   ├── package.json                # Backend Dependencies
│   ├── .env.example                # Environment Template
│   └── .gitignore
│
├── frontend-server.js              # Static Dev Server (Port 5500)
├── package.json                    # Workspace Scripts
├── README.md                       # Documentation
└── .gitignore
```

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Variables, Flexbox, Grid), Vanilla JavaScript (ES6+), Fetch API |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Security** | bcryptjs (password hashing), jsonwebtoken (JWT), CORS, Input Sanitization |
| **Weather Telemetry** | OpenWeather API, Open-Meteo Satellite Feed, BigDataCloud Geocoding |

---

## 🚀 Running Locally

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* **MongoDB**: Local MongoDB instance or MongoDB Atlas connection string. (If MongoDB daemon is not running, the application automatically uses its built-in persistence fallback without errors).

### Step 1: Clone and Install Dependencies

```bash
git clone <repository-url>
cd WeatherSphere

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment Variables

Create `backend/.env` (or copy from `backend/.env.example`):

```ini
PORT=5000
CLIENT_URL=http://localhost:5500
WEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY
MONGODB_URI=mongodb://127.0.0.1:27017/weathersphere
JWT_SECRET=weathersphere_super_secret_jwt_key_2026_secure
NODE_ENV=development
```

> **Note:** If you do not have an OpenWeather API key yet, leave `WEATHER_API_KEY=` blank or unchanged. WeatherSphere will automatically use the real-time meteorological satellite stream with zero fake data!

### Step 3: Start the Backend Server

```bash
# From workspace root
node backend/server.js
```
The backend REST API will start on: **`http://localhost:5000`**

### Step 4: Start the Frontend Development Server

In a new terminal window:

```bash
# From workspace root
node frontend-server.js
```
The frontend application will be live at: **`http://localhost:5500`**

---

## 🚀 Deploying to Vercel

WeatherSphere is fully pre-configured for **1-click zero-config deployment on Vercel**! The project runs as a unified deployment with the frontend served at the edge and the Express API running on Vercel Serverless Functions.

### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Configure full-stack deployment for Vercel"
   git push origin main
   ```

2. **Import into Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **"Add New..." > "Project"**.
   - Select your **Weather-App** repository.
   - **Framework Preset:** Leave as *Other* (detected automatically via `vercel.json`).
   - **Root Directory:** `./` (leave default).
   - Click **"Deploy"**.

3. **(Optional) Configure Environment Variables in Vercel:**
   Go to your project dashboard on Vercel: **Settings > Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `MONGODB_URI` | `mongodb+srv://...` | *(Optional)* MongoDB Atlas connection string. If omitted, resilient storage engine is used automatically. |
   | `WEATHER_API_KEY` | `your_key` | *(Optional)* OpenWeather API key. If omitted, live satellite meteorological feed is used automatically. |
   | `JWT_SECRET` | `your_secret` | *(Optional)* Secret key for signing user auth tokens. |

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Deploy to preview
vercel

# Deploy directly to production
vercel --prod
```

### Architecture on Vercel:
- **`frontend/`** is served directly from Vercel's global Edge Network CDN via `outputDirectory: "frontend"`.
- **`api/index.js`** handles all `/api/*` traffic via Serverless Functions.
- Zero server timeouts: When `MONGODB_URI` is not set, the app instantly uses the resilient storage engine with no cold start delays.
- Writable persistence: Resilient storage automatically adapts to `/tmp` in serverless environments, preventing any read-only filesystem errors.

---

## 📡 REST API Documentation

### 1. System Health
- **`GET /api/health`**
  - **Access:** Public
  - **Response:**
    ```json
    {
      "success": true,
      "data": {
        "status": "healthy",
        "app": "WeatherSphere API",
        "version": "1.0.0",
        "uptime": 128.4,
        "database": { "connected": true, "host": "127.0.0.1" },
        "weatherProvider": "OpenWeather API"
      }
    }
    ```

### 2. Weather & Forecast
- **`GET /api/weather?city={cityName}`**
  - Fetches normalized current weather for a city.
  - Automatically records search history if authenticated.
- **`GET /api/weather/coordinates?lat={lat}&lon={lon}`**
  - Fetches current weather for geographic coordinates.
- **`GET /api/weather/cities/search?q={query}`**
  - Searches matching cities worldwide.
- **`GET /api/forecast?city={cityName}`**
  - Returns 24-hour hourly outlook and 7-day extended forecasts.
- **`GET /api/forecast/coordinates?lat={lat}&lon={lon}`**
  - Returns hourly and daily forecasts for coordinates.

### 3. Authentication
- **`POST /api/auth/register`**
  - **Body:** `{ "name": "...", "email": "...", "password": "..." }`
  - **Response:** `{ "success": true, "token": "...", "user": { ... } }`
- **`POST /api/auth/login`**
  - **Body:** `{ "email": "...", "password": "..." }`
  - **Response:** `{ "success": true, "token": "...", "user": { ... } }`
- **`GET /api/auth/me`**
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `{ "success": true, "data": { ... } }`

### 4. Favorites (Protected)
- **`GET /api/favorites`** — Get user's saved locations.
- **`POST /api/favorites`** — Add city to favorites (prevents duplicates).
- **`DELETE /api/favorites/:id`** — Remove a saved city.

### 5. Search History (Protected)
- **`GET /api/history`** — Get recent searches.
- **`DELETE /api/history/:id`** — Delete single history entry.
- **`DELETE /api/history`** — Clear entire search history.

---

## 🔒 Security Best Practices

1. **API Keys Concealed:** OpenWeather API keys never reach the browser; they reside strictly within the Express backend proxy.
2. **Encrypted Passwords:** Passwords hashed with `bcryptjs` using 10 salt rounds prior to storage.
3. **Stateless JWT Tokens:** Standard RFC 7519 JSON Web Tokens with 30-day expiration.
4. **Input Sanitization:** Express validation middleware verifies numeric coordinate ranges (-90 to +90 lat, -180 to +180 lon) and sanitizes string inputs.
5. **CORS Governance:** Configured to restrict or whitelist authorized client origins.
6. **No Leaks in Logs:** Passwords and tokens are strictly excluded from server log outputs.

---

## 🧪 Testing Verification

The project includes verified test suites:
- **Backend API Test:** Verified with `node -e "..."` testing city weather, coordinates weather, forecast, user registration, JWT login, favorite creation, duplicate rejection, and history deletion.
- **End-to-End Browser Testing:** Verified with browser subagent on `http://localhost:5500`:
  - Current weather card and atmospheric conditions display.
  - Temperature unit toggle (°C ⇋ °F).
  - Dark mode ⇋ Light mode toggle.
  - City search and dynamic re-rendering.
  - Extended forecast page navigation.
  - City explorer search and card generation.
  - Responsive layout integrity across desktop, tablet, and mobile breakpoints.

---

## 📄 License

This project is licensed under the ISC License.  
WeatherSphere &copy; 2026. All rights reserved.
