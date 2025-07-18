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
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60, // 1 day
      autoRemove: 'native',
      touchAfter: 24 * 3600, // 24 hours
      collectionName: 'sessions',
    }),
    cookie: {
      secure: !isDevelopment,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
      domain: isDevelopment ? undefined : 'deckrift-server.onrender.com',
    },
    name: 'sessionId',
    rolling: true,
  })
);

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

// Error handling middleware - 404 handler must come after all routes
app.use(notFound);

// Global error handler
app.use(handleGlobalErrors);

// Start server
app.listen(port, () => {
  logger.info(`Server is running at ${process.env.URL}`);
});
