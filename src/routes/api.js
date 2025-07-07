import express from 'express';
import {
  getGameData,
  saveGameData,
  getGameSaves,
  deleteGameSave,
  getStatisticsDashboard,
} from '../controllers/apiController.js';

const router = express.Router();

// Game data endpoints
router.get('/game/data', getGameData);
router.post('/game/save', saveGameData);
router.get('/game/saves', getGameSaves);
router.delete('/game/saves/:id', deleteGameSave);

// Statistics dashboard
router.get('/statistics/dashboard', getStatisticsDashboard);

export default router;
