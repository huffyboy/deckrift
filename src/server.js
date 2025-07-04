import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import mainRouter from './routes/index.js';
import connectDB from './config/database.js';
import { createErrorHandler, notFound } from './middlewares/errorHandler.js';
import MongoStore from 'connect-mongo';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT;
const isDevelopment = process.env.NODE_ENV !== 'production';
const baseUrl = process.env.URL;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create global error handler
const handleGlobalErrors = createErrorHandler('An unexpected error occurred', isDevelopment);

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware (not sure if we need these, from another project)
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(methodOverride('_method'));
// app.use(helmet({
//     contentSecurityPolicy: false // Disable CSP for development
// }));
// app.use(morgan('dev'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native',
    touchAfter: 24 * 3600, // 24 hours
    collectionName: 'sessions'
  }),
  cookie: {
    secure: !isDevelopment,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'lax',
    domain: isDevelopment ? undefined : 'deckrift-server.onrender.com'
  },
  name: 'sessionId',
  rolling: true
}));

// Routes
app.use('/', mainRouter);

// Error handling middleware
app.use(notFound);
app.use(handleGlobalErrors);

// Start server
app.listen(port, () => {
  console.log(`Server is running at ${baseUrl}`);
});
