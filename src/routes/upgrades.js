import express from 'express';
import SaveService from '../services/saveService.js';
import { calculateAllXPThresholds } from '../services/gameUtils.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Upgrades page
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get current save data for upgrades and stats
    const saveResult = await saveService.loadSave(userId);
    const currentSave = saveResult.success ? saveResult.saveData : null;

    // Get unlocked upgrades from save data (now per-save)
    const unlockedUpgrades = currentSave?.gameData?.upgrades || [];

    // Get upgrade data and filter based on what's already purchased
    const { HOME_REALM_UPGRADES } = await import(
      '../public/js/modules/gameData.js'
    );

    // Filter upgrades to only show level 2 if level 1 is purchased
    const availableUpgrades = {};
    Object.entries(HOME_REALM_UPGRADES).forEach(([upgradeId, upgrade]) => {
      // For level 2 upgrades, check if corresponding level 1 is purchased
      if (upgrade.level === 2) {
        const level1UpgradeId = upgradeId.replace('2', '1');
        if (unlockedUpgrades.includes(level1UpgradeId)) {
          availableUpgrades[upgradeId] = upgrade;
        }
      } else {
        // Level 1 upgrades are always available
        availableUpgrades[upgradeId] = upgrade;
      }
    });

    // Calculate XP thresholds for each stat
    const stats = currentSave
      ? currentSave.gameData.stats
      : { power: 1, will: 1, craft: 1, focus: 1 };
    const xpThresholds = calculateAllXPThresholds(stats);

    return res.render('upgrades', {
      title: 'Upgrades - Deckrift',
      user: { username: req.session.username },
      gameSave: currentSave ? { ...currentSave, isActive: true } : null,
      currentSave,
      unlockedUpgrades,
      availableUpgrades,
      currency: currentSave?.gameData?.saveCurrency || 0,
      xpThresholds,
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load Upgrades',
      error,
    });
  }
});

// Purchase upgrade
router.post('/purchase-upgrade', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { upgradeId } = req.body;

    // Get current save data
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const currentSave = saveResult.saveData;

    // Get upgrade details from game data
    const { HOME_REALM_UPGRADES } = await import(
      '../public/js/modules/gameData.js'
    );
    const upgrade = HOME_REALM_UPGRADES[upgradeId];

    if (!upgrade) {
      return res.status(400).json({ error: 'Invalid upgrade' });
    }

    // Check if user has enough currency
    if (currentSave.gameData.saveCurrency < upgrade.cost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient currency',
        required: upgrade.cost,
        current: currentSave.gameData.saveCurrency,
      });
    }

    // Check if already purchased
    if (
      currentSave.gameData.upgrades &&
      currentSave.gameData.upgrades.includes(upgradeId)
    ) {
      return res.status(400).json({ error: 'Upgrade already purchased' });
    }

    // Purchase upgrade
    currentSave.gameData.saveCurrency -= upgrade.cost;
    if (!currentSave.gameData.upgrades) currentSave.gameData.upgrades = [];
    currentSave.gameData.upgrades.push(upgradeId);

    // Save the updated save data
    await saveService.updateSave(userId, currentSave);

    return res.json({
      success: true,
      message: `Successfully purchased ${upgrade.name}`,
      newCurrency: currentSave.gameData.saveCurrency,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to purchase upgrade' });
  }
});

export default router;
