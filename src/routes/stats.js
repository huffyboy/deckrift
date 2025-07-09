import express from 'express';
import GameSave from '../models/GameSave.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to get realm name
function getRealmName(realmId) {
  const realmNames = {
    1: 'Steel Realm',
    2: 'Blood Realm',
    3: 'Ash Realm',
    4: 'Speed Realm',
  };
  return realmNames[realmId] || 'Unknown Realm';
}

// Helper function to calculate run score
function calculateRunScore(save) {
  let score = 0;

  // Base score from level reached
  score += (save.level || 1) * 100;

  // Bonus for XP gained
  if (save.statXP) {
    const totalXP = Object.values(save.statXP).reduce(
      (sum, xp) => sum + (xp || 0),
      0
    );
    score += Math.floor(totalXP / 10);
  }

  // Bonus for cards collected
  score += (save.deck ? save.deck.length : 0) * 5;

  // Bonus for artifacts found
  score += (save.artifacts ? save.artifacts.length : 0) * 25;

  // Bonus for currency earned
  score += save.currency || 0;

  // Time bonus (faster runs get more points)
  if (save.createdAt && save.endedAt) {
    const duration = Math.floor((save.endedAt - save.createdAt) / 1000 / 60);
    score += Math.max(0, 1000 - duration * 2);
  }

  return Math.max(0, score);
}

// Helper function to calculate detailed run statistics
function calculateDetailedRunStats(save) {
  const stats = {
    duration: 0,
    levelsCompleted: (save.level || 1) - 1,
    totalXP: 0,
    cardsCollected: save.deck ? save.deck.length : 0,
    artifactsFound: save.artifacts ? save.artifacts.length : 0,
    currencyEarned: save.currency || 0,
    finalScore: 0,
    realmName: getRealmName(save.realm || 1),
    equipmentUsed: save.equipment || [],
    battlesWon: 0, // TODO: Track from battle data
    battlesLost: 0,
    eventsCompleted: 0,
    shopsVisited: 0,
  };

  // Calculate duration
  if (save.createdAt && save.endedAt) {
    stats.duration = Math.floor((save.endedAt - save.createdAt) / 1000 / 60);
  }

  // Calculate total XP
  if (save.statXP) {
    stats.totalXP = Object.values(save.statXP).reduce(
      (sum, xp) => sum + (xp || 0),
      0
    );
  }

  // Calculate final score
  stats.finalScore = calculateRunScore(save);

  return stats;
}

// Helper function to calculate achievements
function calculateAchievements(completedSaves, _user) {
  const achievements = [];

  // First run achievement
  if (completedSaves.length >= 1) {
    achievements.push({
      id: 'first_run',
      name: 'First Steps',
      description: 'Complete your first run',
      unlocked: true,
      progress: 1,
      maxProgress: 1,
    });
  }

  // Multiple runs achievement
  if (completedSaves.length >= 5) {
    achievements.push({
      id: 'veteran',
      name: 'Veteran',
      description: 'Complete 5 runs',
      unlocked: true,
      progress: completedSaves.length,
      maxProgress: 5,
    });
  }

  // High score achievement
  const bestScore = Math.max(
    ...completedSaves.map((save) => calculateRunScore(save))
  );
  if (bestScore >= 1000) {
    achievements.push({
      id: 'high_scorer',
      name: 'High Scorer',
      description: 'Achieve a score of 1000 or higher',
      unlocked: true,
      progress: bestScore,
      maxProgress: 1000,
    });
  }

  return achievements;
}

