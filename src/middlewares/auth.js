import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Authentication Middleware
 * Handles authentication checks for protected routes
 */

// Middleware to check if user is authenticated
export const requireAuth = async (req, res, next) => {
  try {
    console.log('Auth middleware - req.session:', req.session);
    console.log('Auth middleware - userId:', req.session?.userId);

    const { userId } = req.session;

    if (!userId) {
      console.log('Auth middleware - No userId found, redirecting to login');
      // Check if this is a JSON request (AJAX/fetch)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({
          error: 'Authentication required',
          authenticated: false,
        });
      }

      // For page routes, redirect to login
      return res.redirect('/login');
    }

    // Verify user exists
    const user = await User.findById(userId).select('-password');
    if (!user) {
      // Clear invalid session
      req.session.destroy();

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({
          error: 'Invalid session',
          authenticated: false,
        });
      }

      return res.redirect('/login');
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        error: 'Authentication check failed',
        authenticated: false,
      });
    }

    return res.redirect('/login');
  }
};

// Middleware to check if user is NOT authenticated (for login/register pages)
export const requireGuest = (req, res, next) => {
  const { userId } = req.session;

  if (userId) {
    // User is already authenticated, redirect to home realm
    return res.redirect('/home-realm');
  }

  next();
};

// Optional auth middleware - adds user to req if authenticated, but doesn't require it
export const optionalAuth = async (req, res, next) => {
  try {
    const { userId } = req.session;

    if (userId) {
      const user = await User.findById(userId).select('-password');
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};
