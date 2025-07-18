import express from 'express';
import User from '../models/User.js';
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

    // Get user's current profile
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/');
    }

    // Get current save data for upgrades and stats
    const saveResult = await saveService.loadSave(userId);
    const currentSave = saveResult.success ? saveResult.saveData : null;

    // Get unlocked upgrades from save data or user
    const unlockedUpgrades = currentSave
      ? currentSave.gameData.unlockedUpgrades
      : user.upgrades || [];

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
      currentSave,
      unlockedUpgrades,
      availableUpgrades,
      currency: currentSave
        ? currentSave.gameData.currency
        : user.currency || 0,
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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

    // Check if user can afford it
    if (currentSave.gameData.currency < upgrade.cost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Check if already purchased
    if (
      currentSave.gameData.unlockedUpgrades &&
      currentSave.gameData.unlockedUpgrades.includes(upgradeId)
    ) {
      return res.status(400).json({ error: 'Upgrade already purchased' });
    }

    // Purchase upgrade
    currentSave.gameData.currency -= upgrade.cost;
    if (!currentSave.gameData.unlockedUpgrades)
      currentSave.gameData.unlockedUpgrades = [];
    currentSave.gameData.unlockedUpgrades.push(upgradeId);
    await saveService.updateSave(userId, currentSave);

    return res.json({
      success: true,
      newCurrency: currentSave.gameData.currency,
      message: `Successfully purchased ${upgrade.name}`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to purchase upgrade' });
  }
});

export default router;
