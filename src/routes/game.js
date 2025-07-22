// Game routes
import express from 'express';
import { calculateAllXPThresholds } from '../services/gameUtils.js';
import SaveService from '../services/saveService.js';
import migrationService from '../services/migrationService.js';
import {
  SAVE_VERSION,
  createFightStatus,
  createDefaultSaveData,
} from '../services/saveSchemas.js';
import { handleRouteError } from '../middlewares/errorHandler.js';
import { createShuffledStandardDeck } from '../services/deckService.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Start a new game
router.get('/new', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { realm = 1, level = 1, weapon, armor } = req.query;

    // Check if migration is needed
    const migrationCheck = await migrationService.checkMigrationNeeded(userId);
    if (migrationCheck.needsMigration) {
      await migrationService.performMigration(
        userId,
        migrationCheck.migrationType
      );
    }

    // Get current save data from database
    const saveResult = await saveService.loadSave(userId);
    let activeSave = saveResult.success ? saveResult.saveData : null;

    // If no save exists, create a new one
    if (!activeSave) {
      // Create initial save data using helper function
      const initialSaveData = createDefaultSaveData('Rift Walker');

      // Customize the save data for this specific run
      initialSaveData.runData.location.realm = parseInt(realm, 10);
      initialSaveData.runData.location.level = parseInt(level, 10);
      initialSaveData.runData.equipment = [
        {
          type: 'weapon',
          value: weapon || 'sword',
          equipped: true,
        },
        {
          type: 'armor',
          value: armor || 'light',
          equipped: true,
        },
      ];

      // Create new save using save service
      const createResult = await saveService.createNewSave(
        userId,
        initialSaveData
      );
      if (!createResult.success) {
        throw new Error(
          `Failed to create new save: ${createResult.error || 'Unknown error'}`
        );
      }

      activeSave = createResult.saveData;
    } else {
      // Import utility functions and game data
      const { getChallengeModifier } = await import('../services/gameUtils.js');
      const { MAP_CARD_SUITS } = await import(
        '../public/js/modules/gameData.js'
      );

      // Calculate health based on Will stat (10 HP per Will point)
      const baseWill = activeSave.gameData.stats.will || STARTING_STATS.will;
      const willModifier = activeSave.runData.statModifiers?.will || 0;
      const willStat = baseWill + willModifier;
      const calculatedMaxHealth = willStat * 10;

      // Update the save's health to reflect the correct max health
      activeSave.runData.maxHealth = calculatedMaxHealth;
      // If current health is at max, update it too
      if (activeSave.runData.health === activeSave.runData.maxHealth) {
        activeSave.runData.health = calculatedMaxHealth;
      }

      // Initialize player deck using deck service
      const playerDeck = createShuffledStandardDeck().map((card) => ({
        value: card.value,
        suit: card.suit,
        type: card.type || 'standard',
      }));

      // Generate basic overworld map
      const rows = getChallengeModifier(realm, level);

      // Create a grid-based map structure
      const mapTiles = [];

      // Generate actual cards for the map (excluding jokers)
      const availableCards = [];
      // TEST MODE: Change these values to control what events appear on the map
      // Current: Only A for testing boon events
      // Options: ['A'] for boons, ['2'] for banes, ['J', '2'] for mixed, etc.
      const testCardValues = ['A'];

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
              type: 'joker',
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

      // Initialize starting equipment based on user's starting equipment
      const startingEquipment = [];

      // Add starting weapon (default to sword)
      const startingWeapon = 'sword'; // Default weapon
      startingEquipment.push({
        type: 'weapon',
        value: startingWeapon,
        equipped: true,
      });

      // Add starting armor (default to light)
      const startingArmor = 'light'; // Default armor
      startingEquipment.push({
        type: 'armor',
        value: startingArmor,
        equipped: true,
      });

      // Create initial save data using new schema
      const initialSaveData = {
        runData: {
          map: {
            tiles: mapTiles,
            width: 7,
            height: rows,
          },
          location: {
            realm: parseInt(realm, 10),
            level: parseInt(level, 10),
            mapX: 0,
            mapY: 0,
          },
          fightStatus: createFightStatus({
            playerDeck: playerDeck,
          }),
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
          equipment: startingEquipment,
          health: calculatedMaxHealth,
          maxHealth: calculatedMaxHealth,
        },
        gameData: {
          version: SAVE_VERSION,
          timestamp: Date.now(),
          currency: 0,
          stats: activeSave.gameData.stats,
          statXP: activeSave.gameData.statXP,
          unlockedUpgrades: activeSave.gameData.unlockedUpgrades,
          unlockedEquipment: activeSave.gameData.unlockedEquipment,
        },
      };

      // Update save in database
      const updateResult = await saveService.updateSave(
        userId,
        initialSaveData
      );
      if (!updateResult.success) {
        throw new Error(
          `Failed to update save: ${updateResult.error || 'Unknown error'}`
        );
      }

      activeSave = updateResult.saveData;
    }

    // Get upgrades from save data (now per-save)
    const unlockedUpgrades = activeSave?.gameData?.upgrades || [];

    // Import realm data and map constants from gameData.js
    const {
      REALMS,
      MAP_CARD_SUITS,
      MAP_CONSTANTS,
      SHOP_PRICES,
      STARTING_STATS,
    } = await import('../public/js/modules/gameData.js');

    return res.render('game', {
      title: 'Game - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave ? { ...activeSave, isActive: true } : null,
      unlockedUpgrades,
      REALMS,
      MAP_CARD_SUITS,
      MAP_CONSTANTS,
      SHOP_PRICES,
      STARTING_STATS,
    });
  } catch (error) {
    return handleRouteError(error, req, res, 'game-new', false);
  }
});

