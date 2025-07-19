import { generateStandardDeck, shuffleDeck } from './gameUtils.js';

/**
 * Frontend Deck Service
 * Client-side deck operations for the game
 * Mirrors the backend deckService.js functionality
 */

// ============================================================================
// DECK TYPES AND CONSTANTS
// ============================================================================

export const DECK_TYPES = {
  PLAYER_MAIN: 'playerMain', // runData.playerDeck - permanent deck for the run
  PLAYER_BATTLE: 'playerBattle', // fightStatus.playerDeck - cards to draw in combat
  PLAYER_DISCARD: 'playerDiscard', // fightStatus.playerDiscard - cards played/discarded
  ENEMY_BATTLE: 'enemyBattle', // fightStatus.enemyDeck - enemy's combat deck
  ENEMY_DISCARD: 'enemyDiscard', // fightStatus.enemyDiscard - enemy cards played/discarded
  STANDARD: 'standard', // Generated standard 52-card deck
};

export const CARD_TYPES = {
  STANDARD: 'standard',
  JOKER: 'joker',
  FACE: 'face',
  HIGH: 'high',
};

// ============================================================================
// DECK GENERATION
// ============================================================================

/**
 * Generate a standard 52-card deck
 * @returns {Array} Array of card objects
 */
export function createStandardDeck() {
  return generateStandardDeck();
}

/**
 * Generate a shuffled standard deck
 * @returns {Array} Array of shuffled card objects
 */
export function createShuffledStandardDeck() {
  return shuffleDeck(generateStandardDeck());
}

/**
 * Generate a deck with specific card values (for testing)
 * @param {Array} cardValues - Array of card values to include
 * @returns {Array} Array of card objects
 */
export function createCustomDeck(cardValues) {
  const standardDeck = generateStandardDeck();
  return standardDeck.filter((card) => cardValues.includes(card.value));
}

// ============================================================================
// DECK OPERATIONS
// ============================================================================

/**
 * Get a deck from game state by type
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to get
 * @returns {Array} The requested deck
 */
export function getDeck(gameState, deckType) {
  switch (deckType) {
    case DECK_TYPES.PLAYER_MAIN:
      return gameState?.runData?.playerDeck || [];
    case DECK_TYPES.PLAYER_BATTLE:
      return gameState?.runData?.fightStatus?.playerDeck || [];
    case DECK_TYPES.PLAYER_DISCARD:
      return gameState?.runData?.fightStatus?.playerDiscard || [];
    case DECK_TYPES.ENEMY_BATTLE:
      return gameState?.runData?.fightStatus?.enemyDeck || [];
    case DECK_TYPES.ENEMY_DISCARD:
      return gameState?.runData?.fightStatus?.enemyDiscard || [];
    case DECK_TYPES.STANDARD:
      return generateStandardDeck();
    default:
      return [];
  }
}

/**
 * Set a deck in game state by type
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to set
 * @param {Array} deck - The deck to set
 * @returns {Object} Updated game state
 */
export function setDeck(gameState, deckType, deck) {
  const updatedState = { ...gameState };

  switch (deckType) {
    case DECK_TYPES.PLAYER_MAIN:
      if (!updatedState.runData) updatedState.runData = {};
      updatedState.runData.playerDeck = deck;
      break;
    case DECK_TYPES.PLAYER_BATTLE:
      if (!updatedState.runData) updatedState.runData = {};
      if (!updatedState.runData.fightStatus)
        updatedState.runData.fightStatus = {};
      updatedState.runData.fightStatus.playerDeck = deck;
      break;
    case DECK_TYPES.PLAYER_DISCARD:
      if (!updatedState.runData) updatedState.runData = {};
      if (!updatedState.runData.fightStatus)
        updatedState.runData.fightStatus = {};
      updatedState.runData.fightStatus.playerDiscard = deck;
      break;
    case DECK_TYPES.ENEMY_BATTLE:
      if (!updatedState.runData) updatedState.runData = {};
      if (!updatedState.runData.fightStatus)
        updatedState.runData.fightStatus = {};
      updatedState.runData.fightStatus.enemyDeck = deck;
      break;
    case DECK_TYPES.ENEMY_DISCARD:
      if (!updatedState.runData) updatedState.runData = {};
      if (!updatedState.runData.fightStatus)
        updatedState.runData.fightStatus = {};
      updatedState.runData.fightStatus.enemyDiscard = deck;
      break;
    default:
    // Unknown deck type
  }

  return updatedState;
}