// Helper function to calculate lifetime statistics
function calculateLifetimeStats(completedSaves, user) {
  const stats = {
    totalRuns: completedSaves.length,
    totalPlaytime: 0,
    bestScore: user.bestScore || 0,
    averageScore: 0,
    totalXP: 0,
    totalCards: 0,
    totalArtifacts: 0,
    totalCurrency: 0,
    realmCompletion: {
      1: 0, // Steel
      2: 0, // Blood
      3: 0, // Ash
      4: 0, // Speed
    },
    favoriteWeapon: null,
    favoriteArmor: null,
  };

  let totalScore = 0;
  const weaponUsage = {};
  const armorUsage = {};

  completedSaves.forEach((save) => {
    // Calculate playtime
    if (save.createdAt && save.endedAt) {
      stats.totalPlaytime += Math.floor(
        (save.endedAt - save.createdAt) / 1000 / 60
      );
    }

    // Calculate score
    const runScore = calculateRunScore(save);
    totalScore += runScore;
    if (runScore > stats.bestScore) {
      stats.bestScore = runScore;
    }

    // Track currency
    stats.totalCurrency += save.currency || 0;

    // Track cards and artifacts
    stats.totalCards += save.deck ? save.deck.length : 0;
    stats.totalArtifacts += save.artifacts ? save.artifacts.length : 0;

    // Track realm completion
    const realm = save.realm || 1;
    stats.realmCompletion[realm] = (stats.realmCompletion[realm] || 0) + 1;

    // Track equipment usage
    if (save.equipment) {
      save.equipment.forEach((item) => {
        if (item.type === 'weapon') {
          weaponUsage[item.name] = (weaponUsage[item.name] || 0) + 1;
        } else if (item.type === 'armor') {
          armorUsage[item.name] = (armorUsage[item.name] || 0) + 1;
        }
      });
    }
  });

  // Calculate averages
  if (completedSaves.length > 0) {
    stats.averageScore = Math.floor(totalScore / completedSaves.length);
  }

  // Find favorite equipment
  const weaponEntries = Object.entries(weaponUsage);
  if (weaponEntries.length > 0) {
    const [favoriteWeapon] = weaponEntries.reduce((a, b) =>
      weaponUsage[a[0]] > weaponUsage[b[0]] ? a : b
    );
    stats.favoriteWeapon = favoriteWeapon;
  }

  const armorEntries = Object.entries(armorUsage);
  if (armorEntries.length > 0) {
    const [favoriteArmor] = armorEntries.reduce((a, b) =>
      armorUsage[a[0]] > armorUsage[b[0]] ? a : b
    );
    stats.favoriteArmor = favoriteArmor;
  }

  return stats;
}

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Stats page - Run history and performance
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/');
    }

    // Get all completed saves for this user
    const completedSaves = await GameSave.find({
      userId,
      isActive: false,
      endedAt: { $exists: true },
    })
      .sort({ endedAt: -1 })
      .limit(20); // Last 20 runs

    // Calculate lifetime statistics
    const lifetimeStats = calculateLifetimeStats(completedSaves, user);

    // Get recent runs for display
    const recentRuns = completedSaves.slice(0, 10).map((save) => ({
      id: save._id,
      realm: save.realm || 1,
      realmName: getRealmName(save.realm || 1),
      levelReached: save.level || 1,
      result: save.endReason === 'victory' ? 'victory' : 'defeat',
      currencyEarned: save.currency || 0,
      enemiesDefeated: 0, // TODO: Track enemies defeated
      duration:
        save.createdAt && save.endedAt
          ? Math.floor((save.endedAt - save.createdAt) / 1000 / 60)
          : 0,
      date: save.endedAt || save.createdAt,
    }));

    return res.render('stats', {
      title: 'Statistics - Deckrift',
      user: { username: req.session.username },
      overallStats: {
        totalRuns: lifetimeStats.totalRuns || 0,
        successfulRuns: lifetimeStats.totalRuns || 0, // TODO: Track victories separately
        winRate: lifetimeStats.totalRuns > 0 ? 100 : 0, // TODO: Calculate actual win rate
        totalPlaytime: lifetimeStats.totalPlaytime || 0,
        totalCurrencyEarned: lifetimeStats.totalCurrency || 0,
        totalEnemiesDefeated: 0, // TODO: Track enemies defeated
      },
      performanceMetrics: {
        averageDamageDealt: 0, // TODO: Calculate from battle data
        averageDamageTaken: 0,
        battleWinRate: 0,
        averageBattleDuration: 0,
        mostPlayedCard: 'None',
        averageCardValue: 0,
        cardsDrawnPerRun: 0,
        cardsPlayedPerRun: 0,
        averageLevelReached:
          lifetimeStats.totalRuns > 0
            ? Math.floor(lifetimeStats.averageScore / 10)
            : 0,
        farthestRealm: 'None',
        eventsCompletedPerRun: 0,
        shopsVisitedPerRun: 0,
      },
      runHistory: recentRuns,
      achievements: [], // TODO: Implement achievements
      equipmentCollection: {
        weapons: [
          { name: 'Sword', owned: true },
          { name: 'Dagger', owned: false },
          { name: 'Bow', owned: false },
          { name: 'Staff', owned: false },
          { name: 'Hammer', owned: false },
          { name: 'Needle', owned: false },
        ],
        armor: [
          { name: 'Light Armor', owned: true },
          { name: 'Medium Armor', owned: false },
          { name: 'Heavy Armor', owned: false },
          { name: 'Shield', owned: false },
        ],
      },
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load statistics',
      error,
    });
  }
});

// API endpoint to get detailed run statistics
router.get('/run/:saveId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { saveId } = req.params;

    const save = await GameSave.findOne({
      _id: saveId,
      userId,
    });

    if (!save) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const runStats = calculateDetailedRunStats(save);

    return res.json({
      success: true,
      runStats,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get run statistics' });
  }
});

// API endpoint to get achievement progress
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const user = await User.findById(userId);
    const completedSaves = await GameSave.find({
      userId,
      isActive: false,
      endedAt: { $exists: true },
    });

    const achievements = calculateAchievements(completedSaves, user);

    return res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get achievements' });
  }
});

export default router;
