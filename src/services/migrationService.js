/**
 * Migration Service
 * Handles migration from old save system to new save system
 */

import SaveService from './saveService.js';
import databaseService from './databaseService.js';
import {
  validateData,
  SaveDataSchema,
  SAVE_VERSION,
  createFightStatus,
} from './saveSchemas.js';

class MigrationService {
  constructor() {
    this.migrationVersion = SAVE_VERSION;
    this.saveService = new SaveService();
  }

  /**
   * Check if migration is needed
   */
  async checkMigrationNeeded(userId) {
    try {
      // Check if user has old database saves
      const hasOldSaves =
        (await databaseService.isDatabaseAvailable()) &&
        (await this.hasOldDatabaseSaves(userId));

      // Check if user has old localStorage saves
      const hasOldLocalSaves = this.hasOldLocalStorageSaves();

      return {
        needsMigration: hasOldSaves || hasOldLocalSaves,
        hasOldDatabaseSaves: hasOldSaves,
        hasOldLocalStorageSaves: hasOldLocalSaves,
        migrationType: this.determineMigrationType(
          hasOldSaves,
          hasOldLocalSaves
        ),
      };
    } catch (error) {
      return { needsMigration: false, error: error.message };
    }
  }

  /**
   * Check if user has old database saves
   * This should not happen yet, but is here for future reference
   */
  async hasOldDatabaseSaves(_userId) {
    return false;
  }

  /**
   * Check if user has old localStorage saves
   */
  hasOldLocalStorageSaves() {
    // localStorage is not available on the server side
    // This should only be called from client-side code
    return false;
  }

  /**
   * Determine migration type
   */
  determineMigrationType(hasOldDatabaseSaves, hasOldLocalStorageSaves) {
    if (hasOldDatabaseSaves && hasOldLocalStorageSaves) {
      return 'both';
    } else if (hasOldDatabaseSaves) {
      return 'database';
    } else if (hasOldLocalStorageSaves) {
      return 'localStorage';
    }
    return 'none';
  }

