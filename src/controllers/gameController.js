import GameSave from '../models/GameSave.js';
import Profile from '../models/Profile.js';
import Statistics from '../models/Statistics.js';

/**
 * Game Controller
 * Handles game-related API endpoints and business logic
 */

// Game status endpoint
export const getGameStatus = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID required' });
    }

    // Get active game save
    const gameSave = await GameSave.findOne({
      userId,
      profileId,
      isActive: true,
    });

    if (!gameSave) {
      return res.json({
        game: 'Deckrift – Drawn to Dust',
        status: 'active',
        hasActiveGame: false,
        version: process.env.GAME_VERSION || '1.0.0',
        features: [
          'Profile Management',
          'Deck-based Combat',
          'Roguelike Progression',
          'Equipment System',
          'Boss Battles',
          'Artifact Collection',
        ],
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      game: 'Deckrift – Drawn to Dust',
      status: 'active',
      hasActiveGame: true,
      gameState: gameSave.gameState,
      battleState: gameSave.battleState,
      lastSaved: gameSave.lastSaved,
      version: process.env.GAME_VERSION || '1.0.0',
      features: [
        'Profile Management',
        'Deck-based Combat',
        'Roguelike Progression',
        'Equipment System',
        'Boss Battles',
        'Artifact Collection',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game status' });
  }
};

// Save game endpoint
export const saveGame = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { profileId, gameState, battleState, saveName } = req.body;

    if (!profileId || !gameState) {
      return res
        .status(400)
        .json({ error: 'Profile ID and game state required' });
    }

    // Check if profile exists and belongs to user
    const profile = await Profile.findOne({ _id: profileId, userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update or create game save
    let gameSave = await GameSave.findOne({
      userId,
      profileId,
      isActive: true,
    });

    if (gameSave) {
      // Update existing save
      gameSave.gameState = gameState;
      gameSave.battleState = battleState || gameSave.battleState;
      gameSave.lastSaved = new Date();
      if (saveName) gameSave.saveName = saveName;
    } else {
      // Create new save
      gameSave = new GameSave({
        userId,
        profileId,
        saveName: saveName || 'Auto Save',
        gameState,
        battleState: battleState || { inBattle: false },
        isActive: true,
      });
    }

    await gameSave.save();

    // Update profile last played
    profile.lastPlayed = new Date();
    await profile.save();

    res.json({
      message: 'Game saved successfully',
      saveId: gameSave._id,
      lastSaved: gameSave.lastSaved,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save game' });
  }
};

// Load game endpoint
export const loadGame = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { profileId, saveId } = req.params;

    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID required' });
    }

    // Check if profile exists and belongs to user
    const profile = await Profile.findOne({ _id: profileId, userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Find game save
    const query = { userId, profileId };
    if (saveId) {
      query._id = saveId;
    } else {
      query.isActive = true;
    }

    const gameSave = await GameSave.findOne(query);
    if (!gameSave) {
      return res.status(404).json({ error: 'Game save not found' });
    }

    res.json({
      gameState: gameSave.gameState,
      battleState: gameSave.battleState,
      saveName: gameSave.saveName,
      lastSaved: gameSave.lastSaved,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load game' });
  }
};

// Get game statistics endpoint
export const getGameStats = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID required' });
    }

    // Get statistics for the profile
    const statistics = await Statistics.findOne({ userId, profileId });
    if (!statistics) {
      return res.status(404).json({ error: 'Statistics not found' });
    }

    res.json({
      statistics,
      achievements: statistics.achievements,
      performance: {
        winRate: statistics.winRate,
        totalGames: statistics.totalGamesPlayed,
        averageGameTime: statistics.averageGameTime,
        longestGame: statistics.longestGame,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game statistics' });
  }
};

// Get user's game saves
export const getGameSaves = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID required' });
    }

    const saves = await GameSave.find({ userId, profileId })
      .sort({ lastSaved: -1 })
      .select('saveName lastSaved isActive version');

    res.json({ saves });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game saves' });
  }
};

// Delete game save
export const deleteGameSave = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { saveId } = req.params;
    if (!saveId) {
      return res.status(400).json({ error: 'Save ID required' });
    }

    const gameSave = await GameSave.findOne({ _id: saveId, userId });
    if (!gameSave) {
      return res.status(404).json({ error: 'Game save not found' });
    }

    await GameSave.findByIdAndDelete(saveId);

    res.json({ message: 'Game save deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game save' });
  }
};
