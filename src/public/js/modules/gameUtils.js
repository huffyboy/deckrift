/**
 * Game utility functions for client-side operations
 * Contains functions that operate on game data rather than static data
 */

import {
  CARD_DISPLAY_SYMBOLS,
  CHALLENGE_MODIFIERS,
  TEXT_TO_VALUE_MAP,
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

 