/**
 * Add cards to a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to modify
 * @param {Array} cards - Cards to add
 * @returns {Object} Updated game state
 */
export function addCardsToDeck(gameState, deckType, cards) {
  const currentDeck = getDeck(gameState, deckType);
  const updatedDeck = [...currentDeck, ...cards];
  return setDeck(gameState, deckType, updatedDeck);
}

/**
 * Remove a specific card from a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to modify
 * @param {Object} cardToRemove - Card to remove
 * @returns {Object} Updated game state and removed card
 */
export function removeCardFromDeck(gameState, deckType, cardToRemove) {
  const currentDeck = getDeck(gameState, deckType);
  const cardIndex = currentDeck.findIndex(
    (card) =>
      card.value === cardToRemove.value && card.suit === cardToRemove.suit
  );

  if (cardIndex === -1) {
    return { gameState, removedCard: null };
  }

  const updatedDeck = [...currentDeck];
  const removedCard = updatedDeck.splice(cardIndex, 1)[0];
  const updatedState = setDeck(gameState, deckType, updatedDeck);

  return { gameState: updatedState, removedCard };
}

/**
 * Draw a random card from a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to draw from
 * @returns {Object} Updated game state and drawn card
 */
export function drawCardFromDeck(gameState, deckType) {
  const currentDeck = getDeck(gameState, deckType);

  if (currentDeck.length === 0) {
    return { gameState, drawnCard: null };
  }

  const randomIndex = Math.floor(Math.random() * currentDeck.length);
  const drawnCard = currentDeck[randomIndex];
  const updatedDeck = [...currentDeck];
  updatedDeck.splice(randomIndex, 1);

  const updatedState = setDeck(gameState, deckType, updatedDeck);
  return { gameState: updatedState, drawnCard };
}

/**
 * Shuffle a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to shuffle
 * @returns {Object} Updated game state
 */
export function shuffleDeckInGame(gameState, deckType) {
  const currentDeck = getDeck(gameState, deckType);
  const shuffledDeck = shuffleDeck([...currentDeck]);
  return setDeck(gameState, deckType, shuffledDeck);
}

// ============================================================================
// SPECIALIZED DECK OPERATIONS
// ============================================================================

/**
 * Add jokers to a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to modify
 * @param {number} count - Number of jokers to add
 * @returns {Object} Updated game state
 */
export function addJokersToDeck(gameState, deckType, count = 1) {
  const jokers = Array(count)
    .fill(null)
    .map(() => ({
      value: '𝕁',
      suit: '🃏',
      type: 'joker',
    }));

  return addCardsToDeck(gameState, deckType, jokers);
}

/**
 * Get filtered cards from a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to filter
 * @param {Function} filterFunction - Function to filter cards
 * @returns {Array} Filtered cards
 */
export function getFilteredCards(gameState, deckType, filterFunction) {
  const currentDeck = getDeck(gameState, deckType);
  return currentDeck.filter(filterFunction);
}

/**
 * Get high cards (10, J, Q, K, A) from a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to filter
 * @returns {Array} High cards
 */
export function getHighCards(gameState, deckType) {
  return getFilteredCards(gameState, deckType, (card) => {
    const value = card.value;
    return (
      value === '10' ||
      value === 'J' ||
      value === 'Q' ||
      value === 'K' ||
      value === 'A'
    );
  });
}

/**
 * Get face cards (J, Q, K) from a deck
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to filter
 * @returns {Array} Face cards
 */
