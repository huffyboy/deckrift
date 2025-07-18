/**
 * Save Service - Backend
 * Coordinates save operations between frontend and database
 */

import { validateData, SaveDataSchema, SAVE_VERSION } from './saveSchemas.js';
import databaseService from './databaseService.js';

// Storage keys (matching frontend)
const STORAGE_KEYS = {
  CURRENT_SAVE: 'deckrift_current_save',
  SAVE_SLOTS: 'deckrift_save_slots',
  SETTINGS: 'deckrift_settings',
  AUTO_SAVE_INTERVAL: 'deckrift_auto_save_interval',
};

class SaveService {
  constructor() {
    this.databaseService = databaseService;
  }

  /**
   * Create a new save (called from frontend)
   */
  async createNewSave(userId, saveData) {
    try {
      // Validate save data
      const validation = validateData(saveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Save to database
      const result = await this.databaseService.saveToDatabase(
        userId,
        saveData
      );

      if (result.success) {
        // Load the saved data to return the full object with _id
        const loadResult = await this.loadSave(userId);
        if (loadResult.success) {
          return { success: true, saveData: loadResult.saveData };
        }
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load save from database (called from frontend)
   */
  async loadSave(userId) {
    try {
      const result = await this.databaseService.loadFromDatabase(userId);

      if (result.success) {
        // Validate loaded data
        const validation = validateData(result.saveData, SaveDataSchema);
        if (!validation.isValid) {
          return { success: false, errors: validation.errors };
        }
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync local save with database (called from frontend)
   */
  async syncWithDatabase(userId, localSaveData) {
    try {
      // Validate save data
      const validation = validateData(localSaveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Sync with database
      const result = await this.databaseService.syncWithDatabase(
        userId,
        localSaveData
      );

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update save data (called from frontend)
   */
  async updateSave(userId, saveData) {
    try {
      // Validate save data
      const validation = validateData(saveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Update in database
      const result = await this.databaseService.saveToDatabase(
        userId,
        saveData
      );

      if (result.success) {
        // Load the updated data to return the full object with _id
        const loadResult = await this.loadSave(userId);
        if (loadResult.success) {
          return { success: true, saveData: loadResult.saveData };
        }
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete save (called from frontend)
   */
  async deleteSave(userId) {
    try {
      const result = await this.databaseService.deleteFromDatabase(userId);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if save exists (called from frontend)
   */
  async hasSave(userId) {
    try {
      const result = await this.databaseService.hasSave(userId);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Export save data (called from frontend)
   */
  async exportSave(userId) {
    try {
      const result = await this.databaseService.loadFromDatabase(userId);

      if (result.success) {
        // Add export metadata
        const exportData = {
          ...result.saveData,
          exportTimestamp: Date.now(),
          exportVersion: SAVE_VERSION,
        };

        return { success: true, data: exportData };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Import save data (called from frontend)
   */
  async importSave(userId, importData) {
    try {
      // Validate imported data
      const validation = validateData(importData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Update timestamp and save name
      importData.timestamp = Date.now();
      importData.saveName = importData.saveName || 'Imported Save';

      // Save to database
      const result = await this.databaseService.saveToDatabase(
        userId,
        importData
      );

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get save slots (called from frontend)
   */
  async getSaveSlots(userId) {
    try {
      const result = await this.databaseService.getSaveSlots(userId);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load save from slot (called from frontend)
   */
  async loadSaveFromSlot(userId, slotId) {
    try {
      const result = await this.databaseService.loadSaveFromSlot(
        userId,
        slotId
      );

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete save slot (called from frontend)
   */
  async deleteSaveSlot(userId, slotId) {
    try {
      const result = await this.databaseService.deleteSaveSlot(userId, slotId);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear run data only (preserves game data)
   * Used when starting a new run
   */
  clearRunData() {
    try {
      const saveResult = this.loadCurrentSave();
      if (saveResult.success) {
        // Keep game data, clear run data
        const updatedSave = {
          ...saveResult.saveData,
          runData: {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            map: {
              tiles: [],
              width: 0,
              height: 0,
            },
            location: {
              realm: 1,
              level: 1,
              mapX: 0,
              mapY: 0,
            },
            fightStatus: {
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
            equipment: [],
          },
        };

        // Save updated data
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_SAVE,
          JSON.stringify(updatedSave)
        );
        return { success: true, saveData: updatedSave };
      }

      return { success: false, error: 'No save to clear' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear game data only (preserves run data)
   * Used when resetting progress
   */
  clearGameData() {
    try {
      const saveResult = this.loadCurrentSave();
      if (saveResult.success) {
        // Keep run data, clear game data
        const updatedSave = {
          ...saveResult.saveData,
          gameData: {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            health: 40,
            maxHealth: 40,
            currency: 0,
            stats: {
              power: 4,
              will: 4,
              craft: 4,
              focus: 4,
            },
            statXP: {
              power: 0,
              will: 0,
              craft: 0,
              focus: 0,
            },
            unlockedUpgrades: [],
            unlockedEquipment: ['sword', 'light'],
          },
        };

        // Save updated data
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_SAVE,
          JSON.stringify(updatedSave)
        );
        return { success: true, saveData: updatedSave };
      }

      return { success: false, error: 'No save to clear' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete entire save (both run and game data)
   * Used when user explicitly wants to delete everything
   */
  deleteEntireSave() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SAVE);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark run as completed (preserves game data)
   * Used when run ends (victory or defeat)
   */
  markRunCompleted() {
    try {
      const saveResult = this.loadCurrentSave();
      if (saveResult.success) {
        // Mark run as completed but keep all data
        const updatedSave = {
          ...saveResult.saveData,
          runData: {
            ...saveResult.saveData.runData,
            completed: true,
            completedAt: Date.now(),
          },
        };

        // Save updated data
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_SAVE,
          JSON.stringify(updatedSave)
        );
        return { success: true, saveData: updatedSave };
      }

      return { success: false, error: 'No save to mark as completed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default SaveService;
