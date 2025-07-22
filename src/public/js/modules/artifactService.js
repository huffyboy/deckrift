// Artifact service - handles artifact effects and management

import { saveGameStateToServer } from './deckService.js';
import { applyStatChanges } from './gameUtils.js';

// Local saveGameState function to avoid circular imports
async function saveGameState(gameState) {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = await saveGameStateToServer(gameState);

      if (success) {
        return true;
      }
    } catch (error) {
      // Continue to next attempt
    }

    // Wait a bit before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }

  return false;
}

// Import artifact effect constants from game data
import {
  CARD_EFFECTS,
  ARTIFACT_STAT_EFFECTS,
  ACTIVE_EFFECTS,
} from './gameData.js';

/**
 * Apply artifact effects when an artifact is gained
 * @param {string} artifactKey - The artifact key
 * @param {Object} gameState - Current game state
 * @returns {Promise<Object>} - Result of applying effects
 */
export async function applyArtifactEffects(artifactKey, gameState) {
  const result = {
    cardsAdded: [],
    statChanges: {},
    boostsActivated: [],
    success: true,
  };

  try {
    // Get artifact details from game data since equipment only stores basic info
    const { ARTIFACT_DETAILS } = await import('./gameData.js');
    const artifactDetails = ARTIFACT_DETAILS[artifactKey];

    if (!artifactDetails || !artifactDetails.effect) {
      result.success = false;
      result.error = 'Artifact not found or has no effect';
      return result;
    }

    const effect = artifactDetails.effect;

    // 1. Handle card gaining effects
    if (CARD_EFFECTS[effect]) {
      // Handle multi-card effects
      const cardsToAdd = CARD_EFFECTS[effect];
      for (const cardData of cardsToAdd) {
        const addedCard = addCardToDeck(cardData, gameState);
        if (addedCard) {
          result.cardsAdded.push(addedCard);
        }
      }
    }

    // 2. Handle stat boosting effects
    if (ARTIFACT_STAT_EFFECTS[effect]) {
      const statChanges = ARTIFACT_STAT_EFFECTS[effect];
      const statResult = applyStatChanges(gameState, statChanges, true);
      gameState = statResult.gameState;

      // Update result with stat changes
      Object.keys(statChanges).forEach((stat) => {
        result.statChanges[stat] = statChanges[stat];
      });
    }

    // 3. Handle active effects (boosts)
    if (ACTIVE_EFFECTS.includes(effect)) {
      if (!gameState.runData.activeEffects) {
        gameState.runData.activeEffects = [];
      }
      if (!gameState.runData.activeEffects.includes(effect)) {
        gameState.runData.activeEffects.push(effect);
        result.boostsActivated.push(effect);
      }
    }

    // Save the updated game state
    await saveGameState(gameState);

    return result;
  } catch (error) {
    result.success = false;
    result.error = error.message;
    return result;
  }
}

/**
 * Remove artifact effects when an artifact is lost
 * @param {string} artifactKey - The artifact key
 * @param {Object} gameState - Current game state
 * @returns {Promise<Object>} - Result of removing effects
 */
export async function removeArtifactEffects(artifactKey, gameState) {
  const result = {
    cardsRemoved: [],
    statChanges: {},
    boostsDeactivated: [],
    success: true,
  };

  try {
    // Get artifact details from game data since equipment only stores basic info
    const { ARTIFACT_DETAILS } = await import('./gameData.js');
    const artifactDetails = ARTIFACT_DETAILS[artifactKey];

    if (!artifactDetails || !artifactDetails.effect) {
      result.success = false;
      result.error = 'Artifact not found or has no effect';
      return result;
    }

    const effect = artifactDetails.effect;

    // 1. Remove card gaining effects
    if (CARD_EFFECTS[effect]) {
      // Handle multi-card effects
      const cardsToRemove = CARD_EFFECTS[effect];
      for (const cardData of cardsToRemove) {
        const removedCard = removeCardFromDeck(cardData, gameState);
        if (removedCard) {
          result.cardsRemoved.push(removedCard);
        }
      }
    }

    // 2. Remove stat boosting effects
    if (ARTIFACT_STAT_EFFECTS[effect]) {
      const statChanges = ARTIFACT_STAT_EFFECTS[effect];
      // Create negative stat changes for removal
      const negativeStatChanges = {};
      Object.keys(statChanges).forEach((stat) => {
        negativeStatChanges[stat] = -statChanges[stat];
      });

      const statResult = applyStatChanges(gameState, negativeStatChanges, true);
      gameState = statResult.gameState;

      // Update result with stat changes
      Object.keys(statChanges).forEach((stat) => {
        result.statChanges[stat] = -statChanges[stat];
      });
    }

    // 3. Remove active effects (boosts)
    if (ACTIVE_EFFECTS.includes(effect)) {
      if (
        gameState.runData.activeEffects &&
        gameState.runData.activeEffects.includes(effect)
      ) {
        gameState.runData.activeEffects =
          gameState.runData.activeEffects.filter((e) => e !== effect);
        result.boostsDeactivated.push(effect);
      }
    }

    // Save the updated game state
    await saveGameState(gameState);

    return result;
  } catch (error) {
    result.success = false;
    result.error = error.message;
    return result;
  }
}

/**
 * Add a card to the player's deck
 * @param {Object} cardData - Card data to add
 * @param {Object} gameState - Current game state
 * @returns {Object|null} - The added card or null if failed
 */
function addCardToDeck(cardData, gameState) {
  try {
    // Ensure playerDeck exists
    if (!gameState.runData.playerDeck) {
      gameState.runData.playerDeck = [];
    }

    // Create card object
    const card = {
      value: cardData.value,
      suit: cardData.suit,
      display: `${cardData.value}${cardData.suit}`,
      code: `${cardData.value}${cardData.suit}`,
    };

    // Add to deck
    gameState.runData.playerDeck.push(card);

    return card;
  } catch (error) {
    return null;
  }
}

/**
 * Remove a card from the player's deck safely
 * @param {Object} cardData - Card data to remove
 * @param {Object} gameState - Current game state
 * @returns {Object|null} - The removed card or null if not found
 */
function removeCardFromDeck(cardData, gameState) {
  try {
    if (!gameState.runData.playerDeck) {
      return null;
    }

    // Find the card in the deck
    const cardIndex = gameState.runData.playerDeck.findIndex(
      (card) => card.value === cardData.value && card.suit === cardData.suit
    );

    if (cardIndex === -1) {
      // Card not found, that's okay - just return null
      return null;
    }

    // Remove the card
    const removedCard = gameState.runData.playerDeck.splice(cardIndex, 1)[0];
    return removedCard;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a boost effect is active
 * @param {string} boostType - Type of boost to check
 * @param {Object} gameState - Current game state
 * @returns {boolean} - Whether the boost is active
 */
export function isBoostActive(boostType, gameState) {
  return gameState.runData.activeEffects?.includes(boostType) === true;
}

/**
 * Get all active boost effects
 * @param {Object} gameState - Current game state
 * @returns {Array} - Array of active boost types
 */
export function getActiveBoosts(gameState) {
  return gameState.runData.activeEffects || [];
}
