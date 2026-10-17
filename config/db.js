/**
 * config/db.js
 * Database Connection Module
 * Connects Express backend to MongoDB using Mongoose with connection pooling and serverless caching.
 */

const mongoose = require('mongoose');

// Track connection state & cached promise for serverless environments (Vercel)
let isConnected = false;
let cachedPromise = null;

const connectDB = async () => {
  // 1. If connection is already open, reuse it immediately
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  // 2. If a connection is in flight, await the existing promise to avoid race conditions
  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloom_db';

  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    })
    .then((conn) => {
      isConnected = true;
      console.log(`🌸 MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    })
    .catch((error) => {
      cachedPromise = null;
      isConnected = false;
      console.error('❌ MongoDB Connection Error:', error.message);
      console.error('💡 Tip: Make sure your MongoDB Atlas MONGODB_URI is configured in your environment variables.');
      return null;
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
