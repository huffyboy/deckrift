import GameSave from '../models/GameSave.js';
import Statistics from '../models/Statistics.js';

// Get game data
const getGameData = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const gameData = await GameSave.find({ userId }).sort({ updatedAt: -1 });
    res.json({ gameData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game data' });
  }
  return null;
};

// Save game data
const saveGameData = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { gameState, saveName } = req.body;

    const gameSave = new GameSave({
      userId,
      saveName: saveName || `Save ${new Date().toLocaleString()}`,
      gameState,
      timestamp: new Date(),
    });

    await gameSave.save();
    res.json({ success: true, saveId: gameSave._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save game data' });
  }
  return null;
};

// Get game saves
const getGameSaves = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const saves = await GameSave.find({ userId }).sort({ updatedAt: -1 });
    res.json({ saves });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game saves' });
  }
  return null;
};

// Delete game save
const deleteGameSave = async (req, res) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const save = await GameSave.findOneAndDelete({ _id: id, userId });
    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game save' });
  }
  return null;
};

// Get statistics dashboard
const getStatisticsDashboard = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const stats = await Statistics.findOne({ userId });
    if (!stats) {
      return res.json({ statistics: {} });
    }

    // Calculate additional metrics
    const totalGames = stats.gamesPlayed || 0;
    const winRate =
      totalGames > 0
        ? (((stats.gamesWon || 0) / totalGames) * 100).toFixed(1)
        : 0;
    const avgScore =
      totalGames > 0 ? Math.round((stats.totalScore || 0) / totalGames) : 0;

    res.json({
      statistics: {
        ...stats.toObject(),
        winRate,
        avgScore,
        totalGames,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load statistics' });
  }
  return null;
};

export {
  getGameData,
  saveGameData,
  getGameSaves,
  deleteGameSave,
  getStatisticsDashboard,
};
