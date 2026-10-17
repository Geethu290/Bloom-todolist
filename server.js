/**
 * server.js
 * Main Express Application Server for Bloom To-Do List
 * Sets up middleware, database connection, secure sessions, authentication, and API routes.
 * Configured for both local development and Vercel serverless deployment.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
require('dotenv').config();

const { connectDB, isDbConnected } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { requireAuth, redirectIfAuth } = require('./middleware/authMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Crucial for Vercel deployment and secure cookies over HTTPS)
app.set('trust proxy', 1);

// Connect to MongoDB on startup
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database connection is established for serverless invocations
app.use(async (req, res, next) => {
  if (!isDbConnected()) {
    await connectDB();
  }
  next();
});

// Configure Server-Side Sessions with MongoDB Store
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'bloom_gentle_default_secret_key_blossom_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloom_db',
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    }),
    cookie: {
      httpOnly: true, // Mitigate XSS attacks by disallowing client script cookie access
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production HTTPS (e.g. Vercel)
      sameSite: 'lax', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    },
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Bloom — Your Gentle To-Do List',
    databaseConnected: isDbConnected(),
    timestamp: new Date().toISOString(),
  });
});

// Authentication API Routes
app.use('/api/auth', authRoutes);

// Protected Task Management API Routes
app.use('/api/tasks', taskRoutes);

// Page Routing with Authentication Protection
// 1. Login and Register pages (redirect to dashboard if already authenticated)
app.get(['/login', '/login.html'], redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get(['/register', '/register.html'], redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// 2. Dashboard root and index.html (protected: requires active session)
app.get(['/', '/index.html'], requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve Static Frontend Assets (css, js, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start the HTTP Server when run directly (local development)
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`
  ======================================================
  🌸 Bloom — Your Gentle To-Do List Server Running! 🌸
  ------------------------------------------------------
  ✨ Local URL:     http://localhost:${PORT}
  🌿 API Endpoint:  http://localhost:${PORT}/api/tasks
  💌 Auth Endpoint: http://localhost:${PORT}/api/auth
  🍃 Environment:   ${process.env.NODE_ENV || 'development'}
  ======================================================
    `);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
});

// Export app for Vercel serverless handler and test suites
module.exports = app;
module.exports.app = app;
module.exports.server = server;
