import express from 'express';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import GameSave from '../models/GameSave.js';
import { requireAuth } from '../middlewares/auth.js';
import { calculateAllXPThresholds } from '../services/gameUtils.js';

const router = express.Router();

// Helper function to update existing saves with correct health values
async function updateSaveHealth(save) {
  if (save.health === 100 && save.maxHealth === 100) {
    // Update to correct health based on Will stat
    const willStat = save.stats?.will || 4;
    const correctHealth = willStat * 10;
    const updatedSave = save;
    updatedSave.health = correctHealth;
    updatedSave.maxHealth = correctHealth;
    await updatedSave.save();
  }
}

// Home Realm page - Main game hub
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

    // Get active game save (if any)
    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    // Update save health if needed
    if (activeSave) {
      await updateSaveHealth(activeSave);
    }

    // Get user's statistics
    const statistics = {
      totalRuns: user.totalRuns || 0,
      bestScore: user.bestScore || 0,
      totalPlaytime: user.totalPlaytime || 0,
      currency: user.currency || 0,
    };

    // Get unlocked upgrades
    const unlockedUpgrades = user.upgrades || [];

    // Import realm data from gameData.js
    const { REALMS } = await import('../public/js/modules/gameData.js');

    // Determine unlocked realms (only first realm unlocked initially)
    const unlockedRealms = [1]; // Only Steel Realm is unlocked initially
    // TODO: Add logic to unlock realms based on user progress
    // Realm 2 unlocked when user beats Realm 1
    // Realm 3 unlocked when user beats Realm 2
    // Realm 4 unlocked when user beats Realm 3

    // Calculate XP thresholds for each stat
    const xpThresholds = calculateAllXPThresholds(currentProfile || {});

    return res.render('home-realm', {
      title: 'Home Realm - Deckrift',
      user: { username: req.session.username },
      currentProfile,
      activeSave,
      gameSave: activeSave, // Add this for navbar consistency
      statistics,
      unlockedUpgrades,
      unlockedRealms,
      currency: user.currency || 0,
      xpThresholds,
      REALMS, // Pass realm data to template
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load Home Realm',
      error,
    });
  }
});

// Start new run
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

    // Deactivate any existing active save
    await GameSave.updateMany({ userId, isActive: true }, { isActive: false });

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

    // Create new game save
    const newSave = new GameSave({
      userId,
      profileId: currentProfile._id,
      saveName: `Run ${Date.now()}`,
      realm: parseInt(realmId, 10),
      level: 1,
      playerPosition: 0,
      equipment: {
        weapon: startingWeapon,
        armor: startingArmor,
      },
      stats: {
        power: 4,
        will: 4,
        craft: 4,
        control: 4,
      },
      statXP: {
        power: 0,
        will: 0,
        craft: 0,
        control: 0,
      },
      health: 40, // Will stat * 10 = 4 * 10 = 40
      maxHealth: 40, // Will stat * 10 = 4 * 10 = 40
      currency: 0,
      deck: [],
      artifacts: [],
      isActive: true,
      createdAt: new Date(),
    });

    await newSave.save();

    return res.json({
      success: true,
      saveId: newSave._id,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to start new run',
    });
  }
});

// Resume existing run
router.post('/resume-run', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({
        error: 'No active run found',
      });
    }

    return res.json({
      success: true,
      saveId: activeSave._id,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to resume run',
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
