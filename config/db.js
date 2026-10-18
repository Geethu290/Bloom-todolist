/**
 * config/db.js
 * Database Connection Module
 * Connects Express backend to MongoDB using Mongoose with connection pooling and serverless caching.
 */

const mongoose = require('mongoose');

// Track connection state & cached promise for serverless environments (Vercel)
let isConnected = false;
let cachedPromise = null;

/* Revised connection logic: single shared promise, proper error propagation */
const connectDB = async () => {
  // If already connected, resolve immediately
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  // If a connection attempt is already in progress, return that promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloom_db';

  // Create a new connection promise and cache it
  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas unavailable
    })
    .then((conn) => {
      isConnected = true;
      console.log(`🌸 MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    })
    .catch((error) => {
      // Reset cache so future attempts can retry
      cachedPromise = null;
      isConnected = false;
      console.error('❌ MongoDB Connection Error:', error.message);
      console.error('💡 Tip: Verify MONGODB_URI is set correctly in environment variables.');
      // Propagate error to callers for proper handling
      throw error;
    });

  return cachedPromise;
};

// Monitor ongoing connection events
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('🌸 Mongoose connected to MongoDB.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ Mongoose disconnected from MongoDB.');
});

// Helper function to check if DB is ready
const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, isDbConnected };
