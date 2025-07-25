import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import BattleController from '../controllers/battleController.js';

const router = express.Router();
const battleController = new BattleController();

// Battle page route
router.get(
  '/',
  requireAuth,
  battleController.getBattlePage.bind(battleController)
);

// Battle API endpoints
router.post(
  '/start',
  requireAuth,
  battleController.startBattle.bind(battleController)
);
router.post(
  '/play-card',
  requireAuth,
  battleController.playCard.bind(battleController)
);
router.post(
  '/enemy-turn',
  requireAuth,
  battleController.processEnemyTurn.bind(battleController)
);

// Battle end page (combined victory/defeat)
router.get(
  '/end',
  requireAuth,
  battleController.getBattleEndPage.bind(battleController)
);

export default router;