export function getFaceCards(gameState, deckType) {
  return getFilteredCards(gameState, deckType, (card) => {
    const value = card.value;
    return value === 'J' || value === 'Q' || value === 'K';
  });
}

// ============================================================================
// BATTLE DECK MANAGEMENT
// ============================================================================

/**
 * Initialize battle decks for a new battle
 * @param {Object} gameState - Current game state
 * @param {Array} enemyDeck - Enemy's deck for the battle
 * @returns {Object} Updated game state
 */
export function initializeBattleDecks(gameState, enemyDeck = []) {
  let updatedState = { ...gameState };

  // Copy player's main deck to battle deck
  const playerMainDeck = getDeck(gameState, DECK_TYPES.PLAYER_MAIN);
  updatedState = setDeck(updatedState, DECK_TYPES.PLAYER_BATTLE, [
    ...playerMainDeck,
  ]);

  // Set enemy deck
  updatedState = setDeck(updatedState, DECK_TYPES.ENEMY_BATTLE, [...enemyDeck]);

  return updatedState;
}

/**
 * Clear battle decks after battle ends
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state
 */
export function clearBattleDecks(gameState) {
  let updatedState = { ...gameState };

  // Clear battle decks
  updatedState = setDeck(updatedState, DECK_TYPES.PLAYER_BATTLE, []);
  updatedState = setDeck(updatedState, DECK_TYPES.ENEMY_BATTLE, []);

  return updatedState;
}

// ============================================================================
// DECK UTILITIES
// ============================================================================

/**
 * Get deck size
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to check
 * @returns {number} Number of cards in deck
 */
export function getDeckSize(gameState, deckType) {
  return getDeck(gameState, deckType).length;
}

/**
 * Check if deck is empty
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to check
 * @returns {boolean} True if deck is empty
 */
export function isDeckEmpty(gameState, deckType) {
  return getDeckSize(gameState, deckType) === 0;
}

/**
 * Get deck statistics
 * @param {Object} gameState - Current game state
 * @param {string} deckType - Type of deck to analyze
 * @returns {Object} Deck statistics
 */
export function getDeckStats(gameState, deckType) {
  const deck = getDeck(gameState, deckType);

  const stats = {
    total: deck.length,
    suits: { hearts: 0, diamonds: 0, clubs: 0, spades: 0, jokers: 0 },
    values: {},
    highCards: 0,
    faceCards: 0,
    jokers: 0,
  };

  deck.forEach((card) => {
    // Count suits
    if (card.suit === '🃏') {
      stats.suits.jokers++;
      stats.jokers++;
    } else {
      stats.suits[card.suit.toLowerCase()]++;
    }

    // Count values
    stats.values[card.value] = (stats.values[card.value] || 0) + 1;

    // Count special cards
    if (['10', 'J', 'Q', 'K', 'A'].includes(card.value)) {
      stats.highCards++;
    }
    if (['J', 'Q', 'K'].includes(card.value)) {
      stats.faceCards++;
    }
  });

  return stats;
}

// ============================================================================
// SERVER COMMUNICATION
// ============================================================================

/**
 * Save a deck to the server
 * @param {Array} deck - Deck to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveDeckToServer(deck) {
  try {
    const response = await fetch('/game/update-deck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deck }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success || false;
  } catch (error) {
    return false;
  }
}

/**
 * Update game state on server
 * @param {Object} gameState - Game state to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveGameStateToServer(gameState) {
  try {
    const response = await fetch('/game/update-game-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success || false;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// LEGACY SUPPORT
// ============================================================================

/**
 * Convert old deck structure to new structure
 * @param {Array} oldDeck - Old deck format
 * @returns {Array} New deck format
 */
export function convertLegacyDeck(oldDeck) {
  if (!Array.isArray(oldDeck)) return [];

  return oldDeck.map((card) => {
    if (typeof card === 'string') {
      // Handle string format cards
      const value = card.slice(0, -1);
      const suit = card.slice(-1);
      return { value, suit, type: 'standard' };
    }
    return card;
  });
}
