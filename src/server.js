import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mainRouter from './routes/index.js';
import homeRealmRouter from './routes/home-realm.js';
import gameRouter from './routes/game.js';
import battleRouter from './routes/battle.js';
import eventRouter from './routes/event.js';
import shopRouter from './routes/shop.js';
import gameOverRouter from './routes/game-over.js';
import statusRouter from './routes/status.js';
import upgradesRouter from './routes/upgrades.js';
import saveRouter from './routes/save.js';
import deathRouter from './routes/death.js';

import connectDB from './config/database.js';
import { createErrorHandler, notFound } from './middlewares/errorHandler.js';
import simpleLogger from './middlewares/simpleLogger.js';
import logger from './config/logger.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create global error handler
const handleGlobalErrors = createErrorHandler(
  'An unexpected error occurred',
  isDevelopment
);

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(simpleLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || '123xxxx345',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      secure: false, // Render free tier uses HTTP, not HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: 'lax',
    },
  })
);

// Debug session middleware
app.use((req, res, next) => {
  console.log('Session middleware - req.session:', req.session);
  console.log('Session middleware - req.headers.cookie:', req.headers.cookie);

  // Log response headers after the response is sent
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    console.log('Response headers:', res.getHeaders());
    console.log('Set-Cookie header:', res.getHeader('Set-Cookie'));
    originalEnd.call(this, chunk, encoding);
  };

  next();
});

// Routes
app.use('/', mainRouter);
app.use('/home-realm', homeRealmRouter);
app.use('/game', gameRouter);
app.use('/battle', battleRouter);
app.use('/event', eventRouter);
app.use('/shop', shopRouter);
app.use('/game-over', gameOverRouter);
app.use('/status', statusRouter);
app.use('/upgrades', upgradesRouter);
app.use('/save', saveRouter);
app.use('/death', deathRouter);

// Error handling middleware - 404 handler must come after all routes
app.use(notFound);

// Global error handler
app.use(handleGlobalErrors);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  logger.error('Stack:', reason?.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:');
  logger.error('Error:', error.message);
  logger.error('Stack:', error.stack);
  process.exit(1);
});

// Start server
app.listen(port, () => {
  logger.info(
    `Server is running at ${process.env.URL || `http://localhost:${port}`}`
  );
  console.log(
    `Server is running at ${process.env.URL || `http://localhost:${port}`}`
  );
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  console.log(
    'Session Secret:',
    process.env.SESSION_SECRET ? 'Set' : 'Not set'
  );
});
