/**
 * Save Manager - Frontend
 * Handles all local save operations and cloud sync
 */

import {
  validateData,
  SaveDataSchema,
  createDefaultSaveData,
  SAVE_VERSION,
} from './saveSchemas.js';

// Storage keys
const STORAGE_KEYS = {
  CURRENT_SAVE: 'deckrift_current_save',
  SAVE_SLOTS: 'deckrift_save_slots',
  SETTINGS: 'deckrift_settings',
  AUTO_SAVE_INTERVAL: 'deckrift_auto_save_interval',
};

// Default settings
const DEFAULT_SETTINGS = {
  autoSaveInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  enableAutoSave: true,
  enableCloudSync: false,
};

class SaveManager {
  constructor() {
    this.autoSaveTimer = null;
    this.saveQueue = [];
    this.isSaving = false;
    this.lastSaveTime = Date.now();
    this.settings = this.loadSettings();
    this.initializeAutoSave();
    this.setupEventListeners();
  }

  /**
   * Initialize auto-save functionality
   */
  initializeAutoSave() {
    if (this.settings.enableAutoSave) {
      this.startAutoSaveTimer();
    }
  }

  /**
   * Start auto-save timer
   */
  startAutoSaveTimer() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.triggerAutoSave();
    }, this.settings.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSaveTimer() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Save before page unload
    window.addEventListener('beforeunload', () => {
      this.triggerSave('page_unload');
    });

    // Listen for game events
    document.addEventListener('gameEvent', (event) => {
      this.handleGameEvent(event.detail);
    });
  }

  /**
   * Handle game events
   */
  handleGameEvent(eventData) {
    const { type, data } = eventData;

    switch (type) {
      case 'level_up':
      case 'permanent_level_up':
      case 'manual_save':
        this.triggerSave(type, data);
        break;
      case 'run_data_update':
        this.saveRunData(data);
        break;
      case 'game_data_update':
        this.saveGameData(data);
        break;
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(settings) }
        : DEFAULT_SETTINGS;
    } catch (error) {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings) {
    try {
      this.settings = { ...this.settings, ...settings };
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(this.settings)
      );

      // Restart auto-save timer if interval changed
      if (this.settings.enableAutoSave) {
        this.startAutoSaveTimer();
      } else {
        this.stopAutoSaveTimer();
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a new save
   */
  createNewSave(saveName = 'Rift Walker', initialData = null) {
    try {
      const saveData = initialData || createDefaultSaveData(saveName);

      // Validate save data
      const validation = validateData(saveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CURRENT_SAVE, JSON.stringify(saveData));

      // Add to save slots
      this.addToSaveSlots(saveData);

      // Trigger cloud sync if enabled
      if (this.settings.enableCloudSync) {
        this.syncToCloud(saveData);
      }

      return { success: true, saveData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load current save
   */
  loadCurrentSave() {
    try {
      const saveData = localStorage.getItem(STORAGE_KEYS.CURRENT_SAVE);
      if (!saveData) {
        return { success: false, error: 'No save data found' };
      }

      const parsedData = JSON.parse(saveData);

      // Validate save data
      const validation = validateData(parsedData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      return { success: true, saveData: parsedData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save current game state
   */
  async saveCurrentGame(runData = null, gameData = null) {
    try {
      // Get current save
      const currentSave = this.loadCurrentSave();
      if (!currentSave.success) {
        return currentSave;
      }

      const saveData = currentSave.saveData;
      const timestamp = Date.now();

      // Update run data if provided
      if (runData) {
        saveData.runData = {
          ...saveData.runData,
          ...runData,
          timestamp,
        };
      }

      // Update game data if provided
      if (gameData) {
        saveData.gameData = {
          ...saveData.gameData,
          ...gameData,
          timestamp,
        };
      }

      // Update main save timestamp
      saveData.timestamp = timestamp;

      // Validate updated save data
      const validation = validateData(saveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CURRENT_SAVE, JSON.stringify(saveData));

      // Update save slots
      this.updateSaveSlot(saveData);

      // Trigger cloud sync if enabled
      if (this.settings.enableCloudSync) {
        this.syncToCloud(saveData);
      }

      this.lastSaveTime = timestamp;
      return { success: true, saveData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save run data
   */
  async saveRunData(runData) {
    try {
      const currentSave = this.loadCurrentSave();
      if (!currentSave.success) {
        return currentSave;
      }

      const saveData = currentSave.saveData;
      saveData.runData = {
        ...saveData.runData,
        ...runData,
        timestamp: Date.now(),
      };

      // Validate and save
      const validation = validateData(saveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_SAVE, JSON.stringify(saveData));
      this.updateSaveSlot(saveData);

      // Trigger cloud sync if enabled
      if (this.settings.enableCloudSync) {
        this.syncToCloud(saveData);
      }

      return { success: true, saveData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save game data
   */
  async saveGameData(gameData) {
    try {
      const currentSave = this.loadCurrentSave();
      if (!currentSave.success) {
        return currentSave;
      }

      const saveData = currentSave.saveData;
      saveData.gameData = {
        ...saveData.gameData,
        ...gameData,
        timestamp: Date.now(),
      };

      // Validate and save
      const validation = validateData(saveData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_SAVE, JSON.stringify(saveData));
      this.updateSaveSlot(saveData);

      // Trigger cloud sync if enabled
      if (this.settings.enableCloudSync) {
        this.syncToCloud(saveData);
      }

      return { success: true, saveData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger save on specific events
   */
  async triggerSave(eventType, data = null) {
    switch (eventType) {
      case 'level_up':
      case 'permanent_level_up':
      case 'manual_save':
      case 'page_unload':
        await this.saveCurrentGame();
        break;
      case 'run_data_update':
        await this.saveRunData(data);
        break;
      case 'game_data_update':
        await this.saveGameData(data);
        break;
      default:
        // Unknown event type - ignore
        break;
    }
  }

  /**
   * Trigger auto-save
   */
  async triggerAutoSave() {
    await this.saveCurrentGame();
  }

  /**
   * Add save to save slots
   */
  addToSaveSlots(saveData) {
    try {
      const slots = this.getSaveSlots();
      const slotId = `slot_${Date.now()}`;

      slots[slotId] = {
        id: slotId,
        name: saveData.saveName,
        timestamp: saveData.timestamp,
        realm: saveData.runData.location.realm,
        level: saveData.runData.location.level,
      };

      localStorage.setItem(STORAGE_KEYS.SAVE_SLOTS, JSON.stringify(slots));
    } catch (error) {
      // Failed to add save to slots
    }
  }

  /**
   * Update save slot
   */
  updateSaveSlot(saveData) {
    try {
      const slots = this.getSaveSlots();

      // Find existing slot or create new one
      let slotId = null;
      for (const [id, slot] of Object.entries(slots)) {
        if (slot.name === saveData.saveName) {
          slotId = id;
          break;
        }
      }

      if (!slotId) {
        slotId = `slot_${Date.now()}`;
      }

      slots[slotId] = {
        id: slotId,
        name: saveData.saveName,
        timestamp: saveData.timestamp,
        realm: saveData.runData.location.realm,
        level: saveData.runData.location.level,
      };

      localStorage.setItem(STORAGE_KEYS.SAVE_SLOTS, JSON.stringify(slots));
    } catch (error) {
      // Failed to update save slot
    }
  }

  /**
   * Get save slots
   */
  getSaveSlots() {
    try {
      const slots = localStorage.getItem(STORAGE_KEYS.SAVE_SLOTS);
      return slots ? JSON.parse(slots) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Load save from slot
   */
  loadSaveFromSlot(slotId) {
    try {
      const slots = this.getSaveSlots();
      const slot = slots[slotId];

      if (!slot) {
        return { success: false, error: 'Save slot not found' };
      }

      // Load the save data
      const saveData = localStorage.getItem(STORAGE_KEYS.CURRENT_SAVE);
      if (!saveData) {
        return { success: false, error: 'No save data found' };
      }

      const parsedData = JSON.parse(saveData);

      // Validate save data
      const validation = validateData(parsedData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      return { success: true, saveData: parsedData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete save slot
   */
  deleteSaveSlot(slotId) {
    try {
      const slots = this.getSaveSlots();
      delete slots[slotId];
      localStorage.setItem(STORAGE_KEYS.SAVE_SLOTS, JSON.stringify(slots));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Export save data
   */
  exportSave() {
    try {
      const saveData = localStorage.getItem(STORAGE_KEYS.CURRENT_SAVE);
      if (!saveData) {
        return { success: false, error: 'No save data to export' };
      }

      const parsedData = JSON.parse(saveData);
      const exportData = {
        ...parsedData,
        exportTimestamp: Date.now(),
        exportVersion: SAVE_VERSION,
      };

      return { success: true, data: exportData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Import save data
   */
  importSave(importData) {
    try {
      let parsedData;

      if (typeof importData === 'string') {
        parsedData = JSON.parse(importData);
      } else {
        parsedData = importData;
      }

      // Validate imported data
      const validation = validateData(parsedData, SaveDataSchema);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Update timestamp and save name
      parsedData.timestamp = Date.now();
      parsedData.saveName = parsedData.saveName || 'Imported Save';

      // Save imported data
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_SAVE,
        JSON.stringify(parsedData)
      );
      this.addToSaveSlots(parsedData);

      return { success: true, saveData: parsedData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync to cloud (API call)
   */
  async syncToCloud(saveData) {
    try {
      const response = await fetch('/save/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saveData }),
      });

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Load from cloud (API call)
   */
  async loadFromCloud() {
    try {
      const response = await fetch('/save/load');
      const result = await response.json();

      if (result.success) {
        // Import the cloud save
        return this.importSave(result.saveData);
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get save status
   */
  getSaveStatus() {
    return {
      hasSave: this.loadCurrentSave().success,
      lastSaveTime: this.lastSaveTime,
      autoSaveEnabled: this.settings.enableAutoSave,
      cloudSyncEnabled: this.settings.enableCloudSync,
      autoSaveInterval: this.settings.autoSaveInterval,
    };
  }

  /**
   * Check if save exists
   */
  hasSave() {
    return this.loadCurrentSave().success;
  }

  /**
   * Clear all save data
   */
  clearAllSaves() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SAVE);
      localStorage.removeItem(STORAGE_KEYS.SAVE_SLOTS);
      this.stopAutoSaveTimer();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create global instance
window.saveManager = new SaveManager();

export default window.saveManager;
