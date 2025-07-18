import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middlewares/auth.js';
import { calculateAllXPThresholds } from '../services/gameUtils.js';
import SaveService from '../services/saveService.js';
import migrationService from '../services/migrationService.js';
import {
  createDefaultSaveData,
  SAVE_VERSION,
} from '../services/saveSchemas.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

/**
 * Determine unlocked realms based on user progress
 * @param {Object} user - User object with completion data
 * @returns {Array} Array of unlocked realm IDs
 */
function determineUnlockedRealms(user) {
  const unlockedRealms = user.unlockedRealms || [1]; // Start with first realm
  const completedRealms = user.completedRealms || [];

  // Ensure realm 1 is always unlocked
  if (!unlockedRealms.includes(1)) {
    unlockedRealms.push(1);
  }

  // Check for newly completed realms and unlock next ones
  const maxCompletedRealm = Math.max(...completedRealms, 0);
  const nextRealmToUnlock = maxCompletedRealm + 1;

  // Unlock next realm if it exists and isn't already unlocked
  if (nextRealmToUnlock <= 4 && !unlockedRealms.includes(nextRealmToUnlock)) {
    unlockedRealms.push(nextRealmToUnlock);
  }

  // Sort realms in ascending order
  return unlockedRealms.sort((a, b) => a - b);
}

/**
 * Mark a realm as completed and unlock the next one
 * @param {String} userId - User ID
 * @param {Number} realmId - Realm ID that was completed
 * @returns {Object} Result with success status and updated realms
 */
async function markRealmCompleted(userId, realmId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const completedRealms = user.completedRealms || [];
    const unlockedRealms = user.unlockedRealms || [1];

    // Add realm to completed list if not already there
    if (!completedRealms.includes(realmId)) {
      completedRealms.push(realmId);
    }

    // Unlock next realm if it exists
    const nextRealmToUnlock = realmId + 1;
    if (nextRealmToUnlock <= 4 && !unlockedRealms.includes(nextRealmToUnlock)) {
      unlockedRealms.push(nextRealmToUnlock);
    }

    // Update user
    user.completedRealms = completedRealms;
    user.unlockedRealms = unlockedRealms;
    await user.save();

    return {
      success: true,
      completedRealms,
      unlockedRealms: unlockedRealms.sort((a, b) => a - b),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// API endpoint to mark realm as completed
router.post('/complete-realm', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { realmId } = req.body;

    if (!realmId) {
      return res.status(400).json({
        error: 'Realm ID is required',
      });
    }

    const result = await markRealmCompleted(userId, realmId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to mark realm as completed',
    });
  }
});

