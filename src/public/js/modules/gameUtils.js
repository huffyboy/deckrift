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
import { updateHealthDisplay } from './uiUtils.js';

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

/**
 * Generate a standard 52-card deck with 4 jokers
 * @returns {Array} - Array of card objects with value, suit, and display properties
 */
export function generateStandardDeck() {
  const deck = [];
  const suits = ['♠', '♥', '♦', '♣'];
  const values = [
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
  ];

  // Generate standard 52-card deck
  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        value,
        suit,
        display: `${value}${suit}`,
        code: `${value}${suit}`,
      });
    }
  }

  // For Testing
  // // Add 4 jokers
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
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Add cards to the player's deck
 * @param {Array} playerDeck - Current player deck
 * @param {Array} cardsToAdd - Array of card objects to add
 * @returns {Array} - Updated player deck
 */
export function addCardsToDeck(playerDeck, cardsToAdd) {
  return [...playerDeck, ...cardsToAdd];
}

/**
 * Remove a card from the player's deck
 * @param {Array} playerDeck - Current player deck
 * @param {Object} cardToRemove - Card object to remove
 * @returns {Array} - Updated player deck
 */
export function removeCardFromDeck(playerDeck, cardToRemove) {
  const index = playerDeck.findIndex(
    (card) =>
      card.value === cardToRemove.value && card.suit === cardToRemove.suit
  );

  if (index !== -1) {
    const updatedDeck = [...playerDeck];
    updatedDeck.splice(index, 1);
    return updatedDeck;
  }

  return playerDeck;
}

/**
 * Add jokers to the player's deck
 * @param {Array} playerDeck - Current player deck
 * @param {number} count - Number of jokers to add
 * @returns {Array} - Updated player deck
 */
export function addJokersToDeck(playerDeck, count) {
  const jokers = [];
  for (let i = 0; i < count; i++) {
    jokers.push({
      value: '𝕁',
      suit: '🃏',
      display: '𝕁🃏',
      code: '𝕁',
    });
  }
  return addCardsToDeck(playerDeck, jokers);
}

/**
 * Transfer run currency to save currency when a run ends
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state with currency transferred
 */
export function transferRunCurrencyToSave(gameState) {
  const updatedGameState = { ...gameState };

  // Get current currencies
  const runCurrency = updatedGameState.runData?.runCurrency || 0;
  const currentSaveCurrency = updatedGameState.gameData?.saveCurrency || 0;

  if (runCurrency > 0) {
    // Add run currency to save currency
    updatedGameState.gameData.saveCurrency = currentSaveCurrency + runCurrency;

    // Reset run currency to 0
    updatedGameState.runData.runCurrency = 0;
  }

  return updatedGameState;
}

/**
 * Apply stat changes and handle side effects
 * @param {Object} gameState - Current game state
 * @param {Object} statChanges - Object with stat changes { power: +1, will: -2, etc. }
 * @param {boolean} isTemporary - Whether these are temporary modifiers (true) or permanent stats (false)
 * @returns {Object} Updated game state with current permanent stats and modifiers
 */
export function applyStatChanges(gameState, statChanges, isTemporary = true) {
  const updatedGameState = { ...gameState };

  // Get current stats
  const baseStats = updatedGameState.gameData?.stats || {
    power: 4,
    will: 4,
    craft: 4,
    focus: 4,
  };
  const modifiers = updatedGameState.runData?.statModifiers || {
    power: 0,
    will: 0,
    craft: 0,
    focus: 0,
  };

  // Calculate old total stats
  const oldTotalStats = {
    power: baseStats.power + modifiers.power,
    will: baseStats.will + modifiers.will,
    craft: baseStats.craft + modifiers.craft,
    focus: baseStats.focus + modifiers.focus,
  };

  // Apply changes
  if (isTemporary) {
    // Apply to modifiers
    Object.keys(statChanges).forEach((stat) => {
      if (statChanges[stat] !== 0) {
        modifiers[stat] = (modifiers[stat] || 0) + statChanges[stat];
      }
    });
    updatedGameState.runData.statModifiers = modifiers;
  } else {
    // Apply to permanent stats
    Object.keys(statChanges).forEach((stat) => {
      if (statChanges[stat] !== 0) {
        baseStats[stat] = (baseStats[stat] || 4) + statChanges[stat];
      }
    });
    updatedGameState.gameData.stats = baseStats;
  }

  // Calculate new total stats
  const newTotalStats = {
    power: baseStats.power + modifiers.power,
    will: baseStats.will + modifiers.will,
    craft: baseStats.craft + modifiers.craft,
    focus: baseStats.focus + modifiers.focus,
  };

  // Handle side effects
  Object.keys(statChanges).forEach((stat) => {
    if (statChanges[stat] !== 0) {
      const oldValue = oldTotalStats[stat];
      const newValue = newTotalStats[stat];
      const change = newValue - oldValue;

      // Handle Will changes - affects max HP
      if (stat === 'will' && change !== 0) {
        const newMaxHealth = newValue * 10;

        // Update max health
        updatedGameState.runData.maxHealth = newMaxHealth;

        // If max HP increased, increase current HP by the same amount
        if (change > 0) {
          updatedGameState.runData.health = Math.min(
            updatedGameState.runData.health + change * 10,
            newMaxHealth
          );
        }
        // If max HP decreased, cap current HP to new max
        else if (change < 0) {
          updatedGameState.runData.health = Math.min(
            updatedGameState.runData.health,
            newMaxHealth
          );
        }

        // Update health display if available
        if (typeof updateHealthDisplay === 'function') {
          updateHealthDisplay(
            updatedGameState.runData.health,
            updatedGameState.runData.maxHealth
          );
        }
      }

      // Handle Craft changes - affects inventory capacity
      if (stat === 'craft' && change < 0) {
        const currentEquipmentCount =
          updatedGameState.runData?.equipment?.length || 0;
        const newInventoryCapacity = newValue;

        if (currentEquipmentCount > newInventoryCapacity) {
          // TODO: Implement item removal logic
          // const itemsToRemove = currentEquipmentCount - newInventoryCapacity;
        }
      }

      // Handle Focus changes - affects hand size
      if (stat === 'focus' && change !== 0) {
        // TODO: Implement hand size adjustment logic
      }

      // Handle Power changes - no immediate side effects
      if (stat === 'power' && change !== 0) {
        // No immediate side effects
      }
    }
  });

  return {
    gameState: updatedGameState,
    permanentStats: baseStats,
    statModifiers: modifiers,
    totalStats: newTotalStats,
  };
}
