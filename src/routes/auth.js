import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  getDashboard,
  getProfile,
  updateProfile,
  checkAuth,
} from '../controllers/authController.js';

const router = express.Router();

// User authentication endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', getUserProfile);
router.get('/check', checkAuth);

// Dashboard and profile routes
router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
