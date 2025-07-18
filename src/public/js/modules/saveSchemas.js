/**
 * Save Schemas - Frontend
 * Data structure definitions and validation for save data
 */

// Save data version
export const SAVE_VERSION = '1.0.0';

// Base schema validation function
function validateData(data, schema) {
  const errors = [];

  // Check required fields
  for (const [field, config] of Object.entries(schema)) {
    if (
      config.required &&
      (data[field] === undefined || data[field] === null)
    ) {
      errors.push(`Missing required field: ${field}`);
    }

    if (data[field] !== undefined && data[field] !== null) {
      // Type validation
      if (config.type && typeof data[field] !== config.type) {
        errors.push(
          `Invalid type for ${field}: expected ${config.type}, got ${typeof data[field]}`
        );
      }

      // Array validation
      if (config.array && !Array.isArray(data[field])) {
        errors.push(`Invalid type for ${field}: expected array`);
      }

      // Object validation
      if (
        config.object &&
        (typeof data[field] !== 'object' || Array.isArray(data[field]))
      ) {
        errors.push(`Invalid type for ${field}: expected object`);
      }

      // Nested validation
      if (config.schema && typeof data[field] === 'object') {
        const nestedErrors = validateData(data[field], config.schema);
        errors.push(...nestedErrors.map((error) => `${field}.${error}`));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Save data schema
export const SaveDataSchema = {
  version: { required: true, type: 'string' },
  timestamp: { required: true, type: 'number' },
  saveName: { required: true, type: 'string' },
  runData: { required: true, object: true, schema: 'RunDataSchema' },
  gameData: { required: true, object: true, schema: 'GameDataSchema' },
};

// Run data schema (session/temporary data)
export const RunDataSchema = {
  version: { required: true, type: 'string' },
  timestamp: { required: true, type: 'number' },
  map: { required: true, object: true, schema: 'MapSchema' },
  location: { required: true, object: true, schema: 'LocationSchema' },
  fightStatus: { required: true, object: true, schema: 'FightStatusSchema' },
  eventStatus: { required: true, object: true, schema: 'EventStatusSchema' },
  statModifiers: {
    required: true,
    object: true,
    schema: 'StatModifiersSchema',
  },
  equipment: { required: true, array: true },
};

// Game data schema (persistent data)
export const GameDataSchema = {
  version: { required: true, type: 'string' },
  timestamp: { required: true, type: 'number' },
  health: { required: true, type: 'number' },
  maxHealth: { required: true, type: 'number' },
  currency: { required: true, type: 'number' },
  stats: { required: true, object: true, schema: 'StatsSchema' },
  statXP: { required: true, object: true, schema: 'StatXPSchema' },
  unlockedUpgrades: { required: true, array: true },
  unlockedEquipment: { required: true, array: true },
};

// Map schema
export const MapSchema = {
  tiles: { required: true, array: true },
  width: { required: true, type: 'number' },
  height: { required: true, type: 'number' },
};

// Location schema
export const LocationSchema = {
  realm: { required: true, type: 'number' },
  level: { required: true, type: 'number' },
  mapX: { required: true, type: 'number' },
  mapY: { required: true, type: 'number' },
};

// Fight status schema
export const FightStatusSchema = {
  inBattle: { required: true, type: 'boolean' },
  playerHand: { required: true, array: true },
  playerDeck: { required: true, array: true },
  enemyHand: { required: true, array: true },
  enemyDeck: { required: true, array: true },
  enemyStats: { required: true, object: true },
  enemyHealth: { required: true, type: 'number' },
  enemyMaxHealth: { required: true, type: 'number' },
  turn: { required: true, type: 'string' },
};

// Event status schema
export const EventStatusSchema = {
  currentEvent: { required: false, type: 'string' },
  drawnCards: { required: true, array: true },
  eventStep: { required: true, type: 'number' },
  eventPhase: { required: true, type: 'string' },
};

// Stat modifiers schema
export const StatModifiersSchema = {
  power: { required: true, type: 'number' },
  will: { required: true, type: 'number' },
  craft: { required: true, type: 'number' },
  focus: { required: true, type: 'number' },
};

// Stats schema
export const StatsSchema = {
  power: { required: true, type: 'number' },
  will: { required: true, type: 'number' },
  craft: { required: true, type: 'number' },
  focus: { required: true, type: 'number' },
};

// Stat XP schema
export const StatXPSchema = {
  power: { required: true, type: 'number' },
  will: { required: true, type: 'number' },
  craft: { required: true, type: 'number' },
  focus: { required: true, type: 'number' },
};

// Equipment item schema
export const EquipmentItemSchema = {
  type: { required: true, type: 'string' },
  value: { required: true, type: 'string' },
  equipped: { required: false, type: 'boolean' },
};

/**
 * Create default save data
 * @param {string} saveName - Name for the save
 * @returns {Object} - Default save data structure
 */
export function createDefaultSaveData(saveName = 'Rift Walker') {
  const timestamp = Date.now();

  // Generate a basic map for new saves
  const mapTiles = [
    // Player start position
    {
      x: 0,
      y: 0,
      visited: false,
      suit: 'joker',
      value: '𝕁',
      type: 'player-start',
    },
    // Some basic cards for the first row
    {
      x: 1,
      y: 0,
      visited: false,
      suit: 'hearts',
      value: 'A',
      type: 'unknown',
    },
    {
      x: 2,
      y: 0,
      visited: false,
      suit: 'diamonds',
      value: '2',
      type: 'unknown',
    },
    {
      x: 3,
      y: 0,
      visited: false,
      suit: 'clubs',
      value: 'A',
      type: 'unknown',
    },
    {
      x: 4,
      y: 0,
      visited: false,
      suit: 'spades',
      value: '2',
      type: 'unknown',
    },
    {
      x: 5,
      y: 0,
      visited: false,
      suit: 'hearts',
      value: '2',
      type: 'unknown',
    },
    // Joker position
    {
      x: 6,
      y: 0,
      visited: false,
      suit: 'joker',
      value: '𝕁',
      type: 'joker',
    },
  ];

  return {
    version: SAVE_VERSION,
    timestamp,
    saveName,
    runData: {
      version: SAVE_VERSION,
      timestamp,
      map: {
        tiles: mapTiles,
        width: 7,
        height: 1,
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
    gameData: {
      version: SAVE_VERSION,
      timestamp,
      health: 100,
      maxHealth: 100,
      currency: 0,
      stats: {
        power: 1,
        will: 1,
        craft: 1,
        focus: 1,
      },
      statXP: {
        power: 0,
        will: 0,
        craft: 0,
        focus: 0,
      },
      unlockedUpgrades: [],
      unlockedEquipment: [],
    },
  };
}

// Export validation function
export { validateData };
