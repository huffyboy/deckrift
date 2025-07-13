import logger from '../config/logger.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Not found middleware
 */
export const notFound = (req, res) => {
  res.status(404);
  res.render('errors/404', {
    title: '404 Not Found - Deckrift',
    user: req.session?.userId ? { username: req.session.username } : null,
  });
};

export const createErrorHandler =
  (_defaultMessage, _isDevelopment) => (err, req, res, _next) => {
    // Log the error
    logger.error('Error:', err);

    // Send error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong',
    });
  };

// Error handling middleware

// 404 handler
export const handle404 = (req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
  });
  return null;
};

// General error handler
export const handleError = (err, req, res) => {
  // Render error page
  res.status(err.status || 500).render('errors/error', {
    title: 'Error',
    message: err.message || 'An unexpected error occurred.',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
  return null;
};
