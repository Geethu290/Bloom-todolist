/**
 * models/Task.js
 * Mongoose Schema & Model for Task
 * Defines data structure, validation rules, user ownership, and timestamps for Bloom To-Do List.
 */

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task owner is required.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required.'],
      trim: true,
      minlength: [1, 'Title cannot be empty.'],
      maxlength: [120, 'Title cannot exceed 120 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High.',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: ['To Do', 'In Progress', 'Completed'],
        message: 'Status must be To Do, In Progress, or Completed.',
      },
      default: 'To Do',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound indexing by user and query attributes for high performance
taskSchema.index({ user: 1, status: 1, dueDate: 1, priority: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
