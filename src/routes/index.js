import express from 'express';
import gameRoutes from './game.js';
import authRoutes from './auth.js';
import saveRoutes from './save.js';
import { optionalAuth, requireGuest } from '../middlewares/auth.js';
import { SAVE_VERSION } from '../services/saveSchemas.js';

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

// Settings route
router.get('/settings', async (req, res) => {
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

    // Get active game save for navbar
    const SaveService = (await import('../services/saveService.js')).default;
    const saveService = new SaveService();
    const { userId } = req.session;
    const saveResult = await saveService.loadSave(userId);
    const activeSave = saveResult.success ? saveResult.saveData : null;

    return res.render('settings', {
      title: 'Settings - Deckrift',
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      gameSave: activeSave, // Add gameSave data for navbar
      settings: {
        displayName: user.displayName || '',
        preferences: user.preferences || {
          autoSave: true,
          soundEnabled: true,
        },
      },
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load settings',
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
    version: process.env.GAME_VERSION || SAVE_VERSION,
  })
);

// Handle Chrome DevTools requests to prevent 404 spam
router.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end(); // No content response
});

// Routes
router.use('/auth', authRoutes);
router.use('/game', gameRoutes);
router.use('/save', saveRoutes);

export default router;