// Home Realm page - Main game hub
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Check if migration is needed
    const migrationCheck = await migrationService.checkMigrationNeeded(userId);
    if (migrationCheck.needsMigration) {
      await migrationService.performMigration(
        userId,
        migrationCheck.migrationType
      );
    }

    // Get user's current profile
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/');
    }

    // Get current save data from database
    const saveResult = await saveService.loadSave(userId);
    const activeSave = saveResult.success ? saveResult.saveData : null;

    // Get unlocked upgrades from save data or user
    const unlockedUpgrades = activeSave
      ? activeSave.gameData.unlockedUpgrades
      : user.upgrades || [];

    // Import realm data from gameData.js
    const { REALMS } = await import('../public/js/modules/gameData.js');

    // Determine unlocked realms based on user progress
    const unlockedRealms = determineUnlockedRealms(user);

    // Calculate XP thresholds for each stat
    const stats = activeSave
      ? activeSave.gameData.stats
      : { power: 4, will: 4, craft: 4, focus: 4 };
    const xpThresholds = calculateAllXPThresholds(stats);

    return res.render('home-realm', {
      title: 'Home Realm - Deckrift',
      user: { username: req.session.username },
      currentUser: {
        displayName: user.displayName || 'Rift Walker',
      },
      activeSave,
      gameSave: activeSave, // Add this for navbar consistency
      unlockedUpgrades,
      unlockedRealms,
      currency: activeSave ? activeSave.gameData.currency : user.currency || 0,
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

    // Get current save data from database
    const existingSaveResult = await saveService.loadSave(userId);
    let activeSave = existingSaveResult.success
      ? existingSaveResult.saveData
      : null;

    // If no save exists, create a new one
    if (!activeSave) {
      // Import game data constants
      const { STARTING_STATS } = await import(
        '../public/js/modules/gameData.js'
      );

      // Create initial save data using helper function
      const initialSaveData = createDefaultSaveData('Rift Walker');

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

      // Ensure game data is properly initialized
      initialSaveData.gameData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        health: STARTING_STATS.will * 10, // 10 HP per Will point
        maxHealth: STARTING_STATS.will * 10,
        currency: 0,
        stats: STARTING_STATS,
        statXP: { power: 0, will: 0, craft: 0, focus: 0 },
        unlockedUpgrades: [],
        unlockedEquipment: ['sword', 'light'],
      };

      // Create new save using save service
      const saveResult = await saveService.createNewSave(
        userId,
        initialSaveData
      );
      if (!saveResult.success) {
        return res.status(500).json({
          error: 'Failed to create new save',
        });
      }

      activeSave = saveResult.saveData;
    } else {
      // Import utility functions and game data
      const { getChallengeModifier, generateStandardDeck, shuffleDeck } =
        await import('../services/gameUtils.js');
      const { MAP_CARD_SUITS } = await import(
        '../public/js/modules/gameData.js'
      );

      // Generate basic overworld map
      const challengeModifier = getChallengeModifier(parseInt(realmId, 10), 1);
      const rows = challengeModifier;

      // Create a grid-based map structure
      const mapTiles = [];

      // Generate actual cards for the map (excluding jokers)
      const availableCards = [];
      const testCardValues = ['A', '2'];

      // Create a deck of cards (excluding jokers)
      MAP_CARD_SUITS.forEach((suit) => {
        testCardValues.forEach((value) => {
          availableCards.push({ value, suit });
        });
      });

      // Shuffle the cards
      for (let i = availableCards.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCards[i], availableCards[j]] = [
          availableCards[j],
          availableCards[i],
        ];
      }

      let cardIndex = 0;

      for (let row = 0; row < rows; row += 1) {
        const isFirstRow = row === 0;
        const isLastRow = row === rows - 1;

        for (let col = 0; col < 7; col += 1) {
          // 7 columns: 0-6
          const isPlayerStart = isFirstRow && col === 0;
          const isJokerPosition = isLastRow && col === 6;
          const isCardPosition = col >= 1 && col <= 5;

          if (isPlayerStart) {
            mapTiles.push({
              x: col,
              y: row,
              visited: true, // Player starts here, so it's visited
              revealed: true, // Portal is always visible
              suit: 'joker',
              value: '𝕁',
              type: 'joker', // Changed from 'player-start' to 'joker'
            });
          } else if (isJokerPosition) {
            mapTiles.push({
              x: col,
              y: row,
              visited: false,
              suit: 'joker',
              value: '𝕁',
              type: 'joker',
            });
          } else if (isCardPosition) {
            const actualCard = availableCards[cardIndex] || {
              value: 'A',
              suit: 'hearts',
            };

            mapTiles.push({
              x: col,
              y: row,
              visited: false,
              suit: actualCard.suit,
              value: actualCard.value,
              type: 'unknown',
            });
            cardIndex += 1;
          }
          // Skip empty spaces for non-first/last rows
        }
      }

      // Initialize player deck - standard 52-card deck
      const rawPlayerDeck = shuffleDeck(generateStandardDeck());

      // Convert deck to match database schema (suit, value, type)
      const playerDeck = rawPlayerDeck.map((card) => ({
        suit: card.suit,
        value: card.value,
        type: 'standard',
      }));

      // Clear run data but preserve game data and generate new map
      activeSave.runData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        map: {
          tiles: mapTiles,
          width: 7,
          height: rows,
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
          playerDeck: playerDeck,
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

      // Update save in database
      const updateResult = await saveService.updateSave(userId, activeSave);
      if (!updateResult.success) {
        return res.status(500).json({
          error: 'Failed to update save',
        });
      }
    }

    // Redirect to game page
    res.json({
      success: true,
      message: 'New run started successfully',
      saveId: activeSave._id || activeSave.id || null,
      redirect: '/game',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start new run',
    });
  }
});

// Start new game (GET route for direct access)
router.get('/start-game', requireAuth, async (req, res) => {
  try {
    const { realm = 1, weapon, armor } = req.query;

    // Redirect to the new game route
    return res.redirect(
      `/game/new?realm=${realm}${weapon ? `&weapon=${weapon}` : ''}${armor ? `&armor=${armor}` : ''}`
    );
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to start new game',
    });
  }
});

// Resume existing run
router.post('/resume-run', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.status(404).json({
        error: 'No active run found',
      });
    }

    return res.json({
      success: true,
      saveId: saveResult.saveData._id || saveResult.saveData.id || null,
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
