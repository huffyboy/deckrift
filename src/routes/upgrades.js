import express from 'express';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { calculateAllXPThresholds } from '../services/gameUtils.js';

const router = express.Router();

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

    // Get current profile
    let currentProfile = await Profile.findOne({
      userId,
      isActive: true,
    });

    // If no active profile, get the first profile or create a default one
    if (!currentProfile) {
      currentProfile = await Profile.findOne({ userId });
      if (!currentProfile) {
        // Create a default profile
        currentProfile = new Profile({
          userId,
          profileName: 'Default Profile',
          isActive: true,
        });
        await currentProfile.save();
      } else {
        // Set the first profile as active
        currentProfile.isActive = true;
        await currentProfile.save();
      }
    }

    // Get unlocked upgrades
    const unlockedUpgrades = user.upgrades || [];

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
    const xpThresholds = calculateAllXPThresholds(currentProfile || {});

    return res.render('upgrades', {
      title: 'Upgrades - Deckrift',
      user: { username: req.session.username },
      currentProfile,
      unlockedUpgrades,
      availableUpgrades,
      currency: user.currency || 0,
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

    // Get upgrade details from game data
    const { HOME_REALM_UPGRADES } = await import(
      '../public/js/modules/gameData.js'
    );
    const upgrade = HOME_REALM_UPGRADES[upgradeId];

    if (!upgrade) {
      return res.status(400).json({ error: 'Invalid upgrade' });
    }

    // Check if user can afford it
    if (user.currency < upgrade.cost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Check if already purchased
    if (user.upgrades && user.upgrades.includes(upgradeId)) {
      return res.status(400).json({ error: 'Upgrade already purchased' });
    }

    // Purchase upgrade
    user.currency -= upgrade.cost;
    if (!user.upgrades) user.upgrades = [];
    user.upgrades.push(upgradeId);
    await user.save();

    return res.json({
      success: true,
      newCurrency: user.currency,
      message: `Successfully purchased ${upgrade.name}`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to purchase upgrade' });
  }
});

export default router;
