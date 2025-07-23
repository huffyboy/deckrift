import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  calculateAllXPThresholds,
  getChallengeModifier,
} from '../services/gameUtils.js';
import { getRandomInt } from '../shared/sharedGameUtils.js';
import SaveService from '../services/saveService.js';
import migrationService from '../services/migrationService.js';
import {
  createDefaultSaveData,
  SAVE_VERSION,
  createRunData,
} from '../services/saveSchemas.js';
import { handleRouteError } from '../middlewares/errorHandler.js';
import { createShuffledStandardDeck } from '../services/deckService.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

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

    // Get current save data
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active save found' });
    }

    const saveData = saveResult.saveData;
    const completedRealms = saveData.gameData.completedRealms || [];
    const unlockedRealms = saveData.gameData.unlockedRealms || [1];

    // Add realm to completed list if not already there
    if (!completedRealms.includes(realmId)) {
      completedRealms.push(realmId);
    }

    // Unlock next realm if it exists
    const nextRealmToUnlock = realmId + 1;
    if (nextRealmToUnlock <= 4 && !unlockedRealms.includes(nextRealmToUnlock)) {
      unlockedRealms.push(nextRealmToUnlock);
    }

    // Update save data
    saveData.gameData.completedRealms = completedRealms;
    saveData.gameData.unlockedRealms = unlockedRealms.sort((a, b) => a - b);

    // Save the updated data
    const updateResult = await saveService.updateSave(userId, saveData);
    if (!updateResult.success) {
      return res.status(500).json({ error: 'Failed to update save data' });
    }

    return res.json({
      success: true,
      completedRealms,
      unlockedRealms: saveData.gameData.unlockedRealms,
    });
  } catch (error) {
    return res.status(500).json({
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

    // Get user data and current save
    const user = await User.findById(userId);
    const saveResult = await saveService.loadSave(userId);
    const activeSave = saveResult.success ? saveResult.saveData : null;

    const { REALMS } = await import('../public/js/modules/gameConstants.js');

    // Calculate XP thresholds for each stat
    const stats = activeSave
      ? activeSave.gameData.stats
      : { power: 4, will: 4, craft: 4, focus: 4 };
    const xpThresholds = calculateAllXPThresholds(stats);

    const { HOME_REALM_UPGRADES } = await import(
      '../public/js/modules/gameConstants.js'
    );

    const renderData = {
      title: 'Home Realm - Deckrift',
      user: { username: req.session.username },
      currentUser: {
        displayName: user.displayName || 'Rift Walker',
      },
      activeSave: activeSave,
      gameSave: activeSave ? { ...activeSave, isActive: true } : null,
      unlockedUpgrades: activeSave?.gameData?.upgrades || [],
      unlockedRealms: activeSave?.gameData?.unlockedRealms || [1],
      currency: activeSave?.gameData?.saveCurrency || 0,
      xpThresholds,
      REALMS,
      upgrades: HOME_REALM_UPGRADES,
      purchasedUpgrades: activeSave?.gameData?.upgrades || [],
    };

    return res.render('home-realm', renderData);
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
        '../public/js/modules/gameConstants.js'
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
        },
        {
          type: 'armor',
          value: startingArmor,
        },
      ];

      // Ensure game data is properly initialized
      initialSaveData.gameData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        saveCurrency: 0, // Use saveCurrency instead of currency
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
        throw new Error(
          `Failed to create new save: ${saveResult.error || 'Unknown error'}`
        );
      }

      activeSave = saveResult.saveData;

      // Save selected equipment to metadata for status page reference
      if (!activeSave.metadata) {
        activeSave.metadata = {
          totalPlayTime: 0,
          lastPlayed: new Date(),
          saveSlot: 1,
          lastSelectedEquipment: {
            weapon: startingWeapon,
            armor: startingArmor,
          },
        };
      } else {
        activeSave.metadata.lastSelectedEquipment = {
          weapon: startingWeapon,
          armor: startingArmor,
        };
      }

      // Update the save with metadata using the service layer
      const metadataUpdateResult = await saveService.updateSave(
        userId,
        activeSave
      );
      if (!metadataUpdateResult.success) {
        throw new Error(
          `Failed to update save metadata: ${metadataUpdateResult.error || 'Unknown error'}`
        );
      }

      // Use the updated save for the response
      activeSave = metadataUpdateResult.saveData;
    } else {
      // Check if there's an ongoing run and handle end-of-run logic
      const hasOngoingRun =
        activeSave.runData &&
        (activeSave.runData.runCurrency > 0 ||
          activeSave.runData.location.realm > 0 ||
          activeSave.runData.location.level > 1);

      if (hasOngoingRun) {
        // End the current run and transfer currency
        const endOfRunResult = await saveService.endOfRun(userId, {
          // You can add run results here if needed
          // xpGained: { power: 0, will: 0, craft: 0, focus: 0 },
          // unlockedUpgrades: [],
          // unlockedEquipment: []
        });

        if (!endOfRunResult.success) {
          throw new Error(
            `Failed to end current run: ${endOfRunResult.error || 'Unknown error'}`
          );
        }

        // Update activeSave with the result
        activeSave = endOfRunResult.saveData;
      }

      // Import utility functions and game data
      const { MAP_CARD_SUITS } = await import(
        '../public/js/modules/gameConstants.js'
      );

      // Generate basic overworld map
      const challengeModifier = getChallengeModifier(parseInt(realmId, 10), 1);
      const rows = challengeModifier;

      // Create a grid-based map structure
      const mapTiles = [];

      // Generate actual cards for the map (excluding jokers)
      const availableCards = [];
      // TEST MODE: Change these values to control what events appear on the map
      // Current: Only 7, 8, 9, 10 for testing challenge events
      // Options: ['A'] for boons, ['2'] for banes, ['Q'] for rest, ['7', '8', '9', '10'] for challenges, etc.
      const testCardValues = ['7', '8', '9', '10'];

      // Create a deck of cards (excluding jokers)
      MAP_CARD_SUITS.forEach((suit) => {
        testCardValues.forEach((value) => {
          availableCards.push({ value, suit });
        });
      });

      // Shuffle the cards
      for (let i = availableCards.length - 1; i > 0; i -= 1) {
        const j = getRandomInt(0, i);
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
              type: 'standard',
            });
            cardIndex += 1;
          }
          // Skip empty spaces for non-first/last rows
        }
      }

      // Initialize player deck using deck service
      const playerDeck = createShuffledStandardDeck().map((card) => ({
        value: card.value,
        suit: card.suit,
        type: card.type || 'standard',
      }));

      // Clear run data but preserve game data and generate new map
      activeSave.runData = createRunData({
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
          playerDeck: playerDeck,
        },
        equipment: [
          {
            type: 'weapon',
            value: startingWeapon,
          },
          {
            type: 'armor',
            value: startingArmor,
          },
        ],
      });

      // Update save in database
      const updateResult = await saveService.updateSave(userId, activeSave);
      if (!updateResult.success) {
        throw new Error(
          `Failed to update save: ${updateResult.error || 'Unknown error'}`
        );
      }

      // Get the updated save data
      const updatedSave = updateResult.saveData;

      // Save selected equipment to metadata for status page reference
      if (!updatedSave.metadata) {
        updatedSave.metadata = {
          totalPlayTime: 0,
          lastPlayed: new Date(),
          saveSlot: 1,
          lastSelectedEquipment: {
            weapon: startingWeapon,
            armor: startingArmor,
          },
        };
      } else {
        updatedSave.metadata.lastSelectedEquipment = {
          weapon: startingWeapon,
          armor: startingArmor,
        };
      }

      // Update the save with metadata
      const finalUpdateResult = await saveService.updateSave(
        userId,
        updatedSave
      );
      if (!finalUpdateResult.success) {
        throw new Error(
          `Failed to update save metadata: ${finalUpdateResult.error || 'Unknown error'}`
        );
      }

      // Use the final updated save for the response
      activeSave = finalUpdateResult.saveData;
    }

    // Redirect to game page
    res.json({
      success: true,
      message: 'New run started successfully',
      saveId: activeSave._id || activeSave.id || null,
      redirect: '/game',
    });
  } catch (error) {
    return handleRouteError(error, req, res, 'new-run', true);
  }
});

