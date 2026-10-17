/**
 * models/User.js
 * Mongoose Schema & Model for User
 * Encapsulates user credentials, secure password hashing, and validation for Bloom.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your full name.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long.'],
      maxlength: [50, 'Name cannot exceed 50 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email address.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address.',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare candidate password with stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
