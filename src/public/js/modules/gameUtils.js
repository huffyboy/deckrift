/**
 * Game utility functions for client-side operations
 * Contains functions that operate on game data rather than static data
 */

import {
  CARD_DISPLAY_SYMBOLS,
  CHALLENGE_MODIFIERS,
  TEXT_TO_VALUE_MAP,
  API_VALUE_CONVERSION_MAP,
  INTERNAL_SUIT_TO_API_MAP,
} from './gameData.js';

/**
 * Calculate challenge modifier for a given realm and level
 * @param {number} realmId - The realm ID
 * @param {number} level - The level (1-based)
 * @returns {number} The challenge modifier
 */
export function getChallengeModifier(realmId, level) {
  const realmModifiers = CHALLENGE_MODIFIERS[realmId];
  if (!realmModifiers) return 1;

  // Level is 1-based, so subtract 1 for array index
  const levelIndex = level - 1;
  return (
    realmModifiers[levelIndex] || realmModifiers[realmModifiers.length - 1]
  );
}

/**
 * Get a random card display symbol
 * @returns {Object} Random card display object with value, suit, and display
 */
export function getRandomCardDisplay() {
  return CARD_DISPLAY_SYMBOLS[
    Math.floor(Math.random() * CARD_DISPLAY_SYMBOLS.length)
  ];
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
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate enemy stats based on enemy type and challenge modifier
 * @param {string} enemyType - Type of enemy ('power', 'will', 'craft', 'focus')
 * @param {number} challengeModifier - Current challenge modifier
 * @returns {Object} - Enemy stats object
 */
export function generateEnemyStats(enemyType, challengeModifier = 1) {
  const baseStats = { power: 2, will: 2, craft: 2, focus: 2 };

  // Boost the primary stat based on enemy type
  if (enemyType === 'power') baseStats.power += 1;
  else if (enemyType === 'will') baseStats.will += 1;
  else if (enemyType === 'craft') baseStats.craft += 1;
  else if (enemyType === 'focus') baseStats.focus += 1;

  // Randomly distribute challenge modifier values across stats
  const stats = Object.keys(baseStats);
  for (let i = 0; i < challengeModifier; i++) {
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    baseStats[randomStat] += 1;
  }

  return baseStats;
}

/**
 * Generate boss stats based on challenge modifier
 * @param {number} challengeModifier - Current challenge modifier
 * @returns {Object} - Boss stats object
 */
export function generateBossStats(challengeModifier = 1) {
  return {
    power: 2 * challengeModifier,
    will: 2 * challengeModifier,
    craft: 2 * challengeModifier,
    focus: 2 * challengeModifier,
  };
}

/**
 * Generate shop items
 * @returns {Array} - Array of shop item types
 */
export function generateShopItems() {
  return ['heal', 'equipment1', 'equipment2', 'card_removal'];
}

/**
 * Calculate shop costs based on challenge modifier
 * @param {number} challengeModifier - Current challenge modifier
 * @returns {Object} - Shop costs object
 */
export function calculateShopCosts(challengeModifier = 1) {
  return {
    heal: 10 + challengeModifier,
    equipment1: 25 + challengeModifier,
    equipment2: 30 + challengeModifier,
    card_removal: 25 + challengeModifier,
  };
}

/**
 * Generate boon options
 * @returns {Array} - Array of boon types
 */
export function generateBoonOptions() {
  return ['stat_boost', 'artifact', 'currency'];
}

/**
 * Generate bane effect
 * @returns {string} - Bane effect type
 */
export function generateBaneEffect() {
  return 'lose_item';
}

/**
 * Convert API card value to internal format
 * @param {string} apiValue - Card value from Deck of Cards API
 * @returns {string} - Internal card value format
 */
export function convertApiValueToInternal(apiValue) {
  return API_VALUE_CONVERSION_MAP[apiValue] || apiValue;
}

/**
 * Convert internal card value to API format
 * @param {string} internalValue - Internal card value format
 * @returns {string} - API card value format
 */
export function convertInternalValueToApi(internalValue) {
  // Create reverse mapping
  const reverseMap = {};
  Object.entries(API_VALUE_CONVERSION_MAP).forEach(([api, internal]) => {
    reverseMap[internal] = api;
  });
  return reverseMap[internalValue] || internalValue;
}

/**
 * Convert internal suit symbol to API format
 * @param {string} internalSuit - Internal suit symbol (♠, ♥, ♦, ♣)
 * @returns {string} - API suit format (SPADES, HEARTS, DIAMONDS, CLUBS)
 */
export function convertInternalSuitToApi(internalSuit) {
  return INTERNAL_SUIT_TO_API_MAP[internalSuit] || internalSuit;
}
