import Save from '../models/Save.js';
import { SAVE_VERSION } from '../services/saveSchemas.js';

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

    // Get active game save
    const save = await Save.findOne({
      userId,
      isActive: true,
    });

    if (!save) {
      return res.json({
        game: 'Deckrift – Drawn to Dust',
        status: 'active',
        hasActiveGame: false,
        version: process.env.GAME_VERSION || SAVE_VERSION,
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
      runData: save.runData,
      gameData: save.gameData,
      lastSaved: save.metadata.lastPlayed,
      version: process.env.GAME_VERSION || SAVE_VERSION,
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

    const { runData, gameData, saveName } = req.body;

    if (!runData || !gameData) {
      return res.status(400).json({ error: 'Run data and game data required' });
    }

    // Update or create game save
    let save = await Save.findOne({
      userId,
      isActive: true,
    });

    if (save) {
      // Update existing save
      save.runData = runData;
      save.gameData = gameData;
      save.metadata.lastPlayed = new Date();
      if (saveName) save.saveName = saveName;
    } else {
      // Create new save
      save = new Save({
        userId,
        saveName: saveName || 'Auto Save',
        version: SAVE_VERSION,
        isActive: true,
        runData,
        gameData,
      });
    }

    await save.save();

    res.json({
      message: 'Game saved successfully',
      saveId: save._id,
      lastSaved: save.metadata.lastPlayed,
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

    const { saveId } = req.params;

    // Find game save
    const query = { userId };
    if (saveId) {
      query._id = saveId;
    } else {
      query.isActive = true;
    }

    const save = await Save.findOne(query);
    if (!save) {
      return res.status(404).json({ error: 'Game save not found' });
    }

    res.json({
      runData: save.runData,
      gameData: save.gameData,
      saveName: save.saveName,
      lastSaved: save.metadata.lastPlayed,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load game' });
  }
};
