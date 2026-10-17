/**
 * routes/authRoutes.js
 * Express Router for User Authentication (Registration, Login, Logout, Session Verification)
 * Implements password validation, duplicate email prevention, and session management.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const { isDbConnected } = require('../config/db');

// Database connection readiness check middleware
const checkDbConnection = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is unavailable. Please ensure MongoDB is running or check your MONGODB_URI.',
    });
  }
  next();
};

router.use(checkDbConnection);

/**
 * Helper: Safely migrate any legacy tasks created prior to user authentication
 * Associates unassigned tasks to the given user so no student data is ever lost.
 */
async function migrateLegacyTasks(userId) {
  try {
    const unassignedCount = await Task.countDocuments({
      $or: [{ user: { $exists: false } }, { user: null }],
    });
    if (unassignedCount > 0) {
      const result = await Task.updateMany(
        { $or: [{ user: { $exists: false } }, { user: null }] },
        { $set: { user: userId } }
      );
      console.log(`🌸 Migrated ${result.modifiedCount} legacy tasks to user ${userId}.`);
    }
  } catch (err) {
    console.warn('⚠️ Legacy task migration notice:', err.message);
  }
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account and initiate session
 * @access  Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Frontend & Backend field validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your full name (at least 2 characters).',
      });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter carefully.',
      });
    }

    // 2. Prevent duplicate email registration
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already blooms here. Please log in.',
      });
    }

    // 3. Create user (password is automatically hashed via User pre-save hook)
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
    });

    const savedUser = await newUser.save();

    // 4. Migrate any existing unassigned tasks to the user so existing data is preserved
    await migrateLegacyTasks(savedUser._id);

    // 5. Establish secure server-side session
    req.session.userId = savedUser._id.toString();
    req.session.userName = savedUser.name;
    req.session.userEmail = savedUser.email;

    return res.status(201).json({
      success: true,
      message: `Welcome to your gentle garden, ${savedUser.name}! 🌸`,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and initiate session
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both your email address and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Locate user in MongoDB
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    // 2. Verify hashed password securely with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    // 3. Migrate any existing unassigned tasks if this is the primary account
    await migrateLegacyTasks(user._id);

    // 4. Establish server-side session
    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! 🌸`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Destroy session and clear cookie
 * @access  Public
 */
router.post('/logout', (req, res, next) => {
  if (!req.session) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error destroying session:', err);
      return res.status(500).json({
        success: false,
        message: 'Could not log out at this moment. Please try again.',
      });
    }

    res.clearCookie('connect.sid');
    return res.status(200).json({
      success: true,
      message: 'You have been gently logged out. Have a peaceful day! 🌿',
    });
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve profile of currently authenticated user from session
 * @access  Public / Session check
 */
router.get('/me', async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        user: null,
      });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      req.session.destroy();
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
