/**
 * middleware/authMiddleware.js
 * Authentication & Session Protection Middleware for Bloom
 * Restricts access to authenticated users and prevents unauthenticated access to private tasks.
 */

/**
 * Ensures user is authenticated via server-side session.
 * Rejects API requests with 401 Unauthorized JSON, or redirects page requests to login.
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  // If this is an API call or AJAX request, return a clean 401 JSON response
  if (req.originalUrl.startsWith('/api/') || req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to tend to your garden.',
    });
  }

  // Otherwise, redirect the user's browser to the login page
  return res.redirect('/login.html');
};

/**
 * If user is already authenticated, redirects them away from login/register pages to dashboard
 */
const redirectIfAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

module.exports = { requireAuth, redirectIfAuth };
