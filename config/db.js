/**
 * config/db.js
 * Database Connection Module
 * Connects Express backend to MongoDB using Mongoose.
 */

const mongoose = require('mongoose');

// Track connection state
let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloom_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    });

    isConnected = true;
    console.log(`🌸 MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('💡 Tip: Make sure MongoDB is running locally (mongod) or provide a valid MONGODB_URI in your .env file.');
    // Do not exit process in development so server can still serve frontend and return clear error messages
    return null;
  }
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
