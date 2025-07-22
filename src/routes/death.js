import express from 'express';
import SaveService from '../services/saveService.js';

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

// Handle player death
router.post('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { deathReason = 'Unknown', runResults = {} } = req.body;

    // Get current save
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active save found' });
    }

    const saveData = saveResult.saveData;

    // Check if player is actually dead (health <= 0)
    if (saveData.runData.health > 0) {
      return res.status(400).json({ error: 'Player is not dead' });
    }

    // End the run and transfer currency
    const endOfRunResult = await saveService.endOfRun(userId, {
      ...runResults,
      deathReason,
      // You can add additional run results here
      // xpGained: { power: 0, will: 0, craft: 0, focus: 0 },
      // unlockedUpgrades: [],
      // unlockedEquipment: []
    });

    if (!endOfRunResult.success) {
      return res.status(500).json({
        error: 'Failed to process death',
        details: endOfRunResult.error,
      });
    }

    // Mark the save as ended
    const updatedSave = endOfRunResult.saveData;
    updatedSave.endedAt = Date.now();
    updatedSave.endReason = deathReason;

    // Save the final state
    const finalSaveResult = await saveService.updateSave(userId, updatedSave);
    if (!finalSaveResult.success) {
      return res.status(500).json({
        error: 'Failed to save death state',
      });
    }

    return res.json({
      success: true,
      message: 'Death processed successfully',
      currencyTransferred: endOfRunResult.currencyTransferred,
      newSaveCurrency: endOfRunResult.newSaveCurrency,
      redirect: '/game-over',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to process death',
      details: error.message,
    });
  }
});

// Get death summary (for game over page)
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active save found' });
    }

    const saveData = saveResult.saveData;

    // Check if save is marked as ended
    if (!saveData.endedAt) {
      return res.status(400).json({ error: 'Save is not marked as ended' });
    }

    const summary = {
      deathReason: saveData.endReason || 'Unknown',
      endTime: saveData.endedAt,
      finalStats: {
        health: saveData.runData.health,
        maxHealth: saveData.runData.maxHealth,
        power: saveData.gameData.stats.power,
        will: saveData.gameData.stats.will,
        craft: saveData.gameData.stats.craft,
        focus: saveData.gameData.stats.focus,
        saveCurrency: saveData.gameData.saveCurrency,
      },
      runProgress: {
        realm: saveData.runData.location.realm,
        level: saveData.runData.location.level,
        runCurrency: saveData.runData.runCurrency || 0,
      },
    };

    return res.json({
      success: true,
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get death summary',
      details: error.message,
    });
  }
});

export default router;
