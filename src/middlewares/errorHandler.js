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
  (defaultMessage, isDevelopment) => (err, req, res) => {
    const status = err.status || 500;
    const message = err.message || defaultMessage;

    res.status(status);

    // For API routes, send JSON response
    if (req.path.startsWith('/api/')) {
      return res.json({
        error: message,
        status,
        ...(isDevelopment && { stack: err.stack }),
      });
    }

    // For regular routes, render error page
    res.render('errors/error', {
      title: `${status} Error - Deckrift`,
      message,
      error: isDevelopment ? err : undefined,
      user: req.session?.userId ? { username: req.session.username } : null,
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
