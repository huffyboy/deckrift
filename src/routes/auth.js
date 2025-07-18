import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserSettings,
  getDashboard,
  getSettings,
  updateSettings,
  checkAuth,
} from '../controllers/authController.js';

const router = express.Router();

// User authentication endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/settings', getUserSettings);
router.get('/check', checkAuth);

// Dashboard and settings routes
router.get('/dashboard', getDashboard);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
