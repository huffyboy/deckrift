// ============================================================================
// GAME UTILITIES
// ============================================================================
// Common utility functions for game operations
// ============================================================================

import {
  SUIT_COLORS,
  SUIT_SYMBOL_TO_NAME,
  SUIT_NAME_TO_SYMBOL,
  UI_MESSAGES,
  TEXT_TO_VALUE_MAP,
  MAP_CARD_SUITS,
  MAP_CARD_VALUES,
  ENEMIES,
  SHOP_PRICES,
  BANES,
} from './gameConstants.js';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a suit is red (hearts or diamonds)
 * @param {string} suit - The suit symbol or name
 * @returns {boolean} - True if the suit is red
 */
export function isRedSuit(suit) {
  return SUIT_COLORS[suit] === 'red';
}

/**
 * Check if a suit is black (spades or clubs)
 * @param {string} suit - The suit symbol or name
 * @returns {boolean} - True if the suit is black
 */
export function isBlackSuit(suit) {
  return SUIT_COLORS[suit] === 'black';
}

/**
 * Get suit name from suit symbol
 * @param {string} suitSymbol - The suit symbol (♠, ♥, ♦, ♣)
 * @returns {string} - The suit name (spade, heart, diamond, club)
 */
export function getSuitName(suitSymbol) {
  return SUIT_SYMBOL_TO_NAME[suitSymbol] || suitSymbol;
}

/**
 * Get suit symbol from suit name
 * @param {string} suitName - The suit name (spade, heart, diamond, club)
 * @returns {string} - The suit symbol (♠, ♥, ♦, ♣)
 */
export function getSuitSymbol(suitName) {
  return SUIT_NAME_TO_SYMBOL[suitName] || suitName;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
export function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get a random element from an array
 * @param {Array} array - The array to pick from
 * @returns {*} - A random element from the array
 */
export function getRandomElement(array) {
  if (!array || array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a number with proper pluralization
 * @param {number} count - The count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional, defaults to singular + 's')
 * @returns {string} - Formatted string
 */
export function formatPlural(count, singular, plural = null) {
  if (count === 1) return singular;
  return plural || singular + 's';
}

/**
 * Format a message template by replacing placeholders with values
 * @param {string} template - The message template with {placeholder} syntax
 * @param {Object} values - Object containing values to replace placeholders
 * @returns {string} - Formatted message
 */
export function formatMessage(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}

/**
 * Get a formatted UI message
 * @param {string} category - Message category (e.g., 'EVENTS', 'ENCOUNTERS')
 * @param {string} key - Message key within the category
 * @param {Object} values - Values to format into the message
 * @returns {Object} - Formatted message object with title, message, type, icon
 */
export function getUIMessage(category, key, values = {}) {
  const messageConfig = UI_MESSAGES[category]?.[key];
  if (!messageConfig) {
    return {
      title: 'Unknown Message',
      message: 'Message not found',
      type: 'info',
      icon: '❓',
    };
  }

  const result = { ...messageConfig };

  // Format title and message if they contain placeholders
  if (result.title) {
    result.title = formatMessage(result.title, values);
  }
  if (result.message) {
    result.message = formatMessage(result.message, values);
  }

  return result;
}

/**
 * Get card value from card object or string value
 * @param {Object|string} cardInput - The card object with value property or string value
 * @returns {number} Numeric value of the card
 */
export function getCardValue(cardInput) {
  const value = typeof cardInput === 'string' ? cardInput : cardInput.value;
  return TEXT_TO_VALUE_MAP[value] || parseInt(value) || 0;
}

/**
 * Apply stat changes to game state
 * @param {Object} gameState - Current game state
 * @param {Object} statChanges - Object with stat names as keys and changes as values
 * @param {boolean} isTemporary - Whether the changes are temporary
 * @returns {Object} - Result object with success status and new stats
 */
export function applyStatChanges(gameState, statChanges, isTemporary = false) {
  if (!gameState || !gameState.gameData || !gameState.gameData.stats) {
    return { success: false, error: 'Invalid game state' };
  }

  const result = {
    success: true,
    changes: {},
    newStats: { ...gameState.gameData.stats },
  };

  for (const [statName, change] of Object.entries(statChanges)) {
    if (
      Object.prototype.hasOwnProperty.call(gameState.gameData.stats, statName)
    ) {
      const currentValue = gameState.gameData.stats[statName];
      const newValue = Math.max(1, currentValue + change); // Stats can't go below 1

      result.changes[statName] = {
        old: currentValue,
        new: newValue,
        change,
      };

      result.newStats[statName] = newValue;

      if (!isTemporary) {
        gameState.gameData.stats[statName] = newValue;
      }
    }
  }

  return result;
}

/**
 * Generate a standard 52-card deck
 * @returns {Array} - Array of card objects with value, suit, and display properties
 */
export function generateStandardDeck() {
  const deck = [];

  for (const suit of MAP_CARD_SUITS) {
    for (const value of MAP_CARD_VALUES) {
      deck.push({
        value,
        suit,
        display: `${value}${suit}`,
        code: `${value}${suit}`,
      });
    }
  }

  // Add 4 jokers, uncomment when needed for testing
  // for (let i = 0; i < 4; i++) {
  //   deck.push({
  //     value: '𝕁',
  //     suit: '🃏',
  //     display: '𝕁🃏',
  //     code: '𝕁',
  //   });
  // }

  return deck;
}

/**
 * Shuffle an array of cards
 * @param {Array} deck - Array of card objects
 * @returns {Array} - Shuffled array of card objects
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a random card display for fallback purposes
 * @returns {Object} - Random card object with value, suit, display, and code
 */
export function getRandomCardDisplay() {
  const randomValue = getRandomElement(MAP_CARD_VALUES);
  const randomSuit = getRandomElement(MAP_CARD_SUITS);

  return {
    value: randomValue,
    suit: randomSuit,
    display: `${randomValue}${randomSuit}`,
    code: `${randomValue}${randomSuit}`,
  };
}

/**
 * Convert API card value to internal format
 * @param {string} apiValue - API card value (e.g., 'A', 'K', 'Q', 'J', '10', '9', etc.)
 * @returns {string} - Internal card value
 */
export function convertApiValueToInternal(apiValue) {
  // API uses 'A' for Ace, 'K' for King, etc.
  // Internal format uses the same, so just return as is
  return apiValue;
}

/**
 * Convert internal card value to API format
 * @param {string} internalValue - Internal card value
 * @returns {string} - API card value
 */
export function convertInternalValueToApi(internalValue) {
  // Internal format uses same as API, so just return as is
  return internalValue;
}

/**
 * Convert internal suit to API format
 * @param {string} internalSuit - Internal suit symbol (♠, ♥, ♦, ♣)
 * @returns {string} - API suit symbol
 */
export function convertInternalSuitToApi(internalSuit) {
  const suitMap = {
    '♠': 'S', // Spades
    '♥': 'H', // Hearts
    '♦': 'D', // Diamonds
    '♣': 'C', // Clubs
  };
  return suitMap[internalSuit] || internalSuit;
}

/**
 * Generate enemy stats based on enemy type and challenge modifier
 * @param {string} enemyType - Type of enemy
 * @param {number} challengeModifier - Challenge modifier for the level
 * @returns {Object} - Enemy stats
 */
export function generateEnemyStats(enemyType, challengeModifier = 1) {
  const enemyTemplate = ENEMIES[enemyType];
  if (!enemyTemplate) {
    return {
      name: 'Unknown Enemy',
      health: 10 * challengeModifier,
      attack: 5 * challengeModifier,
      defense: 2 * challengeModifier,
    };
  }

  return {
    name: enemyTemplate.name,
    health: Math.floor(enemyTemplate.health * challengeModifier),
    attack: Math.floor(enemyTemplate.attack * challengeModifier),
    defense: Math.floor(enemyTemplate.defense * challengeModifier),
  };
}

/**
 * Generate boss stats based on challenge modifier
 * @param {number} challengeModifier - Challenge modifier for the level
 * @returns {Object} - Boss stats
 */
export function generateBossStats(challengeModifier = 1) {
  return {
    name: 'Boss',
    health: 50 * challengeModifier,
    attack: 15 * challengeModifier,
    defense: 8 * challengeModifier,
  };
}

/**
 * Generate shop items
 * @returns {Array} - Array of shop items
 */
export function generateShopItems() {
  return [
    { id: 'heal', name: 'Heal', cost: SHOP_PRICES.basicHeal, type: 'heal' },
    {
      id: 'cardRemoval',
      name: 'Remove Card',
      cost: SHOP_PRICES.cardRemoval,
      type: 'cardRemoval',
    },
    {
      id: 'equipment',
      name: 'Equipment',
      cost: SHOP_PRICES.equipmentOne,
      type: 'equipment',
    },
  ];
}

/**
 * Calculate shop costs based on challenge modifier
 * @param {number} challengeModifier - Challenge modifier for the level
 * @returns {Object} - Shop costs
 */
export function calculateShopCosts(challengeModifier = 1) {
  const costs = {};
  for (const [key, baseCost] of Object.entries(SHOP_PRICES)) {
    costs[key] = baseCost + challengeModifier - 1; // +1 per challenge modifier
  }
  return costs;
}

/**
 * Generate a random bane effect
 * @returns {Object} - Random bane effect
 */
export function generateBaneEffect() {
  const baneKeys = Object.keys(BANES);
  const randomBaneKey = baneKeys[Math.floor(Math.random() * baneKeys.length)];
  return BANES[randomBaneKey];
}

// ============================================================================
// DEFAULT EXPORT FOR FRONTEND GENERATION
// ============================================================================

export default {
  isRedSuit,
  isBlackSuit,
  getSuitName,
  getSuitSymbol,
  capitalizeFirst,
  getRandomElement,
  getRandomInt,
  clamp,
  formatPlural,
  formatMessage,
  getUIMessage,
  getCardValue,
  applyStatChanges,
  generateStandardDeck,
  shuffleDeck,
  getRandomCardDisplay,
  convertApiValueToInternal,
  convertInternalValueToApi,
  convertInternalSuitToApi,
  generateEnemyStats,
  generateBossStats,
  generateShopItems,
  calculateShopCosts,
  generateBaneEffect,
};
