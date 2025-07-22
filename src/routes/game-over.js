import express from 'express';
import User from '../models/User.js';
import SaveService from '../services/saveService.js';
import { createDefaultSaveData } from '../services/saveSchemas.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

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

    // Get final stats from the save
    const finalStats = {
      health: saveData.runData.health,
      maxHealth: saveData.runData.maxHealth,
      power: saveData.gameData.stats.power,
      will: saveData.gameData.stats.will,
      craft: saveData.gameData.stats.craft,
      focus: saveData.gameData.stats.focus,
      currencyEarned: saveData.runData.runCurrency || 0,
    };

    return res.render('game-over', {
      title: 'Game Over - Deckrift',
      user: { username: req.session.username },
      gameSave: { ...saveData, isActive: false },
      finalStats,
      endReason: saveData.endReason || 'Unknown',
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

    // Handle end of current run if it exists
    const existingSave = await saveService.loadSave(userId);
    if (existingSave.success) {
      // End the current run and transfer currency
      const endOfRunResult = await saveService.endOfRun(userId, {
        // You can add run results here if needed
        // xpGained: { power: 0, will: 0, craft: 0, focus: 0 },
        // unlockedUpgrades: [],
        // unlockedEquipment: []
      });

      if (!endOfRunResult.success) {
        return res.status(500).json({
          error: 'Failed to end current run',
        });
      }
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