// Continue game
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;

    // Check if migration is needed
    const migrationCheck = await migrationService.checkMigrationNeeded(
      userId,
      userId
    );
    if (migrationCheck.needsMigration) {
      await migrationService.performMigration(
        userId,
        userId,
        migrationCheck.migrationType
      );
    }

    // Load current save
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      // No save found, redirect to new game
      return res.redirect('/game/new');
    }

    const saveData = saveResult.saveData;

    // Get upgrades from save data (now per-save)
    const unlockedUpgrades = saveData?.gameData?.upgrades || [];

    // Import realm data and map constants from gameData.js
    const { REALMS, MAP_CONSTANTS, SHOP_PRICES } = await import(
      '../public/js/modules/gameData.js'
    );

    // Calculate XP thresholds for each stat
    const xpThresholds = calculateAllXPThresholds(saveData.gameData.stats);

    return res.render('game', {
      title: 'Game - Deckrift',
      user: { username: req.session.username },
      gameSave: saveData ? { ...saveData, isActive: true } : null,
      unlockedUpgrades,
      currency: saveData?.runData?.runCurrency || 0,
      xpThresholds,
      // Pass constants for frontend use
      REALMS,
      MAP_CONSTANTS,
      SHOP_PRICES,
    });
  } catch (error) {
    return next(error);
  }
});

