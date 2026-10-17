/**
 * routes/taskRoutes.js
 * Express Router for Bloom Task Management REST API
 * Implements CRUD operations, searching, filtering, and status updates,
 * strictly scoped to the authenticated user via server-side session.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { isDbConnected } = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

// Middleware to ensure DB connection is ready before querying
const checkDbConnection = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is unavailable. Please ensure MongoDB is running locally or check your MONGODB_URI in .env.',
    });
  }
  next();
};

// 1. Check DB readiness
router.use(checkDbConnection);

// 2. Protect all task API endpoints with authentication middleware
router.use(requireAuth);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the logged-in user with optional search, filter, and sorting
 * @access  Private (Authenticated)
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, filter, status, priority, sortBy, order } = req.query;

    // Strict user scoping: only query tasks belonging to the authenticated user
    let query = { user: req.session.userId };

    // 1. Search by keyword in title or description (case-insensitive regex)
    if (search && search.trim() !== '') {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$and = [
        {
          $or: [
            { title: { $regex: escapedSearch, $options: 'i' } },
            { description: { $regex: escapedSearch, $options: 'i' } },
          ],
        },
      ];
    }

    // 2. Filter by status
    if (status && ['To Do', 'In Progress', 'Completed'].includes(status)) {
      query.status = status;
    }

    // Predefined filters: all, today, upcoming, in-progress, completed
    if (filter) {
      const now = new Date();
      // Start and end of current local day
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (filter === 'today') {
        query.dueDate = { $gte: startOfToday, $lte: endOfToday };
      } else if (filter === 'upcoming') {
        query.dueDate = { $gt: endOfToday };
        query.status = { $ne: 'Completed' };
      } else if (filter === 'in-progress') {
        query.status = 'In Progress';
      } else if (filter === 'completed') {
        query.status = 'Completed';
      }
    }

    // 3. Priority filter
    if (priority && ['Low', 'Medium', 'High'].includes(priority)) {
      query.priority = priority;
    }

    // 4. Sorting options
    let sortOptions = { createdAt: -1 }; // Default: Newest first

    if (sortBy === 'dueDate') {
      const sortOrder = order === 'desc' ? -1 : 1;
      sortOptions = { dueDate: sortOrder, createdAt: -1 };
    } else if (sortBy === 'priority') {
      const sortOrder = order === 'asc' ? 1 : -1;
      sortOptions = { priority: sortOrder, createdAt: -1 };
    } else if (sortBy === 'createdAt') {
      const sortOrder = order === 'asc' ? 1 : -1;
      sortOptions = { createdAt: sortOrder };
    } else if (sortBy === 'title') {
      const sortOrder = order === 'desc' ? -1 : 1;
      sortOptions = { title: sortOrder };
    }

    const tasks = await Task.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tasks/stats/summary
 * @desc    Get dashboard metrics for the logged-in user
 * @access  Private (Authenticated)
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const allTasks = await Task.find({ user: req.session.userId });
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = allTasks.filter((t) => t.status === 'In Progress').length;
    const todo = allTasks.filter((t) => t.status === 'To Do').length;
    const pendingTotal = total - completed;

    // Completed today: completed status and updatedAt or dueDate today
    const completedToday = allTasks.filter((t) => {
      if (t.status !== 'Completed') return false;
      const taskDate = t.updatedAt || t.createdAt;
      return taskDate >= startOfToday && taskDate <= endOfToday;
    }).length;

    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        todo,
        pendingTotal,
        completedToday,
        progressPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID (must belong to authenticated user)
 * @access  Private (Authenticated)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Task ID format.',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.session.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your garden.',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task owned by authenticated user
 * @access  Private (Authenticated)
 */
router.post('/', async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;

    // Input validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required and cannot be empty.',
      });
    }

    if (priority && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Choose Low, Medium, or High.',
      });
    }

    if (status && !['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Choose To Do, In Progress, or Completed.',
      });
    }

    // Process due date safely
    let parsedDueDate = null;
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format.',
        });
      }
      parsedDueDate = d;
    }

    const newTask = new Task({
      user: req.session.userId, // Establish ownership from secure session
      title: title.trim(),
      description: description ? description.trim() : '',
      dueDate: parsedDueDate,
      priority: priority || 'Medium',
      status: status || 'To Do',
    });

    const savedTask = await newTask.save();

    res.status(201).json({
      success: true,
      message: 'Task planted successfully! 🌸',
      data: savedTask,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update an existing task owned by authenticated user
 * @access  Private (Authenticated)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Task ID format.',
      });
    }

    const { title, description, dueDate, priority, status } = req.body;

    // Validation
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty.',
        });
      }
    }

    if (priority && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Choose Low, Medium, or High.',
      });
    }

    if (status && !['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Choose To Do, In Progress, or Completed.',
      });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description ? description.trim() : '';
    if (priority !== undefined) updateFields.priority = priority;
    if (status !== undefined) updateFields.status = status;

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        updateFields.dueDate = null;
      } else {
        const d = new Date(dueDate);
        if (isNaN(d.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date format.',
          });
        }
        updateFields.dueDate = d;
      }
    }

    // Find and update strictly matching user ownership
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: req.session.userId },
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your garden.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task nurtured and updated successfully! 🌿',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Quick status update (must be owned by authenticated user)
 * @access  Private (Authenticated)
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Task ID format.',
      });
    }

    if (!status || !['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be To Do, In Progress, or Completed.',
      });
    }

    // Update only if task belongs to authenticated user
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: req.session.userId },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your garden.',
      });
    }

    const statusMessage =
      status === 'Completed'
        ? 'Wonderful! Task bloomed into completion! 🤍'
        : `Task status gently updated to ${status}. ✨`;

    res.status(200).json({
      success: true,
      message: statusMessage,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task owned by authenticated user
 * @access  Private (Authenticated)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Task ID format.',
      });
    }

    // Delete strictly if task belongs to authenticated user
    const deletedTask = await Task.findOneAndDelete({
      _id: id,
      user: req.session.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your garden to delete.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task gently removed from your garden 🍃',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
