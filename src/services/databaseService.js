/**
 * Database Service
 * Handles all database transactions for cloud saves and cross-device sync
 */

import Save from '../models/Save.js';
import User from '../models/User.js';
import { validateData, SaveDataSchema, SAVE_VERSION } from './saveSchemas.js';

class DatabaseService {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.isSyncing = false;
    this.initializeOnlineDetection();
  }

  /**
   * Initialize online detection
   */
  async initializeOnlineDetection() {
    // Check initial online status
    this.isOnline = await this.isDatabaseAvailable();

    // Set up periodic checks
    setInterval(async () => {
      this.isOnline = await this.isDatabaseAvailable();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check if database is available
   */
  async isDatabaseAvailable() {
    try {
      // Simple ping to check database connection
      await Save.findOne().limit(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save game data to database
   */
  async saveToDatabase(userId, saveData, saveSlot = 1) {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Offline mode - cannot save to database',
        };
      }

      // Validate save data
      const validation = validateData(saveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Find existing save or create new one
      let save = await Save.findOne({
        userId,
        saveSlot,
      });

      if (save) {
        // Update existing save
        save = await this.updateExistingSave(save, saveData);
      } else {
        // Create new save
        save = await this.createNewDatabaseSave(userId, saveData, saveSlot);
      }

      return { success: true, saveId: save._id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update existing database save
   */
  async updateExistingSave(save, saveData) {
    // Update with new save format directly
    save.saveName = saveData.saveName;
    save.runData = saveData.runData;
    save.gameData = saveData.gameData;
    save.version = saveData.version;
    save.metadata.lastPlayed = new Date();

    await save.save();
    return save;
  }

  /**
   * Create new database save
   */
  async createNewDatabaseSave(userId, saveData, saveSlot) {
    const save = new Save({
      userId,
      saveSlot,
      saveName: saveData.saveName,
      version: saveData.version,
      runData: saveData.runData,
      gameData: saveData.gameData,
    });

    await save.save();
    return save;
  }

  /**
   * Load game data from database
   */
  async loadFromDatabase(userId, saveSlot = 1) {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Offline mode - cannot load from database',
        };
      }

      const save = await Save.findOne({
        userId,
        saveSlot,
      });

      if (!save) {
        return {
          success: false,
          error: 'No save found in database for slot ' + saveSlot,
        };
      }

      // Return save data in new format
      const saveData = {
        _id: save._id,
        version: save.version,
        timestamp: save.metadata.lastPlayed.getTime(),
        saveName: save.saveName,
        saveSlot: save.saveSlot,
        runData: save.runData,
        gameData: save.gameData,
      };

      return { success: true, saveData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's save slots from database
   */
  async getSaveSlots(userId) {
    try {
      const saves = await Save.find({ userId })
        .sort({ saveSlot: 1 })
        .select(
          'saveName metadata.lastPlayed saveSlot version runData.location.realm runData.location.level'
        );

      return saves.map((save) => ({
        id: save._id,
        slot: save.saveSlot,
        name: save.saveName,
        timestamp: save.metadata.lastPlayed.getTime(),
        realm: save.runData?.location?.realm || 1,
        level: save.runData?.location?.level || 1,
        version: save.version,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete save from database
   */
  async deleteSave(userId, saveId) {
    try {
      const save = await Save.findOne({ _id: saveId, userId });
      if (!save) {
        return { success: false, error: 'Save not found' };
      }

      await Save.findByIdAndDelete(saveId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync local save with database
   */
  async syncWithDatabase(userId, localSaveData) {
    try {
      if (!this.isOnline) {
        // Queue for later sync
        this.syncQueue.push({ userId, saveData: localSaveData });
        return { success: false, error: 'Offline - queued for sync' };
      }

      // Check for conflicts
      const conflictCheck = await this.checkForConflicts(userId, localSaveData);
      if (conflictCheck.hasConflict) {
        return {
          success: false,
          error: 'Conflict detected',
          conflict: conflictCheck,
        };
      }

      // Save to database
      const result = await this.saveToDatabase(userId, localSaveData);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for conflicts between local and remote saves
   */
  async checkForConflicts(userId, localSaveData) {
    try {
      const remoteSave = await Save.findOne({
        userId,
        isActive: true,
      });

      if (!remoteSave) {
        return { hasConflict: false };
      }

      // Compare timestamps
      const localTimestamp = localSaveData.timestamp;
      const remoteTimestamp = remoteSave.metadata.lastPlayed.getTime();

      if (localTimestamp > remoteTimestamp) {
        return { hasConflict: false }; // Local is newer
      } else if (localTimestamp < remoteTimestamp) {
        return {
          hasConflict: true,
          type: 'remote_newer',
          remoteSave: {
            version: remoteSave.version,
            timestamp: remoteTimestamp,
            saveName: remoteSave.saveName,
            runData: remoteSave.runData,
            gameData: remoteSave.gameData,
          },
        };
      } else {
        return { hasConflict: false }; // Same timestamp
      }
    } catch (error) {
      return { hasConflict: false };
    }
  }

  /**
   * Process queued sync operations
   */
  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      while (this.syncQueue.length > 0) {
        const { userId, saveData } = this.syncQueue.shift();
        await this.syncWithDatabase(userId, saveData);
      }
    } catch (error) {
      // Failed to process sync queue
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get online status
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus() {
    return {
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Migrate old save format to new format
   * This should not happen yet, but is here for future reference
   */
  async migrateOldSave(userId) {
    try {
      // Look for old save format in the database
      const oldSave = await Save.findOne({ userId });

      if (!oldSave) {
        return { success: false, error: 'No old save found to migrate' };
      }

      // Convert old save to new format
      const newSaveData = {
        version: oldSave.version || SAVE_VERSION,
        timestamp: Date.now(),
        saveName: oldSave.saveName || 'Rift Walker',
        runData: {
          version: SAVE_VERSION,
          timestamp: Date.now(),
          map: oldSave.map || { tiles: [], width: 0, height: 0 },
          location: oldSave.location || {
            realm: 1,
            level: 1,
            mapX: 0,
            mapY: 0,
          },
          fightStatus: oldSave.fightStatus || {
            inBattle: false,
            playerHand: [],
            playerDeck: [],
            enemyHand: [],
            enemyDeck: [],
            enemyStats: {},
            enemyHealth: 0,
            enemyMaxHealth: 0,
            turn: 'player',
          },
          eventStatus: oldSave.eventStatus || {
            currentEvent: null,
            drawnCards: [],
            eventStep: 0,
            eventPhase: 'start',
          },
          statModifiers: oldSave.statModifiers || {
            power: 0,
            will: 0,
            craft: 0,
            focus: 0,
          },
          equipment: oldSave.equipment || [],
          health: oldSave.health || 40,
          maxHealth: oldSave.maxHealth || 40,
        },
        gameData: {
          version: SAVE_VERSION,
          timestamp: Date.now(),
          saveCurrency: oldSave.currency || 0,
          stats: oldSave.stats || {
            power: 4,
            will: 4,
            craft: 4,
            focus: 4,
          },
          statXP: oldSave.statXP || {
            power: 0,
            will: 0,
            craft: 0,
            focus: 0,
          },
          unlockedUpgrades: oldSave.unlockedUpgrades || [],
          unlockedEquipment: oldSave.unlockedEquipment || ['sword', 'light'],
        },
      };

      return { success: true, saveData: newSaveData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;
