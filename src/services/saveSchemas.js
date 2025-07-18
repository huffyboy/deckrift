/**
 * Save Data Schemas
 * Defines the structure and validation for save data
 */

// Save data version for compatibility
export const SAVE_VERSION = '1.0.0';

/**
 * Tile Schema
 * Represents a single tile on the map
 */
export const TileSchema = {
  x: { type: 'number', required: true },
  y: { type: 'number', required: true },
  visited: { type: 'boolean', default: false },
  suit: {
    type: 'string',
    enum: ['hearts', 'diamonds', 'clubs', 'spades', 'joker'],
    required: true,
  },
  value: {
    type: 'string',
    enum: [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
      'A',
      '𝕁',
    ],
    required: true,
  },
};

/**
 * Location Schema
 * Represents player's current position
 */
export const LocationSchema = {
  realm: { type: 'number', required: true, min: 1, max: 4 },
  level: { type: 'number', required: true, min: 1 },
  mapX: { type: 'number', required: true, min: 0 },
  mapY: { type: 'number', required: true, min: 0 },
};

/**
 * Stat Modifiers Schema
 * Temporary stat bonuses/penalties
 */
export const StatModifiersSchema = {
  power: { type: 'number', default: 0 },
  will: { type: 'number', default: 0 },
  craft: { type: 'number', default: 0 },
  focus: { type: 'number', default: 0 },
};

/**
 * Equipment Item Schema
 * Represents a single equipment item
 */
export const EquipmentItemSchema = {
  type: {
    type: 'string',
    enum: ['weapon', 'armor', 'artifact'],
    required: true,
  },
  value: { type: 'string', required: true }, // e.g., 'light', 'sword', 'hammer', 'heavy', 'needle'
  equipped: { type: 'boolean', default: false },
};

/**
 * Fight Status Schema
 * Current battle state
 */
export const FightStatusSchema = {
  inBattle: { type: 'boolean', default: false },
  playerHand: { type: 'array', items: 'object', default: [] },
  playerDeck: { type: 'array', items: 'object', default: [] },
  enemyHand: { type: 'array', items: 'object', default: [] },
  enemyDeck: { type: 'array', items: 'object', default: [] },
  enemyStats: { type: 'object', default: {} },
  enemyHealth: { type: 'number', default: 0 },
  enemyMaxHealth: { type: 'number', default: 0 },
  turn: { type: 'string', enum: ['player', 'enemy'], default: 'player' },
};

/**
 * Event Status Schema
 * Current event progress
 */
export const EventStatusSchema = {
  currentEvent: { type: 'object', default: null },
  drawnCards: { type: 'array', items: 'object', default: [] },
  eventStep: { type: 'number', default: 0 },
  eventPhase: { type: 'string', default: 'start' },
};

/**
 * Map Schema
 * Current map state
 */
export const MapSchema = {
  tiles: { type: 'array', items: TileSchema, default: [] },
  width: { type: 'number', required: true },
  height: { type: 'number', required: true },
};

/**
 * Run Data Schema
 * Temporary/Session Data
 */
export const RunDataSchema = {
  version: { type: 'string', required: true },
  timestamp: { type: 'number', required: true },
  map: MapSchema,
  location: LocationSchema,
  fightStatus: FightStatusSchema,
  eventStatus: EventStatusSchema,
  statModifiers: StatModifiersSchema,
  equipment: { type: 'array', items: EquipmentItemSchema, default: [] },
};

/**
 * Game Data Schema
 * Persistent Data
 */
export const GameDataSchema = {
  version: { type: 'string', required: true },
  timestamp: { type: 'number', required: true },
  health: { type: 'number', required: true, min: 0 },
  maxHealth: { type: 'number', required: true, min: 1 },
  currency: { type: 'number', required: true, min: 0 },
  stats: {
    power: { type: 'number', required: true, min: 1 },
    will: { type: 'number', required: true, min: 1 },
    craft: { type: 'number', required: true, min: 1 },
    focus: { type: 'number', required: true, min: 1 },
  },
  statXP: {
    power: { type: 'number', required: true, min: 0 },
    will: { type: 'number', required: true, min: 0 },
    craft: { type: 'number', required: true, min: 0 },
    focus: { type: 'number', required: true, min: 0 },
  },
  unlockedUpgrades: { type: 'array', items: 'string', default: [] },
  unlockedEquipment: { type: 'array', items: 'string', default: [] },
};

/**
 * Complete Save Data Schema
 * Combines run data and game data
 */
export const SaveDataSchema = {
  version: { type: 'string', required: true },
  timestamp: { type: 'number', required: true },
  saveName: { type: 'string', required: true },
  runData: RunDataSchema,
  gameData: GameDataSchema,
};

/**
 * Validate data against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Schema to validate against
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateData(data, schema) {
  const errors = [];

  function validateField(value, fieldSchema, fieldPath = '') {
    if (fieldSchema.required && (value === undefined || value === null)) {
      errors.push(`${fieldPath} is required`);
      return false;
    }

    if (value === undefined || value === null) {
      return true; // Optional field
    }

    // Type validation
    if (fieldSchema.type === 'number') {
      if (typeof value !== 'number') {
        errors.push(`${fieldPath} must be a number`);
        return false;
      }
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        errors.push(`${fieldPath} must be >= ${fieldSchema.min}`);
        return false;
      }
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        errors.push(`${fieldPath} must be <= ${fieldSchema.max}`);
        return false;
      }
    } else if (fieldSchema.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${fieldPath} must be a string`);
        return false;
      }
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(
          `${fieldPath} must be one of: ${fieldSchema.enum.join(', ')}`
        );
        return false;
      }
    } else if (fieldSchema.type === 'boolean') {
      if (typeof value !== 'boolean') {
        errors.push(`${fieldPath} must be a boolean`);
        return false;
      }
    } else if (fieldSchema.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${fieldPath} must be an array`);
        return false;
      }
      if (fieldSchema.items) {
        value.forEach((item, index) => {
          validateField(item, fieldSchema.items, `${fieldPath}[${index}]`);
        });
      }
    } else if (fieldSchema.type === 'object') {
      if (typeof value !== 'object' || value === null) {
        errors.push(`${fieldPath} must be an object`);
        return false;
      }
    }

    return true;
  }

  function validateObject(obj, objSchema, path = '') {
    for (const [key, fieldSchema] of Object.entries(objSchema)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      if (!validateField(value, fieldSchema, fieldPath)) {
        continue;
      }

      // Recursively validate nested objects
      if (fieldSchema.type === 'object' && value && typeof value === 'object') {
        validateObject(value, fieldSchema, fieldPath);
      }
    }
  }

  validateObject(data, schema);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create default save data
 * @param {string} saveName - Name for the save
 * @returns {Object} - Default save data structure
 */
export function createDefaultSaveData(saveName = 'Rift Walker') {
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
    timestamp: Date.now(),
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
      unlockedEquipment: ['sword', 'light'], // Starting equipment
    },
  };
}
