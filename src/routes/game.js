// Game routes
import express from 'express';
import GameSave from '../models/GameSave.js';
import User from '../models/User.js';
import { calculateAllXPThresholds } from '../services/gameUtils.js';

const router = express.Router();

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
    const { realm = 1, level = 1 } = req.query; // Default to realm 1, level 1

    // Check if there's already an active game and delete it
    const existingActiveSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (existingActiveSave) {
      await GameSave.deleteOne({ _id: existingActiveSave._id });
    }

    // Get user data for upgrades
    const user = await User.findById(userId);
    const unlockedUpgrades = user.upgrades || [];

    // Import realm data and map constants from gameData.js
    const {
      REALMS,
      MAP_CARD_SUITS,
      MAP_CONSTANTS,
      SHOP_PRICES,
      STARTING_STATS,
    } = await import('../public/js/modules/gameData.js');

    // Import utility functions from gameUtils.js
    const { getChallengeModifier } = await import(
      '../public/js/modules/gameUtils.js'
    );

    // Calculate health based on Will stat (10 HP per Will point)
    const willStat = STARTING_STATS.will;
    const calculatedMaxHealth = willStat * 10;

    // Generate basic overworld map
    const challengeModifier = getChallengeModifier(realm, level);
    const rows = challengeModifier;

    // Create a grid-based map structure
    const map = [];

    // Generate actual cards for the map (excluding jokers)
    const availableCards = [];
    const testCardValues = ['J', 'Q'];

    // Create a deck of cards (excluding jokers)
    MAP_CARD_SUITS.forEach((suit) => {
      // MAP_CARD_VALUES.forEach((value) => {
      testCardValues.forEach((value) => {
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
      const mapRow = [];
      const isFirstRow = row === 0;
      const isLastRow = row === rows - 1;

      for (let col = 0; col < 7; col += 1) {
        // 7 columns: 0-6
        const isPlayerStart = isFirstRow && col === 0;
        const isJokerPosition = isLastRow && col === 6;
        const isCardPosition = col >= 1 && col <= 5;

        if (isPlayerStart) {
          mapRow.push({
            id: `${row}-${col}`,
            type: 'player-start',
            position: { x: col, y: row },
            isPlayerStart: true,
          });
        } else if (isJokerPosition) {
          mapRow.push({
            id: `${row}-${col}`,
            type: 'joker',
            position: { x: col, y: row },
            isJoker: true,
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

          mapRow.push({
            id: `${row}-${col}`,
            revealed: false,
            card: {
              value: cardValue,
              suit: cardSuit,
              display: actualCard,
            },
            type: 'unknown',
            position: { x: col, y: row },
            actualCard, // Store the actual card for logging
          });
          cardIndex += 1;
        } else {
          // Empty space for non-first/last rows
          mapRow.push(null);
        }
      }
      map.push(mapRow);
    }

    // Create new game save
    const newGameSave = new GameSave({
      userId,
      profileId: userId, // Use userId as profileId for now
      saveName: `Realm ${realm} - Level ${level}`, // Generate a save name
      realm,
      level,
      health: calculatedMaxHealth,
      maxHealth: calculatedMaxHealth,
      currency: user.currency || 0,
      stats: STARTING_STATS,
      statXP: { power: 0, will: 0, craft: 0, control: 0 },
      map,
      playerPosition: { x: 0, y: 0 },
      isActive: true,
      startedAt: new Date(),
    });

    await newGameSave.save();

    // Transform game save data to match template expectations
    const gameState = {
      health: calculatedMaxHealth,
      maxHealth: calculatedMaxHealth,
      currency: user.currency || 0,
      realmName: REALMS[realm]?.name || `Realm ${realm}`,
      level,
      currentScreen: 'overworld',
      challengeModifier,
      cardsPerLevel: MAP_CONSTANTS.CARDS_PER_LEVEL,
      map,
      playerPosition: { x: 0, y: 0 },
      enemy: {},
      event: {},
      shop: {
        healCost: SHOP_PRICES.basicHeal,
        cardRemovalCost: SHOP_PRICES.cardRemoval,
        equipment: [],
      },
    };

    // Calculate XP thresholds for each stat
    const xpThresholds = calculateAllXPThresholds(STARTING_STATS);

    return res.render('game', {
      title: 'Game - Deckrift',
      user: { username: req.session.username },
      gameState,
      gameSave: newGameSave,
      unlockedUpgrades,
      currency: user.currency || 0,
      xpThresholds,
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to start new game',
      error,
    });
  }
});

// Continue existing game (or show message if no active game)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get active game save
    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      // No active game - show a message instead of redirecting
      return res.render('game', {
        title: 'Game - Deckrift',
        user: { username: req.session.username },
        gameState: {
          currentScreen: 'no-game',
          message: {
            title: 'No Active Adventure',
            subtitle: 'You have not opened a portal yet.',
            description: 'Return to the Home Realm to begin your journey.',
            action: {
              text: 'Go to Home Realm',
              url: '/home-realm',
            },
          },
        },
        gameSave: null,
        unlockedUpgrades: [],
        currency: 0,
        xpThresholds: {},
      });
    }

    // Get user data for upgrades
    const user = await User.findById(userId);
    const unlockedUpgrades = user.upgrades || [];

    // Import realm data and map constants from gameData.js
    const { REALMS, MAP_CONSTANTS, SHOP_PRICES } = await import(
      '../public/js/modules/gameData.js'
    );

    // Import utility functions from gameUtils.js
    const { getChallengeModifier } = await import(
      '../public/js/modules/gameUtils.js'
    );

    // Calculate challenge modifier
    const challengeModifier = getChallengeModifier(
      activeSave.realm,
      activeSave.level
    );

    // Use the existing map from the save (don't regenerate!)
    const map = activeSave.map || [];

    // Transform game save data to match template expectations
    const gameState = {
      health: activeSave.health,
      maxHealth: activeSave.maxHealth,
      currency: activeSave.currency,
      realmName: REALMS[activeSave.realm]?.name || `Realm ${activeSave.realm}`,
      level: activeSave.level,
      currentScreen: activeSave.currentScreen || 'overworld',
      challengeModifier,
      cardsPerLevel: MAP_CONSTANTS.CARDS_PER_LEVEL,
      map,
      playerPosition: activeSave.playerPosition || { x: 0, y: 0 },
      enemy: activeSave.battleState?.enemy || {},
      event: activeSave.currentEvent || {},
      shop: {
        healCost: SHOP_PRICES.basicHeal,
        cardRemovalCost: SHOP_PRICES.cardRemoval,
        equipment: [],
      },
    };

    // Calculate XP thresholds for each stat
    const xpThresholds = calculateAllXPThresholds(activeSave.stats || {});

    return res.render('game', {
      title: 'Game - Deckrift',
      user: { username: req.session.username },
      gameState,
      gameSave: activeSave,
      unlockedUpgrades,
      currency: user.currency || 0,
      xpThresholds,
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load game',
      error,
    });
  }
});

