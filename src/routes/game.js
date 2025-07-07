import express from 'express';
import {
  getGameStatus,
  saveGame,
  loadGame,
  getGameStats,
  getGameSaves,
  deleteGameSave,
} from '../controllers/gameController.js';
import GameSave from '../models/GameSave.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to calculate XP threshold for a stat level
function calculateXPThreshold(statLevel) {
  const targetLevel = statLevel + 1;
  return 40 * (targetLevel - 4); // Level 4 needs 40 XP to reach level 5, Level 5 needs 80 XP to reach level 6, etc.
}

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Game API endpoints
router.get('/api/game/status/:profileId', getGameStatus);

// Game save endpoints
router.post('/api/game/save', saveGame);

router.get('/api/game/load/:profileId', loadGame);
router.get('/api/game/load/:profileId/:saveId', loadGame);

// Statistics endpoints
router.get('/api/stats/:profileId', getGameStats);

// Game saves management
router.get('/api/game/saves/:profileId', getGameSaves);

router.delete('/api/game/saves/:saveId', deleteGameSave);

// Game page - Main game interface
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get active game save
    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.redirect('/home-realm');
    }

    // Update save health if needed (for existing saves with wrong health)
    if (activeSave.health === 100 && activeSave.maxHealth === 100) {
      const willStat = activeSave.stats?.will || 4;
      const correctHealth = willStat * 10;
      activeSave.health = correctHealth;
      activeSave.maxHealth = correctHealth;
      await activeSave.save();
    }

    // Get user data for upgrades
    const user = await User.findById(userId);
    const unlockedUpgrades = user.upgrades || [];

    // Calculate XP thresholds for each stat
    const xpThresholds = {
      power: calculateXPThreshold(activeSave.stats?.power || 4),
      will: calculateXPThreshold(activeSave.stats?.will || 4),
      craft: calculateXPThreshold(activeSave.stats?.craft || 4),
      control: calculateXPThreshold(activeSave.stats?.control || 4),
    };

    // Import realm data from gameData.js
    const { REALMS, getChallengeModifier } = await import(
      '../public/js/modules/gameData.js'
    );

    // Calculate health based on Will stat (10 HP per Will point)
    const willStat = activeSave.stats?.will || 4;
    const calculatedMaxHealth = willStat * 10;
    const currentHealth = calculatedMaxHealth; // Start with full health

    // Generate basic overworld map
    const challengeModifier = getChallengeModifier(
      activeSave.realm,
      activeSave.level
    );
    const cardsPerLevel = 5;
    const rows = challengeModifier;

    // Create a grid-based map structure
    const map = [];

    // Generate actual cards for the map (excluding jokers)
    const cardValues = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
      'A',
    ];
    const cardSuits = ['♠', '♥', '♦', '♣'];
    const availableCards = [];

    // Create a deck of cards (excluding jokers)
    cardSuits.forEach((suit) => {
      cardValues.forEach((value) => {
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
          mapRow.push({
            id: `${row}-${col}`,
            revealed: false,
            display: actualCard,
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

    // Transform game save data to match template expectations
    const gameState = {
      health: currentHealth,
      maxHealth: calculatedMaxHealth,
      currency: activeSave.currency,
      realmName: REALMS[activeSave.realm]?.name || `Realm ${activeSave.realm}`,
      level: activeSave.level,
      currentScreen: 'overworld', // Always start with overworld screen
      challengeModifier,
      cardsPerLevel,
      map,
      playerPosition: { x: 0, y: 0 }, // Start at top-left corner
      enemy: activeSave.battleState?.enemy || {},
      event: {}, // Will be populated when in event screen
      shop: {
        healCost: 10,
        cardRemovalCost: 25,
        equipment: [],
      },
    };

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
    return res.status(500).render('error', {
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

export default router;