  /**
   * Perform migration
   */
  async performMigration(userId, migrationType = 'auto') {
    try {
      let migratedData = null;

      // Determine what to migrate
      if (migrationType === 'auto' || migrationType === 'both') {
        // Try database first, then localStorage
        migratedData = await this.migrateFromDatabase(userId);
        if (!migratedData.success) {
          migratedData = await this.migrateFromLocalStorage();
        }
      } else if (migrationType === 'database') {
        migratedData = await this.migrateFromDatabase(userId);
      } else if (migrationType === 'localStorage') {
        migratedData = await this.migrateFromLocalStorage();
      }

      if (!migratedData.success) {
        return { success: false, error: 'No data to migrate' };
      }

      // Create new save with migrated data
      const saveResult = await this.saveService.createNewSave(
        userId,
        migratedData.saveData
      );

      if (!saveResult.success) {
        return {
          success: false,
          error: 'Failed to create new save',
          details: saveResult.errors,
        };
      }

      // Mark migration as complete
      this.markMigrationComplete();

      return {
        success: true,
        saveData: saveResult.saveData,
        migrationType,
        migratedFrom: migratedData.source,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate from old database format
   */
  async migrateFromDatabase(userId) {
    try {
      const oldSave = await databaseService.migrateOldSave(userId);

      if (!oldSave.success) {
        return { success: false, error: oldSave.error };
      }

      return {
        success: true,
        saveData: oldSave.saveData,
        saveName: oldSave.saveData.saveName,
        source: 'database',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate from old localStorage format
   */
  async migrateFromLocalStorage() {
    try {
      // Try different old localStorage formats
      const migrationAttempts = [
        this.migrateOldGameState,
        this.migrateOldPlayerData,
        this.migrateOldSaveData,
      ];

      for (const migrationAttempt of migrationAttempts) {
        const result = await migrationAttempt();
        if (result.success) {
          return result;
        }
      }

      return { success: false, error: 'No valid old save data found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate old game state format
   */
  async migrateOldGameState() {
    try {
      const oldGameState =
        localStorage.getItem('deckrift_game_state') ||
        localStorage.getItem('gameState');

      if (!oldGameState) {
        return { success: false };
      }

      const parsedState = JSON.parse(oldGameState);

      // Convert old format to new format
      const newSaveData = this.convertOldGameState(parsedState);

      // Validate converted data
      const validation = validateData(newSaveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      return {
        success: true,
        saveData: newSaveData,
        saveName: 'Migrated Game State',
        source: 'localStorage_gameState',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate old player data format
   */
  async migrateOldPlayerData() {
    try {
      const oldPlayerData =
        localStorage.getItem('deckrift_player_data') ||
        localStorage.getItem('playerData');

      if (!oldPlayerData) {
        return { success: false };
      }

      const parsedData = JSON.parse(oldPlayerData);

      // Convert old format to new format
      const newSaveData = this.convertOldPlayerData(parsedData);

      // Validate converted data
      const validation = validateData(newSaveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      return {
        success: true,
        saveData: newSaveData,
        saveName: 'Rift Walker',
        source: 'localStorage_playerData',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate old save data format
   */
  async migrateOldSaveData() {
    try {
      const oldSaveData = localStorage.getItem('deckrift_save_data');

      if (!oldSaveData) {
        return { success: false };
      }

      const parsedData = JSON.parse(oldSaveData);

      // Convert old format to new format
      const newSaveData = this.convertOldSaveData(parsedData);

      // Validate converted data
      const validation = validateData(newSaveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      return {
        success: true,
        saveData: newSaveData,
        saveName: 'Rift Walker',
        source: 'localStorage_saveData',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert old game state to new format
   */
  convertOldGameState(oldState) {
    return {
      version: this.migrationVersion,
      timestamp: Date.now(),
      saveName: 'Migrated Game State',
      runData: {
        version: this.migrationVersion,
        timestamp: Date.now(),
        map: {
          tiles: oldState.overworldMap || [],
          width: 0,
          height: 0,
        },
        location: {
          realm: oldState.realm || 1,
          level: oldState.level || 1,
          mapX: oldState.currentPosition?.x || 0,
          mapY: oldState.currentPosition?.y || 0,
        },
        fightStatus: createFightStatus(oldState.battleState),
        eventStatus: {
          currentEvent: oldState.currentEvent,
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
        equipment: oldState.equipment || [],
      },
      gameData: {
        version: this.migrationVersion,
        timestamp: Date.now(),
        health: oldState.health || 40,
        maxHealth: oldState.maxHealth || 40,
        saveCurrency: oldState.currency || 0,
        stats: oldState.stats || { power: 4, will: 4, craft: 4, focus: 4 },
        statXP: oldState.statXP || { power: 0, will: 0, craft: 0, focus: 0 },
        unlockedUpgrades: oldState.unlockedUpgrades || [],
        unlockedEquipment: oldState.unlockedEquipment || ['sword', 'light'],
      },
    };
  }

  /**
   * Convert old player data to new format
   */
  convertOldPlayerData(oldData) {
    return {
      version: this.migrationVersion,
      timestamp: Date.now(),
      saveName: 'Rift Walker',
      runData: {
        version: this.migrationVersion,
        timestamp: Date.now(),
        map: { tiles: [], width: 0, height: 0 },
        location: { realm: 1, level: 1, mapX: 0, mapY: 0 },
        fightStatus: createFightStatus({}),
        eventStatus: {
          currentEvent: null,
          drawnCards: [],
          eventStep: 0,
          eventPhase: 'start',
        },
        statModifiers: { power: 0, will: 0, craft: 0, focus: 0 },
        equipment: [],
      },
      gameData: {
        version: this.migrationVersion,
        timestamp: Date.now(),
        health: oldData.health || 40,
        maxHealth: oldData.maxHealth || 40,
        saveCurrency: oldData.currency || 0,
        stats: oldData.stats || { power: 4, will: 4, craft: 4, focus: 4 },
        statXP: oldData.statXP || { power: 0, will: 0, craft: 0, focus: 0 },
        unlockedUpgrades: oldData.upgrades || [],
        unlockedEquipment: oldData.equipment || ['sword', 'light'],
      },
    };
  }

  /**
   * Convert old save data to new format
   */
  convertOldSaveData(oldData) {
    // This is a generic converter for any old save format
    return {
      version: this.migrationVersion,
      timestamp: Date.now(),
      saveName: 'Rift Walker',
      runData: {
        version: this.migrationVersion,
        timestamp: Date.now(),
        map: { tiles: oldData.map || [], width: 0, height: 0 },
        location: {
          realm: oldData.realm || 1,
          level: oldData.level || 1,
          mapX: oldData.mapX || 0,
          mapY: oldData.mapY || 0,
        },
        fightStatus: createFightStatus(oldData.battleState),
        eventStatus: {
          currentEvent: oldData.currentEvent,
          drawnCards: oldData.drawnCards || [],
          eventStep: oldData.eventStep || 0,
          eventPhase: oldData.eventPhase || 'start',
        },
        statModifiers: oldData.statModifiers || {
          power: 0,
          will: 0,
          craft: 0,
          focus: 0,
        },
        equipment: oldData.equipment || [],
      },
      gameData: {
        version: this.migrationVersion,
        timestamp: Date.now(),
        health: oldData.health || 40,
        maxHealth: oldData.maxHealth || 40,
        saveCurrency: oldData.currency || 0,
        stats: oldData.stats || { power: 4, will: 4, craft: 4, focus: 4 },
        statXP: oldData.statXP || { power: 0, will: 0, craft: 0, focus: 0 },
        unlockedUpgrades: oldData.unlockedUpgrades || [],
        unlockedEquipment: oldData.unlockedEquipment || ['sword', 'light'],
      },
    };
  }

  /**
   * Mark migration as complete
   */
  markMigrationComplete() {
    // localStorage is not available on the server side
    // This should be handled on the client side
  }

  /**
   * Check if migration has been completed
   */
  isMigrationComplete() {
    // localStorage is not available on the server side
    // This should be checked on the client side
    return false;
  }

  /**
   * Get migration info
   */
  getMigrationInfo() {
    // localStorage is not available on the server side
    // This should be handled on the client side
    return { isComplete: false };
  }

  /**
   * Clean up old save data after successful migration
   */
  cleanupOldData() {
    // localStorage is not available on the server side
    // This should be handled on the client side
  }
}

// Create singleton instance
const migrationService = new MigrationService();

export default migrationService;
