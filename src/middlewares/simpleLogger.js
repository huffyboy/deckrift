import logger from '../config/logger.js';

/**
 * Simple request logging middleware
 * Logs method, path, and status code for each request
 * Ignores specific routes that generate noise in logs
 */
const simpleLogger = (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;

  // Override end function to log response
  res.end = function (chunk, encoding) {
    // Call original end function
    originalEnd.call(this, chunk, encoding);

    // Log request details
    const { method, path } = req;
    const { statusCode } = res;

    // Ignore noisy requests
    const ignoredPaths = [
      '/.well-known/appspecific/com.chrome.devtools.json',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    if (!ignoredPaths.includes(path)) {
      logger.http(`${method} ${path} - ${statusCode}`);
    }
  };

  next();
};

export default simpleLogger;
