/**
 * middleware/errorHandler.js
 * Centralized Error Handling Middleware for Express
 * Ensures friendly, structured JSON error responses and hides sensitive server details.
 */

const errorHandler = (err, req, res, next) => {
  console.error(`❌ [${req.method}] ${req.originalUrl} - Error:`, err.message);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Something went wrong on the server.';

  // Handle Mongoose Validation Errors (e.g. required fields, enum mismatch)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((val) => val.message);
    message = errors.join(' ');
  }

  // Handle Mongoose CastError (e.g. invalid MongoDB ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with the provided ID (${err.value}).`;
  }

  // Handle JSON parse errors from invalid request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // Include stack trace only if explicitly in development mode and not in production
    ...(process.env.NODE_ENV === 'development' && { errorDetails: err.stack }),
  });
};

// 404 Not Found Handler for unmatched routes
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFoundHandler };
