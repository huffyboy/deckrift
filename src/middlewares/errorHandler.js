import logger from '../config/logger.js';

/**
 * Utility function for proper error handling in routes
 * Logs the error and returns appropriate response
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} context - Context where error occurred
 * @param {boolean} isJson - Whether to return JSON response
 */
export function handleRouteError(
  error,
  req,
  res,
  context = 'Unknown',
  isJson = true
) {
  // Log the full error with context
  logger.error(`=== ROUTE ERROR: ${context} ===`);
  logger.error(`Error Message: ${error.message}`);
  logger.error(`Error Stack: ${error.stack}`);
  logger.error(`Request URL: ${req.url}`);
  logger.error(`Request Method: ${req.method}`);
  logger.error(`User ID: ${req.session?.userId}`);
  logger.error(`Request Body: ${JSON.stringify(req.body, null, 2)}`);
  logger.error('=============================');

  // Return appropriate response
  if (isJson) {
    return res.status(500).json({
      error: 'Server Error',
      message:
        'Please try again later. If the problem persists, contact support.',
      context: context,
    });
  } else {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'An unexpected error occurred.',
      error: process.env.NODE_ENV === 'development' ? error : {},
      context: context,
    });
  }
}

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
    // Log the full error with stack trace
    logger.error('=== EXPRESS ERROR HANDLER ===');
    logger.error(`Error Message: ${err.message}`);
    logger.error(`Error Stack: ${err.stack}`);
    logger.error(`Request URL: ${req.url}`);
    logger.error(`Request Method: ${req.method}`);
    logger.error(`User ID: ${req.session?.userId}`);
    logger.error('=============================');

    // Send error response
    res.status(500).json({
      error: 'Server Error',
      message:
        'Please try again later. If the problem persists, contact support.',
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