// API endpoint to get current game state
router.get('/state', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    return res.json({
      success: true,
      gameState: activeSave,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get game state' });
  }
});

// API endpoint to update game state
router.post('/state', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { gameState } = req.body;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Update game save with new state
    Object.assign(activeSave, gameState);
    await activeSave.save();

    return res.json({
      success: true,
      message: 'Game state updated',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update game state' });
  }
});

// API endpoint to end current run
router.post('/end-run', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { reason, finalStats } = req.body;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Mark save as inactive
    activeSave.isActive = false;
    activeSave.endedAt = new Date();
    activeSave.endReason = reason;
    activeSave.finalStats = finalStats;
    await activeSave.save();

    // Update user statistics
    const user = await User.findById(userId);
    if (user) {
      user.totalRuns = (user.totalRuns || 0) + 1;
      if (finalStats && finalStats.score > (user.bestScore || 0)) {
        user.bestScore = finalStats.score;
      }
      await user.save();
    }

    return res.json({
      success: true,
      redirect: '/game-over',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to end run' });
  }
});

// API endpoint to save game progress
router.post('/save', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { gameState } = req.body;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Update save with current state
    Object.assign(activeSave, gameState);
    activeSave.lastSaved = new Date();
    await activeSave.save();

    return res.json({
      success: true,
      message: 'Game saved successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save game' });
  }
});

// Temporary route to clear game saves for testing
router.post('/clear-saves', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const result = await GameSave.deleteMany({ userId });

    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear saves' });
  }
});

// Temporary route to regenerate map for current game
router.post('/regenerate-map', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Import realm data and map constants from gameData.js
    const { MAP_CARD_VALUES, MAP_CARD_SUITS } = await import(
      '../public/js/modules/gameData.js'
    );

    // Import utility functions from gameUtils.js
    const { getChallengeModifier } = await import(
      '../public/js/modules/gameUtils.js'
    );

    // Generate basic overworld map
    const challengeModifier = getChallengeModifier(
      activeSave.realm,
      activeSave.level
    );
    const rows = challengeModifier;

    // Create a grid-based map structure
    const map = [];

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
      const mapRow = [];
      const isFirstRow = row === 0;
      const isLastRow = row === rows - 1;

      for (let col = 0; col < 7; col += 1) {
        // 7 columns: 0-6
        const isPlayerStart = isFirstRow && col === 0;
        const isJokerPosition = isLastRow && col === 6;
        const isCardPosition = col >= 1 && col <= 5;

        if (isPlayerStart) {
          mapRow.push({
            id: `${row}-${col}`,
            type: 'player-start',
            position: { x: col, y: row },
            isPlayerStart: true,
          });
        } else if (isJokerPosition) {
          mapRow.push({
            id: `${row}-${col}`,
            type: 'joker',
            position: { x: col, y: row },
            isJoker: true,
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

          mapRow.push({
            id: `${row}-${col}`,
            revealed: false,
            card: {
              value: cardValue,
              suit: cardSuit,
              display: actualCard,
            },
            type: 'unknown',
            position: { x: col, y: row },
            actualCard,
          });
          cardIndex += 1;
        } else {
          // Empty space for non-first/last rows
          mapRow.push(null);
        }
      }
      map.push(mapRow);
    }

    // Update the save with the new map
    activeSave.map = map;
    await activeSave.save();

    return res.json({
      success: true,
      message: 'Map regenerated successfully',
      mapRows: map.length,
      cardsPlaced: cardIndex,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to regenerate map' });
  }
});

export default router;
