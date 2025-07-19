/**
 * Frontend Save Data Schemas
 * Defines the structure and validation for save data on the frontend
 */

import { createStandardDeck } from './deckService.js';

// Save data version for compatibility
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
  playerDeck: { required: true, array: true }, // All cards player owns for this run
};

// Game data schema (persistent data)
export const GameDataSchema = {
  version: { required: true, type: 'string' },
  timestamp: { required: true, type: 'number' },
  health: { required: true, type: 'number' },
  maxHealth: { required: true, type: 'number' },
  saveCurrency: { required: true, type: 'number' },
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
  inBattle: { required: true, boolean: true },
  playerHand: { required: true, array: true },
  playerDeck: { required: true, array: true }, // Cards remaining to draw (order matters)
  playerDiscard: { required: true, array: true }, // Cards played/discarded (order matters)
  enemyHand: { required: true, array: true },
  enemyDeck: { required: true, array: true },
  enemyDiscard: { required: true, array: true }, // Enemy cards played/discarded (order matters)
  enemyStats: { required: true, object: true },
  enemyHealth: { required: true, number: true },
  enemyMaxHealth: { required: true, number: true },
  turn: { required: true, string: true, enum: ['player', 'enemy'] },
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
      type: 'standard',
    },
    {
      x: 2,
      y: 0,
      visited: false,
      suit: 'diamonds',
      value: '2',
      type: 'standard',
    },
    {
      x: 3,
      y: 0,
      visited: false,
      suit: 'clubs',
      value: 'A',
      type: 'standard',
    },
    {
      x: 4,
      y: 0,
      visited: false,
      suit: 'spades',
      value: '2',
      type: 'standard',
    },
    {
      x: 5,
      y: 0,
      visited: false,
      suit: 'hearts',
      value: '2',
      type: 'standard',
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
      timestamp: Date.now(),
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
        playerDeck: [], // Cards remaining to draw (order matters)
        playerDiscard: [], // Cards played/discarded (order matters)
        enemyHand: [],
        enemyDeck: [],
        enemyDiscard: [], // Enemy cards played/discarded (order matters)
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
      playerDeck: createStandardDeck(), // All cards player owns for this run
    },
    gameData: {
      version: SAVE_VERSION,
      timestamp,
      health: 40,
      maxHealth: 40,
      saveCurrency: 0,
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

export function createFightStatus(options = {}) {
  return {
    inBattle: false,
    playerHand: [],
    playerDeck: [],
    playerDiscard: [],
    enemyHand: [],
    enemyDeck: [],
    enemyDiscard: [],
    enemyStats: {},
    enemyHealth: 0,
    enemyMaxHealth: 0,
    turn: 'player',
    ...options,
  };
}

// Export validation function
export { validateData };