// API endpoint to get current game state
router.get('/state', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;

    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    return res.json({
      success: true,
      gameState: {
        ...saveResult.saveData,
        currency: saveResult.saveData?.gameData?.saveCurrency || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// API endpoint to update game state
router.post('/update-game-state', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;
    const { gameState } = req.body; // Extract gameState from the request body

    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Update the save with the new game state
    if (gameState.runData) {
      saveResult.saveData.runData = gameState.runData;
    }
    if (gameState.gameData) {
      saveResult.saveData.gameData = gameState.gameData;
    }

    await saveService.updateSave(userId, saveResult.saveData);

    return res.json({
      success: true,
      message: 'Game state updated successfully',
    });
  } catch (error) {
    return next(error);
  }
});

// API endpoint to end current run
router.post('/end-run', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;
    const { reason, finalStats } = req.body;

    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Mark save as inactive
    saveResult.saveData.isActive = false;
    saveResult.saveData.endedAt = new Date();
    saveResult.saveData.endReason = reason;
    saveResult.saveData.finalStats = finalStats;
    await saveService.updateSave(userId, saveResult.saveData);

    // Update user statistics (removed totalRuns and bestScore tracking)
    // const user = await User.findById(userId);
    // if (user) {
    //   // Removed: user.totalRuns = (user.totalRuns || 0) + 1;
    //   // Removed: if (finalStats && finalStats.score > (user.bestScore || 0)) {
    //   // Removed:   user.bestScore = finalStats.score;
    //   // Removed: }
    //   // Removed: await user.save();
    // }

    return res.json({
      success: true,
      redirect: '/game-over',
    });
  } catch (error) {
    return next(error);
  }
});

// API endpoint to save game progress
router.post('/save', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;
    const { gameState } = req.body;

    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Update save with current state
    Object.assign(saveResult.saveData, gameState);
    saveResult.saveData.lastSaved = new Date();
    await saveService.updateSave(userId, saveResult.saveData);

    return res.json({
      success: true,
      message: 'Game saved successfully',
    });
  } catch (error) {
    return next(error);
  }
});

// API endpoint to update player deck
router.post('/update-deck', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;
    const { deck } = req.body;

    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Update the player deck
    saveResult.saveData.runData.playerDeck = deck;
    await saveService.updateSave(userId, saveResult.saveData);

    return res.json({
      success: true,
      message: 'Player deck updated successfully',
    });
  } catch (error) {
    return next(error);
  }
});

// Temporary route to clear game saves for testing
router.post('/clear-saves', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;

    await saveService.deleteSave(userId);

    return res.json({ success: true, message: 'All saves cleared' });
  } catch (error) {
    return next(error);
  }
});

// Temporary route to regenerate map for current game
router.post('/regenerate-map', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.session;

    const saveResult = await saveService.loadSave(userId);

    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Import realm data and map constants from gameData.js
    const { MAP_CARD_VALUES, MAP_CARD_SUITS } = await import(
      '../public/js/modules/gameData.js'
    );

    // Import utility functions from server-side gameUtils.js
    const { getChallengeModifier } = await import('../services/gameUtils.js');

    // Generate basic overworld map
    const rows = getChallengeModifier(
      saveResult.saveData.runData.location.realm,
      saveResult.saveData.runData.location.level
    );

    // Create a grid-based map structure
    const mapTiles = [];

    // Generate actual cards for the map (excluding jokers)
    const availableCards = [];

    // Create a deck of cards (excluding jokers)
    MAP_CARD_SUITS.forEach((suit) => {
      MAP_CARD_VALUES.forEach((value) => {
        availableCards.push(`${value}${suit}`);
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
            visited: false,
            suit: 'joker',
            value: '𝕁',
            type: 'joker',
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
          const actualCard = availableCards[cardIndex] || '?';

          // Parse the card string into components
          let cardValue, cardSuit;
          if (actualCard.length === 2) {
            cardValue = actualCard[0];
            cardSuit = actualCard[1];
          } else if (actualCard.length === 3) {
            cardValue = actualCard.substring(0, 2); // "10"
            cardSuit = actualCard[2];
          } else {
            cardValue = '?';
            cardSuit = '?';
          }

          mapTiles.push({
            x: col,
            y: row,
            visited: false,
            suit: cardSuit,
            value: cardValue,
            type: 'standard',
          });
          cardIndex += 1;
        }
        // Empty space for non-first/last rows
      }
    }

    // Update the save with the new map
    saveResult.saveData.runData.map.tiles = mapTiles;
    await saveService.updateSave(userId, saveResult.saveData);

    return res.json({
      success: true,
      message: 'Map regenerated successfully',
      mapRows: mapTiles.length,
      cardsPlaced: cardIndex,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
