import express from 'express';
import gameRoutes from './game.js';
import authRoutes from './auth.js';
import apiRoutes from './api.js';
import { optionalAuth, requireGuest } from '../middlewares/auth.js';

const router = express.Router();

// Home page route - accessible to everyone
router.get('/', optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect('/home-realm');
  }

  return res.render('index', {
    title: 'Deckrift - Drawn to Dust',
    user: req.user || null,
    page: 'home',
    pageScript: '/js/main.js',
  });
});

// Dashboard route - redirect to home realm
router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }

  // Redirect to the new home realm page
  return res.redirect('/home-realm');
});

// Profile route
router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }

  try {
    // Get user data from database
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect('/');
    }

    return res.render('profile', {
      title: 'Profile - Deckrift',
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      profile: {
        displayName: user.displayName || '',
        bio: user.bio || '',
        preferences: user.preferences || {
          autoSave: true,
          soundEnabled: true,
        },
      },
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load profile',
      error,
      user: { username: req.session.username },
    });
  }
});

// Login route
router.get('/login', requireGuest, (req, res) => {
  return res.render('auth/login', {
    title: 'Login - Deckrift',
    user: null,
    page: 'login',
    error: req.query.error || null,
  });
});

// Register route
router.get('/register', requireGuest, (req, res) => {
  return res.render('auth/register', {
    title: 'Register - Deckrift',
    user: null,
    page: 'register',
    error: req.query.error || null,
  });
});

// Health check endpoint
router.get('/health', (req, res) =>
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.GAME_VERSION || '1.0.0',
  })
);

// Handle Chrome DevTools requests to prevent 404 spam
router.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end(); // No content response
});

// API routes (to be expanded)
router.get('/api/status', (req, res) =>
  res.json({
    game: 'Deckrift – Drawn to Dust',
    status: 'running',
    version: process.env.GAME_VERSION || '1.0.0',
  })
);

// API routes
router.use('/api', apiRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/game', gameRoutes);

export default router;
