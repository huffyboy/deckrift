import express from 'express';
import User from '../models/User.js';
import SaveService from '../services/saveService.js';
import {
  createDefaultSaveData,
  SAVE_VERSION,
} from '../services/saveSchemas.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

// Helper function to calculate final score
function calculateScore(stats) {
  let score = 0;

  // Base score from levels completed
  score += stats.levelsCompleted * 100;

  // Bonus for XP gained
  score += Math.floor(stats.totalXP / 10);

  // Bonus for cards collected
  score += stats.cardsCollected * 5;

  // Bonus for artifacts found
  score += stats.artifactsFound * 25;

  // Bonus for currency earned
  score += stats.currencyEarned;

  // Time bonus (faster runs get more points)
  if (stats.duration > 0) {
    score += Math.max(0, 1000 - stats.duration * 2);
  }

  return Math.max(0, score);
}

// Helper function to calculate run statistics
function calculateRunStats(saveData) {
  const stats = {
    duration: 0,
    levelsCompleted: saveData.runData.location.level - 1,
    totalXP: 0,
    cardsCollected: saveData.runData.fightStatus.playerDeck
      ? saveData.runData.fightStatus.playerDeck.length
      : 0,
    artifactsFound: saveData.runData.equipment
      ? saveData.runData.equipment.filter((item) => item.type === 'artifact')
          .length
      : 0,
    currencyEarned: saveData.gameData.currency || 0,
    finalScore: 0,
  };

  // Calculate duration if we have start and end times
  if (saveData.timestamp && saveData.endedAt) {
    stats.duration = Math.floor(
      (saveData.endedAt - saveData.timestamp) / 1000 / 60
    ); // minutes
  }

  // Calculate total XP
  if (saveData.gameData.statXP) {
    stats.totalXP = Object.values(saveData.gameData.statXP).reduce(
      (sum, xp) => sum + (xp || 0),
      0
    );
  }

  // Calculate final score based on various factors
  stats.finalScore = calculateScore(stats);

  return stats;
}

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Game Over page - Run summary and return to home realm
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get the current save (which should be marked as ended)
    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.redirect('/home-realm');
    }

    const saveData = saveResult.saveData;

    // Check if this save is actually ended
    if (!saveData.endedAt) {
      return res.redirect('/home-realm');
    }

    // Calculate run statistics
    const runStats = calculateRunStats(saveData);

    return res.render('game-over', {
      title: 'Game Over - Deckrift',
      user: { username: req.session.username },
      gameSave: saveData ? { ...saveData, isActive: true } : null,
      runStats,
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load game over page',
      error,
    });
  }
});

// API endpoint to return to home realm
router.post('/return-home', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Update user statistics if needed
    const user = await User.findById(userId);
    if (user) {
      // Any final statistics updates can go here
      await user.save();
    }

    // Archive the completed run data
    // This preserves game data but marks the run as completed
    const saveResult = await saveService.loadSave(userId);
    if (saveResult.success) {
      // Mark run as completed but keep game data
      saveResult.saveData.runData.completed = true;
      saveResult.saveData.runData.completedAt = Date.now();
      await saveService.updateSave(userId, saveResult.saveData);
    }

    return res.json({
      success: true,
      redirect: '/home-realm',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to return to home realm' });
  }
});

// API endpoint to start new run
router.post('/new-run', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { realmId, startingWeapon, startingArmor } = req.body;

    // Validate inputs
    if (!realmId || !startingWeapon || !startingArmor) {
      return res.status(400).json({
        error: 'Missing required run parameters',
      });
    }

    // Clear run data when starting a new run
    // This preserves game data (stats, currency, unlocks) but clears run progress
    const existingSave = await saveService.loadSave(userId);
    if (existingSave.success) {
      // Clear run data but preserve game data
      existingSave.saveData.runData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        map: {
          tiles: [],
          width: 0,
          height: 0,
        },
        location: {
          realm: parseInt(realmId, 10),
          level: 1,
          mapX: 0,
          mapY: 0,
        },
        fightStatus: {
          inBattle: false,
          playerHand: [],
          playerDeck: [],
          enemyHand: [],
          enemyDeck: [],
          enemyStats: {},
          enemyHealth: 0,
          enemyMaxHealth: 0,
          turn: 'player',
        },
        eventStatus: {
          currentEvent: null,
          drawnCards: [],
          eventStep: 0,
          eventPhase: 'start',
        },
        statModifiers: {
          power: 0,
          will: 0,
          craft: 0,
          focus: 0,
        },
        equipment: [
          {
            type: 'weapon',
            value: startingWeapon,
            equipped: true,
          },
          {
            type: 'armor',
            value: startingArmor,
            equipped: true,
          },
        ],
      };
      await saveService.updateSave(userId, existingSave.saveData);
    }

    // Create initial save data using helper function
    const initialSaveData = createDefaultSaveData(`Run ${Date.now()}`);

    // Customize the save data for this specific run
    initialSaveData.runData.location.realm = parseInt(realmId, 10);
    initialSaveData.runData.location.level = 1;
    initialSaveData.runData.equipment = [
      {
        type: 'weapon',
        value: startingWeapon,
        equipped: true,
      },
      {
        type: 'armor',
        value: startingArmor,
        equipped: true,
      },
    ];

    // Create new save using save service
    const saveResult = await saveService.createNewSave(userId, initialSaveData);

    if (!saveResult.success) {
      return res.status(500).json({
        error: 'Failed to start new run',
      });
    }

    return res.json({
      success: true,
      saveId: saveResult.saveData.timestamp,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to start new run',
    });
  }
});

export default router;
