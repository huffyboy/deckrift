/**
 * Save Service Test
 * Tests the save service functionality
 */

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};

// Mock window for testing
global.window = {
  addEventListener: () => {},
  localStorage: mockLocalStorage,
};

// Mock console for testing
global.console = {
  log: () => {},
  error: () => {},
  warn: () => {},
};

// Import the save service
import saveService from '../src/services/saveService.js';

/**
 * Test save service functionality
 */
async function testSaveService() {
  // Clear any existing data
  mockLocalStorage.clear();

  // Test 1: Create new save
  const newSaveResult = saveService.createNewSave('Test Save');
  if (!newSaveResult.success) {
    return;
  }

  // Test 2: Load current save
  const loadResult = saveService.loadCurrentSave();
  if (!loadResult.success) {
    return;
  }

  // Test 3: Save run data
  const runData = {
    location: {
      realm: 2,
      level: 3,
      mapX: 5,
      mapY: 7,
    },
    equipment: [
      { type: 'weapon', value: 'sword', equipped: true },
      { type: 'armor', value: 'light', equipped: true },
    ],
  };

  await saveService.saveRunData(runData);

  // Test 4: Save game data
  const gameData = {
    health: 75,
    currency: 150,
    stats: {
      power: 5,
      will: 4,
      craft: 6,
      focus: 4,
    },
  };

  await saveService.saveGameData(gameData);

  // Test 5: Get save stats
  saveService.getSaveStats();

  // Test 6: Check if save exists
  saveService.hasSave();

  // Test 7: Export save
  saveService.exportSave();

  // Test 8: Get save slots
  saveService.getSaveSlots();
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testSaveService = testSaveService;
} else {
  // Node.js environment
  testSaveService().catch(() => {});
}

export { testSaveService };
