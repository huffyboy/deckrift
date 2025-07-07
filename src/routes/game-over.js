import express from 'express';
import GameSave from '../models/GameSave.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to calculate final score
function calculateScore(stats) {
  let score = 0;

  // Base score from levels completed
  score += stats.levelsCompleted * 100;

  // Bonus for XP gained
  score += Math.floor(stats.totalXP / 10);

  // Bonus for cards collected
  score += stats.cardsCollected * 5;

  // Bonus for artifacts found
  score += stats.artifactsFound * 25;

  // Bonus for currency earned
  score += stats.currencyEarned;

  // Time bonus (faster runs get more points)
  if (stats.duration > 0) {
    score += Math.max(0, 1000 - stats.duration * 2);
  }

  return Math.max(0, score);
}

// Helper function to calculate run statistics
function calculateRunStats(gameSave) {
  const stats = {
    duration: 0,
    levelsCompleted: gameSave.level - 1,
    totalXP: 0,
    cardsCollected: gameSave.deck ? gameSave.deck.length : 0,
    artifactsFound: gameSave.artifacts ? gameSave.artifacts.length : 0,
    currencyEarned: gameSave.currency || 0,
    finalScore: 0,
  };

  // Calculate duration if we have start and end times
  if (gameSave.createdAt && gameSave.endedAt) {
    stats.duration = Math.floor(
      (gameSave.endedAt - gameSave.createdAt) / 1000 / 60
    ); // minutes
  }

  // Calculate total XP
  if (gameSave.statXP) {
    stats.totalXP = Object.values(gameSave.statXP).reduce(
      (sum, xp) => sum + (xp || 0),
      0
    );
  }

  // Calculate final score based on various factors
  stats.finalScore = calculateScore(stats);

  return stats;
}

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Game Over page - Run summary and return to home realm
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get the most recent completed save
    const completedSave = await GameSave.findOne({
      userId,
      isActive: false,
      endedAt: { $exists: true },
    }).sort({ endedAt: -1 });

    if (!completedSave) {
      return res.redirect('/home-realm');
    }

    // Calculate run statistics
    const runStats = calculateRunStats(completedSave);

    return res.render('game-over', {
      title: 'Game Over - Deckrift',
      user: { username: req.session.username },
      gameSave: completedSave,
      runStats,
    });
  } catch (error) {
    return res.status(500).render('error', {
      title: 'Error - Deckrift',
      message: 'Failed to load game over page',
      error,
    });
  }
});

// API endpoint to return to home realm
router.post('/return-home', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Update user statistics if needed
    const user = await User.findById(userId);
    if (user) {
      // Any final statistics updates can go here
      await user.save();
    }

    return res.json({
      success: true,
      redirect: '/home-realm',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to return to home realm' });
  }
});

// API endpoint to start new run
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

    // Create new game save
    const newSave = new GameSave({
      userId,
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
      health: 100,
      maxHealth: 100,
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

export default router;