// Start new game (GET route for direct access)
router.get('/start-game', requireAuth, async (req, res) => {
  const { realm = 1, weapon, armor } = req.query;

  // Redirect to the new game route
  return res.redirect(
    `/game/new?realm=${realm}${weapon ? `&weapon=${weapon}` : ''}${armor ? `&armor=${armor}` : ''}`
  );
});

// Shared function to handle continuing/resuming a run
async function handleContinueRun(userId, responseType = 'json') {
  try {
    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      if (responseType === 'redirect') {
        return { success: false, redirect: '/home-realm' };
      }
      return { success: false, error: 'No active run found' };
    }

    if (responseType === 'redirect') {
      return { success: true, redirect: '/game' };
    }

    return {
      success: true,
      saveId: saveResult.saveData._id || saveResult.saveData.id || null,
      redirect: '/game',
    };
  } catch (error) {
    if (responseType === 'redirect') {
      return { success: false, redirect: '/home-realm' };
    }
    return { success: false, error: 'Failed to resume run' };
  }
}

// Resume existing run (POST for AJAX calls)
router.post('/resume-run', requireAuth, async (req, res) => {
  const { userId } = req.session;
  const result = await handleContinueRun(userId, 'json');

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(404).json({ error: result.error });
  }
});

// Continue run (GET route for direct navigation)
router.get('/continue', requireAuth, async (req, res) => {
  const { userId } = req.session;
  const result = await handleContinueRun(userId, 'redirect');

  return res.redirect(result.redirect);
});

// Purchase upgrade
router.post('/purchase-upgrade', requireAuth, async (req, res) => {
  const { userId } = req.session;
  const { upgradeId } = req.body;

  // Get current save data
  const saveResult = await saveService.loadSave(userId);
  if (!saveResult.success) {
    return res.status(404).json({ error: 'No active save found' });
  }

  const saveData = saveResult.saveData;

  // Get upgrade details from game data
  const { HOME_REALM_UPGRADES } = await import(
    '../public/js/modules/gameConstants.js'
  );
  const upgrade = HOME_REALM_UPGRADES[upgradeId];

  if (!upgrade) {
    return res.status(400).json({ error: 'Invalid upgrade' });
  }

  // Check if user has enough currency
  if (saveData.gameData.saveCurrency < upgrade.cost) {
    return res.status(400).json({
      success: false,
      error: 'Insufficient currency',
      required: upgrade.cost,
      current: saveData.gameData.saveCurrency,
    });
  }

  // Check if already purchased
  if (
    saveData.gameData.upgrades &&
    saveData.gameData.upgrades.includes(upgradeId)
  ) {
    return res.status(400).json({ error: 'Upgrade already purchased' });
  }

  // Purchase upgrade
  saveData.gameData.saveCurrency -= upgrade.cost;
  if (!saveData.gameData.upgrades) saveData.gameData.upgrades = [];
  saveData.gameData.upgrades.push(upgradeId);

  // Save the updated save data
  await saveService.updateSave(userId, saveData);

  return res.json({
    success: true,
    message: `Successfully purchased ${upgrade.name}`,
    newCurrency: saveData.gameData.saveCurrency,
  });
});

export default router;
