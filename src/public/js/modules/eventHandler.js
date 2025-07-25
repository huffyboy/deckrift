// eventHandler.js - Event processing logic

import {
  getCardValue,
  applyStatChanges,
  // Utility functions
  isRedSuit,
  isBlackSuit,
  getSuitName,
  capitalizeFirst,
  getRandomElement,
  clamp,
  formatPlural,
  getUIMessage,
} from './sharedGameUtils.js';
import { getChallengeModifier } from './gameUtils.js';
import {
  showNotification,
  showGameMessage,
  showDeckDrawingAnimation,
  updateHealthDisplay,
  showMultiCardChoiceDialog,
  showMultiCardRemoveDialog,
  showInventoryOverflowDialog,
  showChallengeCardDialog,
} from './uiUtils.js';
import {
  EVENTS,
  GAME_CONSTANTS,
  XP_CONSTANTS,
  CHALLENGE_CONSTANTS,
  ANIMATION_TIMING,
  UI_MESSAGES,
  BOONS,
  BANES,
  BANE_AND_BOON_EFFECTS,
  SUIT_TO_STAT_MAP,
  SUIT_TO_EMOJI_MAP,
  ARTIFACTS,
  CARD_ADDING_EFFECTS,
  NEGATIVE_CARD_VALUES,
  ARTIFACT_MAPPINGS,
  ARTIFACT_DETAILS,
  ARTIFACT_POOL_ITEMS,
  EQUIPMENT,
  STANDARD_SUITS,
  SHOP_PRICES,
} from './gameConstants.js';
import {
  drawAndRemoveCardFromPlayerDeck,
  getRandomCardFromPlayerDeck,
} from '../game.js';
import {
  DECK_TYPES,
  addJokersToDeck,
  removeCardFromDeck,
  getHighCards,
  getFaceCards,
  saveDeckToServer,
  saveGameStateToServer,
  createShuffledStandardDeck,
  getDeck,
} from './deckService.js';
import {
  applyArtifactEffects,
  removeArtifactEffects,
} from './artifactService.js';

/**
 * Draw a random card from the standard deck
 * @returns {Promise<Object>} - Random card from standard deck
 */
async function drawFromStandardDeck() {
  // Generate a shuffled standard deck
  const standardDeck = createShuffledStandardDeck();

  // Pick a random card
  const drawnCard = getRandomElement(standardDeck);

  return {
    value: drawnCard.value,
    suit: drawnCard.suit,
    display: `${drawnCard.value}${SUIT_TO_EMOJI_MAP[drawnCard.suit] || drawnCard.suit}`,
    code: `${drawnCard.value}${drawnCard.suit}`,
  };
}

/**
 * Draw a random card from the player's deck
 * @param {Object} gameState - Current game state
 * @returns {Promise<Object>} - Random card from player's deck
 */
async function drawFromPlayerDeck(gameState) {
  if (!gameState || !gameState.runData?.playerDeck) {
    return null;
  }

  const playerDeck = gameState.runData.playerDeck;

  if (playerDeck.length === 0) {
    return null;
  }

  // Pick a random card
  const drawnCard = getRandomElement(playerDeck);

  return {
    value: drawnCard.value,
    suit: drawnCard.suit,
    display: `${drawnCard.value}${SUIT_TO_EMOJI_MAP[drawnCard.suit] || drawnCard.suit}`,
    code: `${drawnCard.value}${drawnCard.suit}`,
  };
}

/**
 * Check if a stat levels up when gaining XP
 * @param {Object} gameState - Current game state
 * @param {string} statName - Name of the stat that gained XP
 * @param {number} xpGained - Amount of XP gained
 * @returns {Object|null} - Level up result or null if no level up
 */
function checkForLevelUp(gameState, statName, xpGained) {
  if (
    !gameState.gameData ||
    !gameState.gameData.statXP ||
    !gameState.gameData.stats
  ) {
    return null;
  }

  const currentXP = gameState.gameData.statXP[statName];
  const currentLevel = gameState.gameData.stats[statName];

  // Calculate XP threshold for next level
  const targetLevel = currentLevel + 1;
  const xpThreshold = XP_CONSTANTS.XP_FORMULA(targetLevel);

  // Check if we've reached the threshold
  if (currentXP >= xpThreshold) {
    // Calculate how many levels we gained
    let levelsGained = 0;
    let remainingXP = currentXP;
    let newLevel = currentLevel;

    while (remainingXP >= xpThreshold) {
      remainingXP -= xpThreshold;
      newLevel++;
      levelsGained++;

      // Recalculate threshold for next level
      const nextTargetLevel = newLevel + 1;
      const nextXpThreshold = XP_CONSTANTS.XP_FORMULA(nextTargetLevel);
      if (remainingXP < nextXpThreshold) break;
    }

    return {
      statName,
      oldLevel: currentLevel,
      newLevel,
      levelsGained,
      remainingXP,
      xpGained,
    };
  }

  return null;
}

/**
 * Apply stat level up and show notification
 * @param {Object} gameState - Current game state
 * @param {Object} levelUpResult - Result from checkForLevelUp
 */
async function applyStatLevelUp(gameState, levelUpResult) {
  if (!levelUpResult) return;

  const { statName, oldLevel, newLevel, remainingXP } = levelUpResult;

  // Apply the stat increase directly to game state
  gameState.gameData.stats[statName] = newLevel;

  // Handle Will stat changes - affects max HP
  if (statName === 'will') {
    const oldMaxHealth = oldLevel * 10;
    const newMaxHealth = newLevel * 10;
    const healthIncrease = newMaxHealth - oldMaxHealth;

    // Update max health
    gameState.runData.maxHealth = newMaxHealth;

    // Increase current HP by the same amount
    gameState.runData.health = Math.min(
      gameState.runData.health + healthIncrease,
      newMaxHealth
    );
  }

  // Note: Craft and Focus stat side effects (inventory capacity, hand size)
  // are handled in gameUtils.js applyStatChanges function

  // Update the XP to the remaining amount after level-up
  gameState.gameData.statXP[statName] = remainingXP;

  // Save the updated game state
  await saveGameState(gameState);

  // Update the health display UI if Will leveled up
  if (statName === 'will') {
    updateHealthDisplay(gameState.runData.health, gameState.runData.maxHealth);
  }

  // Show level up notification
  const statDisplayName = capitalizeFirst(statName);
  const levelUpTitle = UI_MESSAGES.LEVEL_UP.TITLE.replace(
    '{statName}',
    statDisplayName
  );
  const levelUpMessage = UI_MESSAGES.LEVEL_UP.MESSAGE.replace(
    '{statName}',
    statDisplayName
  )
    .replace('{oldLevel}', oldLevel)
    .replace('{newLevel}', newLevel);

  showNotification(levelUpTitle, levelUpMessage, UI_MESSAGES.LEVEL_UP.TYPE);
}

/**
 * Save the current player deck to the server
 * @param {Array} deck - The current player deck
 */
async function savePlayerDeck(deck) {
  try {
    const response = await fetch('/game/update-deck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deck }),
    });

    const data = await response.json();
    if (!data.success) {
      // Failed to save player deck
    } else {
      // Successfully saved deck
    }
  } catch (error) {
    // Error saving player deck
  }
}

/**
 * Save the current game state to the server
 * @param {Object} gameState - The game state to save
 * @returns {Promise<boolean>} - Success status
 */
async function saveGameState(gameState) {
  try {
    const success = await saveGameStateToServer(gameState);
    return success;
  } catch (error) {
    return false;
  }
}

/**
 * Handle card encounter based on card value
 * @param {Object} card - Card object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
export function handleCardEncounter(card, gameState, handlers) {
  const cardValue = getCardValue(card);
  const event = EVENTS[cardValue];

  // Default to 'nothing' event if no event is found for this card value
  if (!event) {
    const nothingMessage = getUIMessage('EVENTS', 'NOTHING');
    showGameMessage(
      nothingMessage.title,
      nothingMessage.message,
      nothingMessage.type,
      nothingMessage.icon,
      ANIMATION_TIMING.MESSAGE_TIMEOUT,
      () => {
        // Callback when message is dismissed (either by timeout or click)
        if (handlers.resetBusyState) {
          handlers.resetBusyState();
          // Re-render the map after resetting busy state
          if (handlers.renderOverworldMap) {
            handlers.renderOverworldMap();
          }
        }
      }
    );
    return;
  }

  switch (event.type) {
    case 'fight':
      handleFightEvent(event, gameState, handlers);
      break;
    case 'challenge': {
      // Start challenge with new multi-stage system
      handleChallenge(event.stat, gameState, handlers);
      break;
    }
    case 'rest': {
      handleRestEvent(event, gameState, handlers);
      break;
    }
    case 'shop':
      handleShopEvent(event, gameState, handlers);
      break;
    case 'boon': {
      handleBoonEvent(event, gameState, handlers);
      break;
    }
    case 'bane': {
      handleBaneEvent(event, gameState, handlers);
      break;
    }
    case 'nothing':
      handleNothingEvent(event, gameState, handlers);
      break;
    case 'boss':
      handleBossEvent(event, gameState, handlers);
      break;
  }
}

/**
 * Handle card flip event (reveal card, then move player, then trigger event)
 * @param {Object} mapCell - Map cell object
 * @param {Object} newPosition - New position
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
export function handleCardFlip(mapCell, newPosition, gameState, handlers) {
  // Create a new object instead of mutating the parameter
  const updatedMapCell = { ...mapCell, revealed: true, justRevealed: true };

  // Check if the map cell has card data (value and suit properties)
  if (updatedMapCell.value && updatedMapCell.suit) {
    // Update the map in the game state
    const { x, y } = newPosition;
    if (
      gameState.runData &&
      gameState.runData.map &&
      gameState.runData.map.tiles
    ) {
      // Find and update the tile in the tiles array
      const tileIndex = gameState.runData.map.tiles.findIndex(
        (tile) => tile.x === x && tile.y === y
      );
      if (tileIndex !== -1) {
        gameState.runData.map.tiles[tileIndex] = updatedMapCell;
      }
    }

    // Update the map display to show the revealed card (player still on old position)
    handlers.renderOverworldMap();

    // Wait for player to see the revealed card
    setTimeout(() => {
      // Move player to the revealed card position
      if (gameState.runData && gameState.runData.location) {
        gameState.runData.location.mapX = x;
        gameState.runData.location.mapY = y;
      }

      // Save the updated game state to the server
      saveGameState(gameState);

      // Update the map display to show player on new position
      handlers.renderOverworldMap();

      // Wait for player to see they moved
      setTimeout(() => {
        // Trigger the encounter
        handleCardEvent(updatedMapCell, newPosition, gameState, handlers);
      }, ANIMATION_TIMING.CARD_FLIP_DELAY);
    }, ANIMATION_TIMING.CARD_FLIP_DELAY);
  }
}

/**
 * Handle card event (trigger encounter for revealed card)
 * @param {Object} mapCell - Map cell object
 * @param {Object} newPosition - New position
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
export function handleCardEvent(mapCell, newPosition, gameState, handlers) {
  // Create a new object instead of mutating the parameter
  const updatedMapCell = { ...mapCell, visited: true, justRevealed: false };

  // Update the map in the game state
  const { x, y } = newPosition;
  if (
    gameState.runData &&
    gameState.runData.map &&
    gameState.runData.map.tiles
  ) {
    // Find and update the tile in the tiles array
    const tileIndex = gameState.runData.map.tiles.findIndex(
      (tile) => tile.x === x && tile.y === y
    );
    if (tileIndex !== -1) {
      gameState.runData.map.tiles[tileIndex] = updatedMapCell;
    }
  }

  // Update player position
  if (gameState.runData && gameState.runData.location) {
    gameState.runData.location.mapX = x;
    gameState.runData.location.mapY = y;
  }

  // Save the updated game state to the server
  saveGameState(gameState);

  // Handle the encounter for the card (with null check)
  if (updatedMapCell.value && updatedMapCell.suit) {
    const cardObject = {
      value: updatedMapCell.value,
      suit: updatedMapCell.suit,
      display: `${updatedMapCell.value}${updatedMapCell.suit}`,
    };
    handleCardEncounter(cardObject, gameState, handlers);
  }
}

/**
 * Start a battle encounter
 * @param {string} enemyType - Type of enemy
 * @param {Object} newPosition - Position where battle occurs
 * @param {Function} renderBattleInterface - Battle interface renderer
 */
export function startBattle(enemyType, newPosition, renderBattleInterface) {
  const battleMessage = getUIMessage('ENCOUNTERS', 'BATTLE', { enemyType });
  showNotification(
    battleMessage.title,
    battleMessage.message,
    battleMessage.type
  );

  // Render battle interface
  renderBattleInterface();
}

/**
 * Start a stat challenge
 * @param {string} statType - Type of stat to challenge
 * @param {Object} newPosition - Position where challenge occurs
 * @param {Function} renderEventInterface - Event interface renderer
 */
export function startChallenge(statType, newPosition, renderEventInterface) {
  const challengeMessage = getUIMessage('ENCOUNTERS', 'CHALLENGE', {
    statType,
  });
  showNotification(
    challengeMessage.title,
    challengeMessage.message,
    challengeMessage.type
  );

  // Render event interface
  renderEventInterface();
}

/**
 * Start a shop encounter
 * @param {Object} newPosition - Position where shop occurs
 * @param {Function} renderShopInterface - Shop interface renderer
 */
export function startShop(newPosition, renderShopInterface) {
  const shopMessage = getUIMessage('ENCOUNTERS', 'SHOP');
  showNotification(shopMessage.title, shopMessage.message, shopMessage.type);

  // Render shop interface
  renderShopInterface();
}

/**
 * Handle rest encounter
 * @param {Object} newPosition - Position where rest occurs
 * @param {Object} gameState - Current game state
 * @param {Function} renderOverworldMap - Map rendering function
 */
export function handleRest(newPosition, gameState, renderOverworldMap) {
  // Heal the player (50% of max HP)
  const healAmount = Math.floor(
    gameState.player.maxHealth * GAME_CONSTANTS.REST_HEAL_PERCENTAGE
  );
  gameState.player.health = Math.min(
    gameState.player.health + healAmount,
    gameState.player.maxHealth
  );

  const restMessage = getUIMessage('EVENTS', 'REST', { amount: healAmount });
  showGameMessage(
    restMessage.title,
    restMessage.message,
    restMessage.type,
    restMessage.icon,
    ANIMATION_TIMING.MESSAGE_TIMEOUT
  );

  // Update the map display
  renderOverworldMap();
}

/**
 * Handle boon encounter
 * @param {Object} newPosition - Position where boon occurs
 * @param {Object} gameState - Current game state
 * @param {Function} renderOverworldMap - Map rendering function
 */
export function handleBoon(newPosition, gameState, renderOverworldMap) {
  const boonMessage = getUIMessage('EVENTS', 'BOON');
  showGameMessage(
    boonMessage.title,
    boonMessage.message,
    boonMessage.type,
    boonMessage.icon,
    ANIMATION_TIMING.MESSAGE_TIMEOUT
  );

  // Boon logic is implemented in handleCardEncounter for 'boon' events
  // This function is kept for compatibility but the main logic is elsewhere

  // Update the map display
  renderOverworldMap();
}

/**
 * Handle bane encounter
 * @param {Object} newPosition - Position where bane occurs
 * @param {Object} gameState - Current game state
 * @param {Function} renderOverworldMap - Map rendering function
 */
export function handleBane(newPosition, gameState, renderOverworldMap) {
  const baneMessage = getUIMessage('EVENTS', 'BANE');
  showGameMessage(
    baneMessage.title,
    baneMessage.message,
    baneMessage.type,
    baneMessage.icon,
    ANIMATION_TIMING.MESSAGE_TIMEOUT
  );

  // Bane logic is implemented in handleCardEncounter for 'bane' events
  // This function is kept for compatibility but the main logic is elsewhere

  // Update the map display
  renderOverworldMap();
}

/**
 * Start a boss battle
 * @param {Object} newPosition - Position where boss battle occurs
 * @param {Function} renderBattleInterface - Battle interface renderer
 */
export function startBossBattle(newPosition, renderBattleInterface) {
  const bossMessage = getUIMessage('ENCOUNTERS', 'BOSS');
  showNotification(bossMessage.title, bossMessage.message, bossMessage.type);

  // Render battle interface
  renderBattleInterface();
}

/**
 * Process a boon based on the drawn card
 * @param {Object} card - The drawn card
 * @param {Object} gameState - Current game state
 * @returns {Object} - Boon result with header, description, icon and applied effects
 */
async function processBoon(card, gameState) {
  const cardValue = card.value;
  const cardSuit = card.suit;

  // Convert suit symbols to suit names for BOONS lookup
  const cardSuitName = getSuitName(cardSuit);
  const isRed = isRedSuit(cardSuit);

  // Get the boon effect based on card value and suit
  let boonEffect = BOONS[cardValue];

  // Handle suit-specific effects
  if (boonEffect && typeof boonEffect === 'object' && !boonEffect.type) {
    // Check for suit-specific effects (like Aces)
    if (cardSuitName && boonEffect[cardSuitName]) {
      boonEffect = boonEffect[cardSuitName];
    } else if (isRed && boonEffect.red) {
      boonEffect = boonEffect.red;
    } else if (!isRed && boonEffect.black) {
      boonEffect = boonEffect.black;
    }
  }

  // Apply the boon effect
  const result = await applyBoonEffect(boonEffect, card, gameState);

  // Get the proper header and description from BANE_AND_BOON_EFFECTS
  const effectData =
    BANE_AND_BOON_EFFECTS[boonEffect?.type] || BANE_AND_BOON_EFFECTS.nothing;

  // Special handling for currencyGain to show what card was drawn and how much was gained
  if (boonEffect?.type === 'currencyGain') {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for statXpGain to show what card was drawn and how much XP was gained
  if (boonEffect?.type === 'statXpGain') {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for addCard to show what card was drawn and offer to add it
  if (boonEffect?.type === 'addCard') {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for removeCard to show what card was drawn and offer to remove it
  if (boonEffect?.type === 'removeCard') {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for artifact to show what card was drawn and which artifact was gained
  if (boonEffect?.type === 'artifact') {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  return {
    header: effectData.header,
    description: effectData.description,
    icon: effectData.icon,
    applied: result.applied,
  };
}

/**
 * Process a bane based on the drawn card
 * @param {Object} card - The drawn card
 * @param {Object} gameState - Current game state
 * @returns {Object} - Bane result with header, description, icon and applied effects
 */
async function processBane(card, gameState) {
  const cardValue = card.value; // Use string value directly for BANES lookup
  const cardSuit = card.suit;
  const isRed = isRedSuit(cardSuit);

  // Get the bane effect based on card value and suit
  let baneEffect = BANES[cardValue];

  // Handle suit-specific effects (if any)
  if (baneEffect && typeof baneEffect === 'object' && !baneEffect.type) {
    // Check for suit-specific effects (like Aces)
    if (cardSuit && baneEffect[cardSuit]) {
      baneEffect = baneEffect[cardSuit];
    } else if (isRed && baneEffect.red) {
      baneEffect = baneEffect.red;
    } else if (!isRed && baneEffect.black) {
      baneEffect = baneEffect.black;
    }
  }

  // Apply the bane effect
  const result = await applyBaneEffect(baneEffect, card, gameState);

  // Get the proper header and description from BANE_AND_BOON_EFFECTS
  const effectData =
    BANE_AND_BOON_EFFECTS[baneEffect?.type] || BANE_AND_BOON_EFFECTS.nothing;

  // Special handling for loseStat to show what card was drawn and which stat was lost
  if (baneEffect?.type === 'loseStat') {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for loseItem to show what was lost
  if (baneEffect?.type === 'loseItem' && result.lostItem) {
    return {
      header: effectData.header,
      description: `You lost your ${result.itemName}.`,
      icon: effectData.icon,
      applied: result.applied,
    };
  }

  // Special handling for loseItem when player has no equipment
  if (baneEffect?.type === 'loseItem' && !result.applied) {
    return {
      header: effectData.header,
      description: UI_MESSAGES.CARD_EFFECTS.OR_SO_YOU_THOUGHT,
      icon: effectData.icon,
      applied: false,
    };
  }

  // Special handling for loseHighCard to show what card was lost
  if (baneEffect?.type === 'loseHighCard' && result.highCards) {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      highCards: result.highCards,
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for loseFaceCard to show what card was lost
  if (baneEffect?.type === 'loseFaceCard' && result.faceCards) {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      faceCards: result.faceCards,
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for loseCurrency to show what card was drawn and how much was lost
  if (baneEffect?.type === 'loseCurrency') {
    return {
      header: effectData.header,
      description: effectData.description,
      icon: effectData.icon,
      applied: true,
      needsSecondDraw: true, // Signal that we need to draw a second card
      secondDrawMessage: effectData.secondDrawMessage,
      secondDrawDeck: effectData.secondDrawDeck,
    };
  }

  // Special handling for addJoker to show the correct amount
  if (baneEffect?.type === 'addJoker' && result.jokerAmount) {
    return {
      header: effectData.header,
      description: UI_MESSAGES.CARD_EFFECTS.ADD_JOKER.replace(
        '{amount}',
        result.jokerAmount
      ).replace('{plural}', formatPlural(result.jokerAmount, '', 's')),
      icon: effectData.icon,
      applied: result.applied,
    };
  }

  return {
    header: effectData.header,
    description: effectData.description,
    icon: effectData.icon,
    applied: result.applied,
  };
}

/**
 * Apply a boon effect to the game state
 * @param {Object} boonEffect - The boon effect to apply
 * @param {Object} card - The drawn card
 * @param {Object} gameState - Current game state
 * @returns {Object} - Result with description and applied flag
 */
async function applyBoonEffect(boonEffect, card, gameState) {
  if (!boonEffect || boonEffect.type === 'nothing') {
    return {
      description: UI_MESSAGES.CARD_EFFECTS.NOTHING_HAPPENS,
      applied: false,
    };
  }

  switch (boonEffect.type) {
    case 'powerPlus':
    case 'willPlus':
    case 'craftPlus':
    case 'focusPlus': {
      const stat = boonEffect.stat;
      const value = boonEffect.value || 1;

      // Apply the stat gain using the simplified system
      const result = applyStatChanges(gameState, { [stat]: value }, true);

      // Update the game state with the changes
      Object.assign(gameState, result.gameState);

      return {
        description: `+${value} to ${stat}`,
        applied: true,
      };
    }

    case 'powerPlusTwo':
    case 'willPlusTwo':
    case 'craftPlusTwo':
    case 'focusPlusTwo': {
      const stat = boonEffect.stat || boonEffect.type.replace('PlusTwo', '');

      // Apply the stat gain using the simplified system
      const result = applyStatChanges(gameState, { [stat]: 2 }, true);

      // Update the game state with the changes
      Object.assign(gameState, result.gameState);

      return {
        description: `+2 to ${stat}`,
        applied: true,
      };
    }

    case 'statXpGain': {
      // For statXpGain, we don't process the first card here
      // The second card draw is handled in the main boon flow
      return {
        description: UI_MESSAGES.CARD_EFFECTS.STAT_XP_GAIN_TRIGGERED,
        applied: true,
      };
    }

    case 'currencyGain': {
      // Currency gain is now handled with second draws, so this should not be reached
      return {
        description: UI_MESSAGES.CARD_EFFECTS.CURRENCY_GAIN_TRIGGERED,
        applied: true,
      };
    }

    case 'artifact': {
      // Handle artifact based on card value string (not numeric value)
      const cardValueString = card.value; // Use the card's value string ('K', 'Q', etc.)
      const artifact = ARTIFACTS[cardValueString];
      if (artifact) {
        if (artifact.type === 'random' && artifact.pool) {
          const randomArtifact = getRandomElement(artifact.pool);
          return {
            description: UI_MESSAGES.ARTIFACTS.GAINED.replace(
              '{emoji}',
              '🧿'
            ).replace('{name}', randomArtifact.name),
            applied: true,
          };
        } else if (artifact.type === 'equipment') {
          return {
            description: UI_MESSAGES.ARTIFACTS.EQUIPMENT_GAINED.replace(
              '{type}',
              artifact.equipmentType
            ),
            applied: true,
          };
        }
      }
      return {
        description: UI_MESSAGES.ARTIFACTS.RANDOM_ARTIFACT,
        applied: true,
      };
    }

    case 'addCard':
    case 'addCards': {
      // Handle card adding effects
      const cardEffect = CARD_ADDING_EFFECTS[boonEffect.type];
      if (cardEffect) {
        // Add the specific cards to the player's deck
        if (
          gameState.runData &&
          gameState.runData.fightStatus &&
          gameState.runData.fightStatus.playerDeck &&
          cardEffect.cards
        ) {
          cardEffect.cards.forEach((cardStr) => {
            // Parse card string (e.g., "K♥", "A♠")
            let value, suit;
            if (cardStr.length === 2) {
              value = cardStr[0];
              suit = cardStr[1];
            } else if (cardStr.length === 3) {
              value = cardStr.substring(0, 2); // "10"
              suit = cardStr[2];
            } else {
              value = '?';
              suit = '?';
            }

            gameState.runData.fightStatus.playerDeck.push({
              value,
              suit,
              type: 'standard',
            });
          });
          // Save the updated deck to the server
          await savePlayerDeck(gameState.runData.fightStatus.playerDeck);
        }
        return {
          description: cardEffect.description,
          applied: true,
        };
      }
      return {
        description: 'Added cards to your deck',
        applied: true,
      };
    }

    case 'removeCard': {
      return {
        description: 'Removed a card from your deck',
        applied: true,
      };
    }

    default:
      return {
        description: UI_MESSAGES.ERRORS.UNKNOWN_BOON_EFFECT,
        applied: false,
      };
  }
}

/**
 * Get card value for negative effects (inverted scale)
 * @param {Object} card - The card object
 * @returns {number} - Card value for negative effects (A=1, Joker=14)
 */
function getNegativeCardValue(card) {
  return NEGATIVE_CARD_VALUES[card.value] || getCardValue(card);
}

/**
 * Apply a bane effect to the game state
 * @param {Object} baneEffect - The bane effect to apply
 * @param {Object} card - The drawn card
 * @param {Object} gameState - Current game state
 * @returns {Object} - Result with description and applied flag
 */
async function applyBaneEffect(baneEffect, card, gameState) {
  if (!baneEffect || baneEffect.type === 'nothing') {
    return {
      description: UI_MESSAGES.CARD_EFFECTS.NOTHING_HAPPENS,
      applied: false,
    };
  }

  switch (baneEffect.type) {
    case 'loseItem': {
      // Get the player's equipment inventory
      const equipment = gameState.runData?.equipment || [];

      if (equipment.length === 0) {
        return {
          description: UI_MESSAGES.CARD_EFFECTS.NO_ITEMS,
          applied: false,
        };
      }

      // Randomly select an item to lose
      const lostItem = getRandomElement(equipment);
      const randomIndex = equipment.indexOf(lostItem);

      // Remove the item from the equipment array
      equipment.splice(randomIndex, 1);

      // If it's an artifact, remove its effects
      if (lostItem.type === 'artifact') {
        const effectResult = await removeArtifactEffects(
          lostItem.value,
          gameState
        );
        if (!effectResult.success) {
          // Failed to remove artifact effects
        }
      }

      // Save the updated game state to the server
      await saveGameState(gameState);

      // Get the item name for display
      let itemName = lostItem.value;
      const itemType = lostItem.type;

      // Try to get a more descriptive name from EQUIPMENT data
      try {
        const { EQUIPMENT } = await import('./gameConstants.js');

        // Look up the equipment name based on type and value
        if (
          EQUIPMENT[itemType + 's'] &&
          EQUIPMENT[itemType + 's'][lostItem.value]
        ) {
          itemName = EQUIPMENT[itemType + 's'][lostItem.value].name;
        } else {
          // Fallback: try to find by value in any equipment type
          for (const equipmentType of ['weapons', 'armor', 'artifacts']) {
            if (
              EQUIPMENT[equipmentType] &&
              EQUIPMENT[equipmentType][lostItem.value]
            ) {
              itemName = EQUIPMENT[equipmentType][lostItem.value].name;
              break;
            }
          }
        }
      } catch (error) {
        // Fallback to the value if we can't get the name
      }

      return {
        description: UI_MESSAGES.CARD_EFFECTS.LOST_ITEM.replace(
          '{itemName}',
          itemName
        ).replace('{itemType}', itemType),
        applied: true,
        lostItem: lostItem,
        itemName: itemName,
        itemType: itemType,
      };
    }

    case 'loseStat': {
      // For loseStat, we don't draw a card here anymore
      // The second card draw is handled in the main bane flow
      return {
        description: UI_MESSAGES.CARD_EFFECTS.STAT_LOSS_TRIGGERED,
        applied: true,
      };
    }

    case 'loseHighCard': {
      // Get high cards from the player's main deck using deck service
      const highCards = getHighCards(gameState, DECK_TYPES.PLAYER_MAIN);

      if (highCards.length === 0) {
        return {
          description: UI_MESSAGES.CARD_EFFECTS.NO_HIGH_CARDS,
          applied: false,
        };
      }

      // For loseHighCard, we don't draw a card here anymore
      // The second card draw is handled in the main bane flow
      return {
        description: 'High card loss effect triggered',
        applied: true,
        highCards: highCards,
      };
    }

    case 'loseFaceCard': {
      // Get face cards from the player's main deck using deck service
      const faceCards = getFaceCards(gameState, DECK_TYPES.PLAYER_MAIN);

      if (faceCards.length === 0) {
        return {
          description: UI_MESSAGES.CARD_EFFECTS.NO_FACE_CARDS,
          applied: false,
        };
      }

      // For loseFaceCard, we don't draw a card here anymore
      // The second card draw is handled in the main bane flow
      return {
        description: 'Face card loss effect triggered',
        applied: true,
        faceCards: faceCards,
      };
    }

    case 'loseCurrency': {
      // Get the player's current currency
      const currentCurrency = gameState.runData?.runCurrency || 0;

      if (currentCurrency <= 0) {
        return {
          description: UI_MESSAGES.CARD_EFFECTS.NO_CURRENCY,
          applied: false,
        };
      }

      // For loseCurrency, we don't draw a card here anymore
      // The second card draw is handled in the main bane flow
      return {
        description: 'Currency loss effect triggered',
        applied: true,
      };
    }

    case 'addJoker': {
      const jokerAmount = baneEffect.amount || 1;

      // Use deck service to add jokers to the main player deck
      const updatedGameState = addJokersToDeck(
        gameState,
        DECK_TYPES.PLAYER_MAIN,
        jokerAmount
      );

      // Update the game state
      Object.assign(gameState, updatedGameState);

      // Save the updated deck to the server
      await saveDeckToServer(gameState.runData.playerDeck);

      return {
        description: `Add ${jokerAmount} joker${jokerAmount === 1 ? '' : 's'} to your deck`,
        applied: true,
        jokerAmount: jokerAmount,
      };
    }

    default:
      return {
        description: UI_MESSAGES.ERRORS.UNKNOWN_BANE_EFFECT,
        applied: false,
      };
  }
}

/**
 * Gain XP for a specific stat with proper level up handling
 * @param {string} statName - The stat to gain XP in
 * @param {number} xpAmount - Amount of XP to gain
 * @param {Object} gameState - Current game state
 * @returns {Promise<Object>} - Result with xpGained, statGained, and levelUpResult
 */
async function gainStatXP(statName, xpAmount, gameState) {
  // Initialize statXP if it doesn't exist
  if (!gameState.gameData.statXP) {
    gameState.gameData.statXP = { power: 0, will: 0, craft: 0, focus: 0 };
  }

  // Add XP to the appropriate stat
  gameState.gameData.statXP[statName] =
    (gameState.gameData.statXP[statName] || 0) + xpAmount;

  // Save the updated game state
  await saveGameState(gameState);

  // Check for level up
  const levelUpResult = checkForLevelUp(gameState, statName, xpAmount);
  if (levelUpResult) {
    await applyStatLevelUp(gameState, levelUpResult);
  }

  return {
    xpGained: xpAmount,
    statGained: statName,
    levelUpResult: levelUpResult,
  };
}

/**
 * Apply stat XP gain to the game state.
 * This function is called when a 'statXpGain' boon effect is processed.
 * It draws a second card to determine which stat gains XP and how much.
 * @param {Object} card - The drawn card for the stat and XP amount.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description, applied flag, xpGained, statGained, and cardValue.
 */
async function applyStatXpGain(card, gameState) {
  // Check if it's a joker (no XP gain for jokers)
  if (card.suit === 'joker' || card.value === '𝕁') {
    return {
      description: UI_MESSAGES.CARD_EFFECTS.NO_XP_JOKER,
      applied: false,
      xpGained: 0,
      statGained: null,
      cardValue: 0,
    };
  }

  const cardValue = getCardValue(card);
  const statToGain = SUIT_TO_STAT_MAP[card.suit] || 'power';

  // Check for XP boost effect - draw additional cards instead of doubling
  let totalXpGain = cardValue;
  const additionalCards = [];

  if (
    gameState.runData.activeEffects &&
    gameState.runData.activeEffects.includes('xpBoost')
  ) {
    // Draw one additional card for XP boost
    const additionalCard = await drawFromStandardDeck();
    if (additionalCard) {
      const additionalValue = getCardValue(additionalCard);
      const additionalStat = SUIT_TO_STAT_MAP[additionalCard.suit] || 'power';
      totalXpGain += additionalValue;
      additionalCards.push({
        card: additionalCard,
        value: additionalValue,
        stat: additionalStat,
      });
    }
  }

  // Use the new reusable function
  const xpResult = await gainStatXP(statToGain, totalXpGain, gameState);

  // Build description based on whether additional cards were drawn
  const description = UI_MESSAGES.CARD_EFFECTS.XP_GAIN.replace(
    '{amount}',
    totalXpGain
  ).replace('{stat}', capitalizeFirst(statToGain));

  // Collect all cards drawn for display
  const allCardsDrawn = [card, ...additionalCards.map((ac) => ac.card)];

  return {
    description,
    applied: true,
    xpGained: totalXpGain,
    statGained: statToGain,
    cardValue: cardValue,
    additionalCards,
    allCardsDrawn,
    bonusXp: totalXpGain - cardValue,
    levelUpResult: xpResult.levelUpResult,
  };
}

/**
 * Apply currency gain to the game state.
 * This function is called when a 'currencyGain' boon effect is processed.
 * It draws a second card to determine the exact amount of currency to gain.
 * @param {Object} card - The drawn card for the currency amount.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description, applied flag, currencyGained, cardValue, and originalCurrency.
 */
async function applyCurrencyGain(card, gameState) {
  // Check if it's a joker (no currency gain for jokers)
  if (card.suit === 'joker' || card.value === '𝕁') {
    return {
      description: UI_MESSAGES.CARD_EFFECTS.NO_CURRENCY_JOKER,
      applied: false,
      currencyGained: 0,
      cardValue: 0,
      originalCurrency: gameState.runData?.runCurrency || 0,
    };
  }

  const cardValue = getCardValue(card);
  const currentCurrency = gameState.runData?.runCurrency || 0;

  // Check for currency boost effect - draw additional cards instead of doubling
  let totalCurrencyGain = cardValue;
  const additionalCards = [];

  if (
    gameState.runData.activeEffects &&
    gameState.runData.activeEffects.includes('currencyBoost')
  ) {
    // Draw one additional card for currency boost
    const additionalCard = await drawFromStandardDeck();
    if (additionalCard) {
      const additionalValue = getCardValue(additionalCard);
      totalCurrencyGain += additionalValue;
      additionalCards.push({
        card: additionalCard,
        value: additionalValue,
      });
    }
  }

  gameState.runData.runCurrency = currentCurrency + totalCurrencyGain;

  await saveGameState(gameState);

  // Build description based on whether additional cards were drawn
  const description = UI_MESSAGES.CARD_EFFECTS.CURRENCY_GAIN.replace(
    '{amount}',
    totalCurrencyGain
  );

  // Collect all cards drawn for display
  const allCardsDrawn = [card, ...additionalCards.map((ac) => ac.card)];

  return {
    description,
    applied: true,
    currencyGained: totalCurrencyGain,
    cardValue: cardValue,
    originalCurrency: currentCurrency,
    additionalCards,
    allCardsDrawn,
    bonusCurrency: totalCurrencyGain - cardValue,
  };
}

/**
 * Apply currency loss to the game state.
 * This function is called when a 'loseCurrency' bane effect is processed.
 * It draws a second card to determine the exact amount of currency to lose.
 * @param {Object} card - The drawn card for the currency amount.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description, applied flag, currencyLost, cardValue, and originalCurrency.
 */
async function applyCurrencyLoss(card, gameState) {
  const cardValue = getNegativeCardValue(card);
  const currentCurrency = gameState.runData?.runCurrency || 0;

  const currencyToLose = clamp(cardValue, 0, currentCurrency);

  gameState.runData.runCurrency = currentCurrency - currencyToLose;

  await saveGameState(gameState);

  return {
    description: UI_MESSAGES.CARD_EFFECTS.CURRENCY_LOSS.replace(
      '{amount}',
      currencyToLose
    ).replace('{card}', `${card.value}${card.suit}`),
    applied: true,
    currencyLost: currencyToLose,
    cardValue: cardValue,
    originalCurrency: currentCurrency,
  };
}

/**
 * Apply stat loss to the game state.
 * This function is called when a 'loseStat' bane effect is processed.
 * It draws a second card to determine which stat to lose.
 * @param {Object} card - The drawn card for the stat determination.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description, applied flag, statLost, and card.
 */
async function applyStatLoss(card, gameState) {
  // Determine which stat to lose based on the suit
  const statToLose = SUIT_TO_STAT_MAP[card.suit] || 'power';

  // Apply the stat loss using the simplified system
  const result = applyStatChanges(gameState, { [statToLose]: -1 }, true);

  // Update the game state with the changes
  Object.assign(gameState, result.gameState);

  await saveGameState(gameState);

  // If Craft stat was decreased, check for inventory overflow
  if (statToLose === 'craft') {
    await handleInventoryOverflow(gameState, () => {
      // This callback runs after inventory overflow is handled (if any)
    });
  }

  return {
    description: UI_MESSAGES.CARD_EFFECTS.STAT_LOSS.replace(
      '{stat}',
      statToLose
    ).replace('{card}', `${card.value}${card.suit}`),
    applied: true,
    statLost: statToLose,
    card: card,
  };
}

/**
 * Applies a high card loss effect to the game state.
 * This function is called when a 'loseHighCard' bane effect is processed.
 * It removes the drawn high card from the player's deck.
 * @param {Object} drawnCard - The drawn high card object.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description and applied flag.
 */
async function applyHighCardLoss(drawnCard, gameState) {
  // Use deck service to remove the card from the main player deck
  const { gameState: updatedGameState, removedCard } = removeCardFromDeck(
    gameState,
    DECK_TYPES.PLAYER_MAIN,
    drawnCard
  );

  if (removedCard) {
    // Update the game state
    Object.assign(gameState, updatedGameState);

    // Save the updated deck to the server
    await saveDeckToServer(gameState.runData.playerDeck);
  }

  return {
    description: UI_MESSAGES.CARD_EFFECTS.HIGH_CARD_LOST.replace(
      '{card}',
      `${drawnCard.value}${drawnCard.suit}`
    ),
    applied: true,
  };
}

/**
 * Applies a face card loss effect to the game state.
 * This function is called when a 'loseFaceCard' bane effect is processed.
 * It removes the drawn face card from the player's deck.
 * @param {Object} drawnCard - The drawn face card object.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description and applied flag.
 */
async function applyFaceCardLoss(drawnCard, gameState) {
  // Use deck service to remove the card from the main player deck
  const { gameState: updatedGameState, removedCard } = removeCardFromDeck(
    gameState,
    DECK_TYPES.PLAYER_MAIN,
    drawnCard
  );

  if (removedCard) {
    // Update the game state
    Object.assign(gameState, updatedGameState);

    // Save the updated deck to the server
    await saveDeckToServer(gameState.runData.playerDeck);
  }

  return {
    description: UI_MESSAGES.CARD_EFFECTS.FACE_CARD_LOST.replace(
      '{card}',
      `${drawnCard.value}${drawnCard.suit}`
    ),
    applied: true,
  };
}

/**
 * Apply add card effect to the game state.
 * This function is called when a 'addCard' boon effect is processed.
 * It draws a second card to determine which card to add.
 * @param {Object} card - The drawn card for the card to add.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description, applied flag, cardToAdd, and cardValue.
 */
async function applyAddCard(card, gameState) {
  // Check if it's a joker (no card to add for jokers)
  if (card.suit === 'joker' || card.value === '𝕁') {
    return {
      description: UI_MESSAGES.CARD_EFFECTS.NO_CARD_JOKER,
      applied: false,
      cardToAdd: null,
      cardValue: 0,
    };
  }

  const cardValue = getCardValue(card);
  const cardDisplay = `${card.value}${SUIT_TO_EMOJI_MAP[card.suit] || card.suit}`;

  // Add the card to the player's main deck
  if (!gameState.runData.playerDeck) {
    gameState.runData.playerDeck = [];
  }

  // Add the card to the player's deck
  gameState.runData.playerDeck.push({
    value: card.value,
    suit: card.suit,
    type: 'standard',
  });

  // Save the updated deck to the server
  await savePlayerDeck(gameState.runData.playerDeck);

  return {
    description: UI_MESSAGES.CARD_EFFECTS.CARD_ADDED.replace(
      '{card}',
      cardDisplay
    ),
    applied: true,
    cardToAdd: cardDisplay,
    cardValue: cardValue,
  };
}

/**
 * Apply remove card effect to the game state.
 * This function is called when a 'removeCard' boon effect is processed.
 * It removes the selected card from the player's deck.
 * @param {Object} card - The card to remove from the deck.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description, applied flag, cardRemoved, and cardValue.
 */
async function applyRemoveCard(card, gameState) {
  const cardValue = getCardValue(card);
  const cardDisplay = `${card.value}${SUIT_TO_EMOJI_MAP[card.suit] || card.suit}`;

  // Use deck service to remove the card from the main player deck
  const { gameState: updatedGameState, removedCard } = removeCardFromDeck(
    gameState,
    DECK_TYPES.PLAYER_MAIN,
    card
  );

  if (removedCard) {
    // Update the game state
    Object.assign(gameState, updatedGameState);

    // Save the updated deck to the server
    await saveDeckToServer(gameState.runData.playerDeck);

    return {
      description: UI_MESSAGES.CARD_EFFECTS.CARD_REMOVED.replace(
        '{card}',
        cardDisplay
      ),
      applied: true,
      cardRemoved: cardDisplay,
      cardValue: cardValue,
    };
  } else {
    return {
      description: UI_MESSAGES.ERRORS.CARD_REMOVE_FAILED.replace(
        '{card}',
        cardDisplay
      ),
      applied: false,
      cardRemoved: null,
      cardValue: cardValue,
    };
  }
}

/**
 * Apply artifact effect to the game state.
 * This function is called when an 'artifact' boon effect is processed.
 * It determines which artifact to give based on the drawn card.
 * @param {Object} card - The drawn card that determines the artifact.
 * @param {Object} gameState - Current game state.
 * @returns {Promise<Object>} - Result with description, applied flag, artifactGained, and cardValue.
 */
async function applyArtifact(card, gameState) {
  const cardValue = card.value;
  const cardSuit = card.suit;
  const cardDisplay = `${card.value}${SUIT_TO_EMOJI_MAP[card.suit] || card.suit}`;

  // Get the artifact key from mappings
  let artifactKey = ARTIFACT_MAPPINGS[cardValue];

  if (!artifactKey) {
    return {
      description: UI_MESSAGES.ARTIFACTS.NO_ARTIFACT_FOUND.replace(
        '{card}',
        cardDisplay
      ),
      applied: false,
      artifactGained: null,
      cardValue: getCardValue(card),
    };
  }

  // Handle suit-specific mappings
  if (typeof artifactKey === 'object') {
    artifactKey = selectArtifactKeyFromSuit(artifactKey, cardSuit);
  }

  if (!artifactKey) {
    return {
      description: UI_MESSAGES.ARTIFACTS.NO_ARTIFACT_FOUND.replace(
        '{card}',
        cardDisplay
      ),
      applied: false,
      artifactGained: null,
      cardValue: getCardValue(card),
    };
  }

  // Handle random pools first
  let finalArtifact = null;
  let artifactKeyToStore = artifactKey;

  const poolItems = ARTIFACT_POOL_ITEMS[artifactKey];
  if (poolItems && poolItems.length > 0) {
    // This is a pool - select a random artifact from it
    const selectedPoolKey = getRandomElement(poolItems);
    finalArtifact = ARTIFACT_DETAILS[selectedPoolKey];
    artifactKeyToStore = selectedPoolKey;
  } else {
    // This is a direct artifact - get its details
    finalArtifact = ARTIFACT_DETAILS[artifactKey];
  }

  if (!finalArtifact) {
    return {
      description: UI_MESSAGES.ARTIFACTS.NO_ARTIFACT_DETAILS.replace(
        '{key}',
        artifactKey
      ),
      applied: false,
      artifactGained: null,
      cardValue: getCardValue(card),
    };
  }

  // Add the artifact to the player's equipment
  if (!gameState.runData.equipment) {
    gameState.runData.equipment = [];
  }

  // For weapons and armor, get the cardCondition from EQUIPMENT
  let effectText = finalArtifact.effectText;
  if (finalArtifact.type === 'weapon' || finalArtifact.type === 'armor') {
    const equipmentData =
      finalArtifact.type === 'weapon'
        ? EQUIPMENT.weapons[artifactKeyToStore]
        : EQUIPMENT.armor[artifactKeyToStore];
    if (equipmentData && equipmentData.cardCondition) {
      effectText = equipmentData.cardCondition;
    }
  }

  const artifactItem = {
    type: finalArtifact.type || 'artifact',
    value: artifactKeyToStore, // Store the artifact key, not the display name
    equipped: false, // Default to not equipped
  };

  // Store only the essential data in the save
  gameState.runData.equipment.push(artifactItem);

  // Force an immediate save to ensure the artifact is persisted
  await saveGameState(gameState);

  // Create full artifact data for display/effects (not stored in save)
  const fullArtifactData = {
    ...artifactItem,
    emoji: finalArtifact.emoji || '🧿',
    effect: finalArtifact.effect,
    effectText: effectText,
    description:
      finalArtifact.flavorText && finalArtifact.effectText
        ? `<p><strong>${finalArtifact.effectText}</strong></p><p>${finalArtifact.flavorText}</p>`
        : finalArtifact.description,
  };

  // Apply artifact effects (cards, stat modifiers, boosts) - only for actual artifacts
  let effectResult = { success: true };
  if (finalArtifact.type === 'artifact') {
    effectResult = await applyArtifactEffects(artifactKeyToStore, gameState);

    if (!effectResult.success) {
      // Failed to apply artifact effects
    }
  }

  // Check for inventory overflow and handle it
  await handleInventoryOverflow(gameState, () => {
    // This callback runs after inventory overflow is handled (if any)
  });

  // Add a small delay to simulate drawing animation
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_TIMING.ARTIFACT_DRAW_DELAY)
  );

  return {
    description: UI_MESSAGES.ARTIFACTS.GAINED.replace(
      '{emoji}',
      fullArtifactData.emoji
    ).replace('{name}', finalArtifact.name),
    applied: true,
    artifactGained: fullArtifactData.value,
    artifactEmoji: fullArtifactData.emoji,
    artifactName: finalArtifact.name,
    cardValue: getCardValue(card),
    effectResult: effectResult, // Include effect results for debugging
  };
}

/**
 * Select artifact key based on suit from a suit-specific mapping
 * @param {Object} suitMapping - The suit-specific artifact mapping
 * @param {string} cardSuit - The suit of the drawn card
 * @returns {string|null} - The artifact key or null if none found
 */
function selectArtifactKeyFromSuit(suitMapping, cardSuit) {
  // Check for exact suit match first
  if (cardSuit && suitMapping[cardSuit]) {
    return suitMapping[cardSuit];
  }

  // Check for color-based selection
  const isRed = isRedSuit(cardSuit);
  const isBlack = isBlackSuit(cardSuit);

  if (isRed && suitMapping.red) {
    return suitMapping.red;
  } else if (isBlack && suitMapping.black) {
    return suitMapping.black;
  }

  // Check for specific suit names (for database compatibility)
  const suitName = getSuitName(cardSuit);
  if (suitName && suitMapping[suitName]) {
    return suitMapping[suitName];
  }

  return null;
}

/**
 * Pick a random high card from the provided array
 * @param {Array} highCards - Array of high cards (10, J, Q, K, A) from player's personal deck
 * @returns {Promise<Object|null>} The picked high card or null if no high cards available
 */
function pickRandomHighCard(highCards) {
  return new Promise((resolve) => {
    if (!highCards || highCards.length === 0) {
      resolve(null);
      return;
    }

    // Simulate drawing animation delay
    setTimeout(() => {
      const pickedCard = getRandomElement(highCards);

      resolve(pickedCard);
    }, ANIMATION_TIMING.DRAWING_ANIMATION_DELAY);
  });
}

/**
 * Pick a random face card from the provided array
 * @param {Array} faceCards - Array of face cards (J, Q, K) from player's personal deck
 * @returns {Promise<Object|null>} The picked face card or null if no face cards available
 */
function pickRandomFaceCard(faceCards) {
  return new Promise((resolve) => {
    if (!faceCards || faceCards.length === 0) {
      resolve(null);
      return;
    }

    // Simulate drawing animation delay
    setTimeout(() => {
      const pickedCard = getRandomElement(faceCards);

      resolve(pickedCard);
    }, ANIMATION_TIMING.DRAWING_ANIMATION_DELAY);
  });
}

/**
 * Handle inventory overflow by letting the player choose which artifacts to remove
 * @param {Object} gameState - Current game state
 * @param {Function} onComplete - Callback when selection is complete
 */
export async function handleInventoryOverflow(gameState, onComplete) {
  if (!gameState.runData?.equipment) {
    if (onComplete) onComplete();
    return;
  }

  // Calculate current inventory capacity
  const baseCraftStat = gameState.gameData?.stats?.craft || 4;
  const craftModifier = gameState.runData?.statModifiers?.craft || 0;
  const totalCraftStat = baseCraftStat + craftModifier;
  const maxCapacity = totalCraftStat;
  const currentCount = gameState.runData.equipment.length;

  // Check if we're over capacity
  if (currentCount <= maxCapacity) {
    if (onComplete) onComplete();
    return;
  }

  const overflowCount = currentCount - maxCapacity;

  // Get all equipment items (weapons, armor, artifacts)
  const allEquipment = gameState.runData.equipment;

  if (allEquipment.length === 0) {
    // No equipment to remove, but we're over capacity
    // This shouldn't happen, but handle gracefully
    if (onComplete) onComplete();
    return;
  }

  // Create equipment cards for selection
  const equipmentCards = allEquipment.map((item) => {
    let itemDetails = null;
    let displayName = item.value;
    let emoji = '🧿';
    let description = 'An item with mysterious properties.';

    if (item.type === 'artifact') {
      // Look up artifact details
      itemDetails = ARTIFACT_DETAILS[item.value];
      if (itemDetails) {
        displayName = itemDetails.name;
        emoji = itemDetails.emoji;
        description = itemDetails.description;
      }
    } else if (item.type === 'weapon') {
      // Look up weapon details
      itemDetails = EQUIPMENT.weapons[item.value.toLowerCase()];
      if (itemDetails) {
        displayName = itemDetails.name;
        emoji = '⚔️';
        description = itemDetails.description;
      } else {
        displayName = item.value;
        emoji = '⚔️';
        description = 'A weapon of unknown origin.';
      }
    } else if (item.type === 'armor') {
      // Look up armor details
      itemDetails = EQUIPMENT.armor[item.value.toLowerCase()];
      if (itemDetails) {
        displayName = itemDetails.name;
        emoji = '🛡️';
        description = itemDetails.description;
      } else {
        displayName = item.value;
        emoji = '🛡️';
        description = 'Armor of unknown origin.';
      }
    }

    return {
      value: item.value,
      name: displayName,
      emoji: emoji,
      description: description,
      type: item.type,
    };
  });

  // Show the equipment selection dialog
  const overflowMessage = UI_MESSAGES.INVENTORY.OVERFLOW.message
    .replace('{count}', overflowCount)
    .replace(/{plural}/g, overflowCount > 1 ? 's' : '');
  showInventoryOverflowDialog(
    equipmentCards,
    overflowCount,
    overflowMessage,
    async (selectedItems) => {
      // If no items selected (canceled), don't remove anything
      if (selectedItems.length === 0) {
        if (onComplete) onComplete();
        return;
      }

      // Remove the selected items
      for (const selectedItem of selectedItems) {
        const index = gameState.runData.equipment.findIndex(
          (item) =>
            item.value === selectedItem.value && item.type === selectedItem.type
        );
        if (index !== -1) {
          const removedItem = gameState.runData.equipment[index];
          gameState.runData.equipment.splice(index, 1);

          // If it's an artifact, remove its effects
          if (removedItem.type === 'artifact') {
            const effectResult = await removeArtifactEffects(
              removedItem.value,
              gameState
            );
            if (!effectResult.success) {
              // Failed to remove artifact effects
            }
          }
        }
      }

      // Save the updated game state
      await saveGameState(gameState);

      // Show confirmation message
      const removedNames = selectedItems
        .map((a) => `${a.emoji} ${a.name}`)
        .join(', ');
      const removedMessage = UI_MESSAGES.INVENTORY.REMOVED.title.replace(
        '{items}',
        removedNames
      );
      showNotification(removedMessage, UI_MESSAGES.INVENTORY.REMOVED.type);

      if (onComplete) onComplete();
    }
  );
}

/**
 * Handle a stat challenge with multi-stage card drawing and selection
 * @param {string} statType - Type of stat to challenge (power, will, craft, focus)
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleChallenge(statType, gameState, handlers) {
  // Calculate challenge difficulty based on current level
  const challengeModifier = gameState.runData?.location?.level || 1;
  const targetValue = CHALLENGE_CONSTANTS.DIFFICULTY_FORMULA(challengeModifier);

  // Show initial challenge message
  const challengeMessage = getUIMessage('CHALLENGE', 'INITIAL', {
    statType: capitalizeFirst(statType),
  });
  showGameMessage(
    challengeMessage.title,
    challengeMessage.message,
    challengeMessage.type,
    challengeMessage.icon,
    null, // No timeout - player must click to continue
    async () => {
      // After initial message, start the card drawing phase
      await startChallengeCardPhase(statType, targetValue, gameState, handlers);
    }
  );
}

/**
 * Start the card drawing phase of a challenge
 * @param {string} statType - Type of stat being challenged
 * @param {number} targetValue - Target value needed to succeed
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function startChallengeCardPhase(
  statType,
  targetValue,
  gameState,
  handlers
) {
  // Get hand size (Focus stat)
  const handSize = gameState.gameData.stats.focus || 4;

  // Draw cards up to hand limit from player's deck
  const drawnCards = [];

  for (let i = 0; i < handSize; i++) {
    const card = await drawFromPlayerDeck(gameState);
    if (card) {
      drawnCards.push(card);
    }
  }

  if (drawnCards.length === 0) {
    // No cards to draw - automatic failure
    await handleChallengeResult(
      null,
      false,
      0,
      targetValue,
      statType,
      gameState,
      handlers
    );
    return;
  }

  // Show challenge card selection dialog
  showChallengeCardDialog(
    drawnCards,
    gameState,
    handlers,
    statType,
    targetValue,
    async (selectedCard, success, totalValue, target) => {
      await handleChallengeResult(
        selectedCard,
        success,
        totalValue,
        target,
        statType,
        gameState,
        handlers
      );
    }
  );
}

/**
 * Handle the result of a challenge
 * @param {Object} selectedCard - The card that was played
 * @param {boolean} success - Whether the challenge succeeded
 * @param {number} totalValue - Total value achieved (stat + card)
 * @param {number} targetValue - Target value needed
 * @param {string} statType - Type of stat challenged
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleChallengeResult(
  selectedCard,
  success,
  totalValue,
  targetValue,
  statType,
  gameState,
  handlers
) {
  if (success) {
    // Challenge succeeded - gain XP and trigger boon
    const cardValue = selectedCard ? getCardValue(selectedCard) : 0;

    // Gain XP in the challenged stat using the reusable function
    await gainStatXP(statType, cardValue, gameState);

    // Remove the selected card from the player's deck
    if (selectedCard) {
      removeSelectedCardFromDeck(selectedCard, gameState);
    }

    // Show success message
    const successMessage = getUIMessage('CHALLENGE', 'SUCCESS', {
      xp: cardValue,
      stat: capitalizeFirst(statType),
    });
    showGameMessage(
      successMessage.title,
      successMessage.message,
      successMessage.type,
      successMessage.icon,
      null, // No timeout - player must click to continue
      async () => {
        // After success message, trigger boon
        await triggerChallengeBoon(gameState, handlers);
      }
    );
  } else {
    // Challenge failed - trigger bane
    // Remove the selected card from the player's deck even on failure
    if (selectedCard) {
      removeSelectedCardFromDeck(selectedCard, gameState);
    }

    // Save the game state
    await saveGameState(gameState);

    const failureMessage = getUIMessage('CHALLENGE', 'FAILURE');
    showGameMessage(
      failureMessage.title,
      failureMessage.message,
      failureMessage.type,
      failureMessage.icon,
      null, // No timeout - player must click to continue
      async () => {
        // After failure message, trigger bane
        await triggerChallengeBane(gameState, handlers);
      }
    );
  }
}

/**
 * Remove a selected card from the player's deck
 * @param {Object} selectedCard - The card to remove
 * @param {Object} gameState - Current game state
 */
function removeSelectedCardFromDeck(selectedCard, gameState) {
  if (!gameState.runData?.playerDeck) return;

  // Find and remove the card from the deck
  const cardIndex = gameState.runData.playerDeck.findIndex(
    (card) =>
      card.value === selectedCard.value && card.suit === selectedCard.suit
  );

  if (cardIndex !== -1) {
    const removedCard = gameState.runData.playerDeck.splice(cardIndex, 1)[0];

    // Add to discard pile
    if (!gameState.runData.playerDiscard) {
      gameState.runData.playerDiscard = [];
    }
    gameState.runData.playerDiscard.push(removedCard);
  }
}

/**
 * Trigger a boon after successful challenge
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function triggerChallengeBoon(gameState, handlers) {
  // Draw a boon card from standard deck (like artifact system)
  const drawnCard = await drawFromStandardDeck();

  if (drawnCard) {
    showDeckDrawingAnimation(() => {
      // Process the boon based on the drawn card
      processBoon(drawnCard, gameState).then((boonResult) => {
        // Check if this is a boon that needs a second card draw
        if (boonResult.needsSecondDraw && boonResult.secondDrawMessage) {
          // Show the main boon message first
          showGameMessage(
            boonResult.header,
            boonResult.description,
            'success',
            `${drawnCard.display} ${boonResult.icon}`,
            null, // No timeout
            () =>
              handleBoonSecondDraw(boonResult, drawnCard, gameState, handlers)
          );
        } else {
          // Show the specific boon result using the header and description from gameData
          showGameMessage(
            boonResult.header,
            boonResult.description,
            'success',
            `${drawnCard.display} ${boonResult.icon}`,
            null, // No timeout
            () => handleEventCompletion(handlers)
          );
        }
      });
    }, drawnCard);
  } else {
    // No boon card available
    const noBoonMessage = getUIMessage('CHALLENGE', 'NO_BOON');
    showGameMessage(
      noBoonMessage.title,
      noBoonMessage.message,
      noBoonMessage.type,
      noBoonMessage.icon,
      null,
      () => {
        if (handlers.resetBusyState) {
          handlers.resetBusyState();
          if (handlers.renderOverworldMap) {
            handlers.renderOverworldMap();
          }
        }
      }
    );
  }
}

/**
 * Trigger a bane after failed challenge
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function triggerChallengeBane(gameState, handlers) {
  // Draw a bane card from player's deck (but don't remove it)
  const drawnCard = await getRandomCardFromPlayerDeck(null, 'bane');

  if (drawnCard) {
    showDeckDrawingAnimation(() => {
      // Process the bane based on the drawn card
      processBane(drawnCard, gameState).then((baneResult) => {
        // Check if this is a bane that needs a second card draw
        if (baneResult.needsSecondDraw && baneResult.secondDrawMessage) {
          // Show the main bane message first
          showGameMessage(
            baneResult.header,
            baneResult.description,
            'error',
            `${drawnCard.display} ${baneResult.icon}`,
            null, // No timeout
            () =>
              handleBaneSecondDraw(baneResult, drawnCard, gameState, handlers)
          );
        } else {
          // Show the specific bane result using the header and description from gameData
          showGameMessage(
            baneResult.header,
            baneResult.description,
            'error',
            `${drawnCard.display} ${baneResult.icon}`,
            null, // No timeout
            () => handleEventCompletion(handlers)
          );
        }
      });
    }, drawnCard);
  } else {
    // No bane card available
    const noBaneMessage = getUIMessage('CHALLENGE', 'NO_BANE');
    showGameMessage(
      noBaneMessage.title,
      noBaneMessage.message,
      noBaneMessage.type,
      noBaneMessage.icon,
      null,
      () => {
        if (handlers.resetBusyState) {
          handlers.resetBusyState();
          if (handlers.renderOverworldMap) {
            handlers.renderOverworldMap();
          }
        }
      }
    );
  }
}

/**
 * Handle fight event
 * @param {Object} event - Event object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleFightEvent(event, gameState, _handlers) {
  // Determine enemy type based on event
  const enemyType = event.enemyType || 'power'; // Default to power-based enemy

  // Mark current tile as visited before starting battle
  const currentX = gameState.runData.location.mapX;
  const currentY = gameState.runData.location.mapY;

  if (gameState.runData.map && gameState.runData.map.tiles) {
    const tileIndex = gameState.runData.map.tiles.findIndex(
      (tile) => tile.x === currentX && tile.y === currentY
    );
    if (tileIndex !== -1) {
      gameState.runData.map.tiles[tileIndex].visited = true;
      // Save the updated game state
      await saveGameState(gameState);
    }
  }

  try {
    // Start battle by calling the battle start endpoint
    const response = await fetch('/battle/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enemyType: enemyType,
        enemyId: null, // Regular enemies don't have specific IDs
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to battle page
      window.location.href = data.redirect;
    } else {
      throw new Error(data.error || 'Failed to start battle');
    }
  } catch (error) {
    // Error saving player deck
  }
}

/**
 * Handle rest event
 * @param {Object} event - Event object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleRestEvent(event, gameState, handlers) {
  // Calculate heal amount using constant from gameData
  const healAmount = Math.floor(
    gameState.runData.maxHealth * GAME_CONSTANTS.REST_HEAL_PERCENTAGE
  );
  const actualHealAmount = Math.min(
    healAmount,
    gameState.runData.maxHealth - gameState.runData.health
  );
  const newHealth = Math.min(
    gameState.runData.health + healAmount,
    gameState.runData.maxHealth
  );

  // Update game state health
  gameState.runData.health = newHealth;

  // Update the health display UI
  updateHealthDisplay(gameState.runData.health, gameState.runData.maxHealth);

  const restMessage = getUIMessage('EVENTS', 'REST', {
    amount: actualHealAmount,
  });
  showGameMessage(
    restMessage.title,
    restMessage.message,
    restMessage.type,
    restMessage.icon,
    null, // No timeout
    () => {
      // Callback when message is dismissed (either by timeout or click)
      if (handlers.resetBusyState) {
        handlers.resetBusyState();
        // Re-render the map after resetting busy state
        if (handlers.renderOverworldMap) {
          handlers.renderOverworldMap();
        }
      }
    }
  );
}

/**
 * Handle shop event
 * @param {Object} event - Event object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleShopEvent(event, gameState, handlers) {
  // Generate shop items and costs
  const shopItems = await generateShopItems(gameState);
  const challengeModifier = getChallengeModifier(
    gameState.runData.location.realm,
    gameState.runData.location.level
  );

  // Store shop data in game state
  gameState.runData.shop = {
    items: shopItems,
    challengeModifier: challengeModifier,
    isActive: true,
  };

  // Save the game state with shop data
  await saveGameState(gameState);

  // Show shop interface
  showShopInterface(gameState, handlers);
}

/**
 * Generate shop items for the current shop event
 * @param {Object} gameState - Current game state
 * @returns {Promise<Array>} - Array of shop items
 */
async function generateShopItems(gameState) {
  const items = [];

  // Add basic heal item
  const challengeModifier = getChallengeModifier(
    gameState.runData.location.realm,
    gameState.runData.location.level
  );

  items.push({
    id: 'heal',
    name: 'Heal (10 HP)',
    description: 'Restore 10 health points',
    cost: SHOP_PRICES.basicHeal + challengeModifier - 1,
    type: 'heal',
    emoji: '❤️',
  });

  // Add card removal item
  items.push({
    id: 'cardRemoval',
    name: 'Remove Card',
    description: 'Remove a card from your deck',
    cost: SHOP_PRICES.cardRemoval + challengeModifier - 1,
    type: 'cardRemoval',
    emoji: '🔥',
  });

  // Generate 3 random artifacts for the shop
  const shopArtifacts = await generateShopArtifacts(3, challengeModifier);
  items.push(...shopArtifacts);

  return items;
}

/**
 * Get artifact details from a card (reusable function)
 * This extracts the artifact selection logic from applyArtifact for reuse
 * @param {Object} card - The card object
 * @returns {Object|null} - Artifact details or null if no artifact found
 */
function getArtifactDetailsFromCard(card) {
  const cardValue = card.value;
  const cardSuit = card.suit;

  // Get the artifact key from mappings
  let artifactKey = ARTIFACT_MAPPINGS[cardValue];

  if (!artifactKey) {
    return null;
  }

  // Handle suit-specific mappings
  if (typeof artifactKey === 'object') {
    artifactKey = selectArtifactKeyFromSuit(artifactKey, cardSuit);
  }

  if (!artifactKey) {
    return null;
  }

  // Handle random pools first
  let finalArtifact = null;
  let artifactKeyToStore = artifactKey;

  const poolItems = ARTIFACT_POOL_ITEMS[artifactKey];

  if (poolItems && poolItems.length > 0) {
    // This is a pool - select a random artifact from it
    const selectedPoolKey = getRandomElement(poolItems);
    finalArtifact = ARTIFACT_DETAILS[selectedPoolKey];
    artifactKeyToStore = selectedPoolKey;
  } else {
    // This is a direct artifact - get its details
    finalArtifact = ARTIFACT_DETAILS[artifactKey];
  }

  if (!finalArtifact) {
    return null;
  }

  // For weapons and armor, get the cardCondition from EQUIPMENT
  let effectText = finalArtifact.effectText;
  if (finalArtifact.type === 'weapon') {
    const weaponData = EQUIPMENT.weapons[artifactKeyToStore];
    if (weaponData && weaponData.cardCondition) {
      effectText = weaponData.cardCondition;
    }
  } else if (finalArtifact.type === 'armor') {
    const armorData = EQUIPMENT.armor[artifactKeyToStore];
    if (armorData && armorData.cardCondition) {
      effectText = armorData.cardCondition;
    }
  }

  return {
    artifactKey: artifactKeyToStore,
    details: finalArtifact,
    effectText: effectText,
  };
}

/**
 * Generate a random artifact based on a drawn card
 * This is a reusable function for both boon events and shop items
 * @param {Object} card - The drawn card
 * @returns {Object|null} - Artifact details or null if no artifact found
 */
function generateArtifactFromCard(card) {
  const artifactResult = getArtifactDetailsFromCard(card);

  if (!artifactResult) {
    return null;
  }

  const result = {
    artifactKey: artifactResult.artifactKey,
    details: artifactResult.details,
  };
  return result;
}

/**
 * Generate random equipment items for the shop
 * @param {number} count - Number of items to generate
 * @param {number} challengeModifier - Challenge modifier for pricing
 * @returns {Promise<Array>} - Array of equipment items
 */
async function generateShopArtifacts(count, challengeModifier) {
  const items = [];
  const equipmentCosts = [
    SHOP_PRICES.equipmentOne + challengeModifier - 1,
    SHOP_PRICES.equipmentTwo + challengeModifier - 1,
    SHOP_PRICES.equipmentThree + challengeModifier - 1,
  ];

  // Draw random cards from standard deck until we get the requested number of artifacts
  let attempts = 0;
  const maxAttempts = count * 10; // Prevent infinite loops

  while (items.length < count && attempts < maxAttempts) {
    const drawnCard = await drawFromStandardDeck();
    const cardValue = getCardValue(drawnCard);

    // Use the reusable function to generate artifact
    const artifactResult = generateArtifactFromCard(drawnCard);

    if (artifactResult) {
      const { artifactKey, details } = artifactResult;

      // Use the details from the artifact result directly - don't call getArtifactDetailsFromCard again
      const description = details.effectText || 'A mysterious artifact.';

      const item = {
        id: `equipment_${items.length}`,
        name: details.name,
        description: description,
        cost: equipmentCosts[items.length],
        type: 'equipment',
        emoji: details.emoji,
        artifactKey: artifactKey,
        equipmentType: details.type,
        cardValue: cardValue,
        cardSuit: drawnCard.suit,
      };

      items.push(item);
    }

    attempts++;
  }

  return items;
}

/**
 * Show the shop interface
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function showShopInterface(gameState, handlers) {
  const shopItems = gameState.runData.shop.items;
  const playerCurrency = gameState.runData.runCurrency || 0;
  const playerHealth = gameState.runData.health;
  const playerMaxHealth = gameState.runData.maxHealth;

  // Create shop overlay
  const overlay = document.createElement('div');
  overlay.className = 'shop-overlay';

  // Create shop dialog
  const dialog = document.createElement('div');
  dialog.className = 'shop-dialog';

  // Separate items by type
  const equipmentItems = shopItems.filter((item) => item.type === 'equipment');
  const utilityItems = shopItems.filter((item) => item.type !== 'equipment');

  // Create shop HTML
  let shopHTML = `
    <div class="shop-interface">
      <div class="shop-header">
        <div class="shop-info">
          <span><strong>Currency:</strong> ${playerCurrency}</span>
          <span><strong>Health:</strong> ${playerHealth}/${playerMaxHealth}</span>
        </div>
      </div>

      <!-- Equipment Row -->
      <div class="shop-row">
        <div class="shop-items equipment-row">
  `;

  equipmentItems.forEach((item) => {
    const canAfford = playerCurrency >= item.cost;
    const isPurchased = item.purchased === true;
    const isDisabled = !canAfford || isPurchased;

    shopHTML += `
      <div class="shop-item ${isDisabled ? 'disabled' : ''}">
        <div class="item-header">
          <span class="item-emoji">${item.emoji}</span>
          <span class="item-name">${item.name}</span>
          <span class="item-cost">${item.cost} 💰</span>
        </div>
        <div class="item-description">${item.description}</div>
        <button class="btn btn-primary purchase-btn"
                onclick="purchaseShopItem('${item.id}')"
                ${isDisabled ? 'disabled' : ''}>
          ${isPurchased ? 'Purchased' : !canAfford ? 'Not Enough Currency' : 'Purchase'}
        </button>
      </div>
    `;
  });

  shopHTML += `
        </div>
      </div>

      <!-- Utility Items Row -->
      <div class="shop-row">
        <div class="shop-items utility-row">
  `;

  utilityItems.forEach((item) => {
    const canAfford = playerCurrency >= item.cost;
    const isHealItem = item.type === 'heal';
    const isFullHealth = playerHealth >= playerMaxHealth;
    const isDisabled = (isHealItem && isFullHealth) || !canAfford;

    shopHTML += `
      <div class="shop-item ${isDisabled ? 'disabled' : ''}">
        <div class="item-header">
          <span class="item-emoji">${item.emoji}</span>
          <span class="item-name">${item.name}</span>
          <span class="item-cost">${item.cost} 💰</span>
        </div>
        <div class="item-description">${item.description}</div>
        <button class="btn btn-primary purchase-btn"
                onclick="purchaseShopItem('${item.id}')"
                ${isDisabled ? 'disabled' : ''}>
          ${
            isHealItem && isFullHealth
              ? 'Full Health'
              : !canAfford
                ? 'Not Enough Currency'
                : 'Purchase'
          }
        </button>
      </div>
    `;
  });

  shopHTML += `
        </div>
      </div>

      <div class="shop-actions">
        <button class="btn btn-secondary" onclick="leaveShop()">Leave Shop</button>
      </div>
    </div>
  `;

  dialog.innerHTML = shopHTML;

  // Add dialog to overlay and overlay to page
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Add shop functions to global scope
  window.purchaseShopItem = async (itemId) => {
    // Disable the button immediately to prevent multiple clicks
    const button = event.target;
    if (button) {
      button.disabled = true;
      button.textContent = 'Processing...';
    }

    try {
      await handleShopPurchase(itemId, gameState, handlers);
    } catch (error) {
      // Re-enable button on error
      if (button) {
        button.disabled = false;
        button.textContent = 'Purchase';
      }
    }
  };

  window.leaveShop = () => {
    // Clear shop data
    delete gameState.runData.shop;
    saveGameState(gameState);

    // Remove overlay
    if (overlay.parentElement) {
      overlay.remove();
    }

    // Call completion handlers
    if (handlers.resetBusyState) {
      handlers.resetBusyState();
    }
    if (handlers.renderOverworldMap) {
      handlers.renderOverworldMap();
    }
  };
}

/**
 * Handle shop purchase
 * @param {string} itemId - ID of the item to purchase
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleShopPurchase(itemId, gameState, handlers) {
  const shopItems = gameState.runData.shop.items;
  const item = shopItems.find((i) => i.id === itemId);

  if (!item) {
    showNotification('Error', 'Item not found', 'error');
    return;
  }

  // Check if item is already purchased (for equipment)
  if (item.type === 'equipment' && item.purchased) {
    showNotification('Error', 'Item already purchased', 'error');
    return;
  }

  const playerCurrency = gameState.runData.runCurrency || 0;
  if (playerCurrency < item.cost) {
    showNotification('Error', 'Not enough currency', 'error');
    return;
  }

  // Deduct currency
  gameState.runData.runCurrency = playerCurrency - item.cost;

  let purchaseResult = null;

  // Handle different item types
  switch (item.type) {
    case 'heal':
      purchaseResult = await handleHealPurchase(gameState);
      break;
    case 'cardRemoval':
      purchaseResult = await handleCardRemovalPurchase(gameState, handlers);
      break;
    case 'equipment':
      purchaseResult = await handleEquipmentPurchase(item, gameState);
      break;
    default:
      showNotification('Error', 'Unknown item type', 'error');
      return;
  }

  if (purchaseResult && purchaseResult.success) {
    // Mark equipment items as purchased (but keep heal/card removal available)
    if (item.type === 'equipment') {
      item.purchased = true;
    }

    // Save game state
    await saveGameState(gameState);

    // Show success message
    showNotification('Purchase Successful', purchaseResult.message, 'success');

    // Remove the old shop overlay first
    const existingOverlay = document.querySelector('.shop-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Update shop interface to reflect new currency and purchased items
    showShopInterface(gameState, handlers);

    // Update currency display in main UI after shop interface is refreshed
    if (handlers.updateCurrencyDisplay) {
      handlers.updateCurrencyDisplay(gameState.runData.runCurrency);
    } else {
      // Fallback: import and call updateCurrencyDisplay directly
      const { updateCurrencyDisplay } = await import('./uiUtils.js');
      updateCurrencyDisplay(gameState.runData.runCurrency);
    }
  } else {
    // Refund currency on failure
    gameState.runData.runCurrency = playerCurrency;
    showNotification(
      'Error',
      purchaseResult?.message || 'Purchase failed',
      'error'
    );

    // Update currency display in main UI after refund
    if (handlers.updateCurrencyDisplay) {
      handlers.updateCurrencyDisplay(gameState.runData.runCurrency);
    }
  }
}

/**
 * Handle heal purchase
 * @param {Object} gameState - Current game state
 * @returns {Object} - Purchase result
 */
async function handleHealPurchase(gameState) {
  const healAmount = GAME_CONSTANTS.SHOP_HEAL_AMOUNT;
  const currentHealth = gameState.runData.health;
  const maxHealth = gameState.runData.maxHealth;

  if (currentHealth >= maxHealth) {
    return { success: false, message: 'Already at full health' };
  }

  const newHealth = Math.min(currentHealth + healAmount, maxHealth);
  const actualHeal = newHealth - currentHealth;

  gameState.runData.health = newHealth;

  return {
    success: true,
    message: `Healed for ${actualHeal} HP`,
  };
}

/**
 * Handle card removal purchase
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 * @returns {Object} - Purchase result
 */
async function handleCardRemovalPurchase(gameState, handlers) {
  // Start card removal process similar to the card removal event
  const playerDeck = getDeck(gameState, DECK_TYPES.PLAYER_MAIN);

  if (!playerDeck || playerDeck.length === 0) {
    return { success: false, message: 'No cards to remove' };
  }

  // Draw multiple cards based on hand size (Focus stat) or deck size, whichever is smaller
  const handSize = gameState.gameData.stats.focus || 4;
  const deckSize = playerDeck.length;
  const cardsToDraw = Math.min(handSize, deckSize);
  const drawnCards = [];

  // Draw multiple cards from player's deck
  for (let i = 0; i < cardsToDraw; i++) {
    const card = await drawFromPlayerDeck(gameState);
    if (card) {
      drawnCards.push(card);
    }
  }

  // Show multi-card remove dialog
  showMultiCardRemoveDialog(drawnCards, gameState, handlers, applyRemoveCard);

  return { success: true, message: 'Select a card to remove' };
}

/**
 * Handle equipment purchase
 * @param {Object} item - Shop item
 * @param {Object} gameState - Current game state
 * @returns {Object} - Purchase result
 */
async function handleEquipmentPurchase(item, gameState) {
  const artifactKey = item.artifactKey;
  const artifactDetails = ARTIFACT_DETAILS[artifactKey];

  if (!artifactDetails) {
    return { success: false, message: 'Equipment not found' };
  }

  // Add equipment to inventory
  if (!gameState.runData.equipment) {
    gameState.runData.equipment = [];
  }

  const equipmentItem = {
    type: artifactDetails.type || 'artifact',
    value: artifactKey,
    equipped: false,
  };

  gameState.runData.equipment.push(equipmentItem);

  // Apply artifact effects if it's an artifact (not weapon/armor)
  if (artifactDetails.type === 'artifact') {
    await applyArtifactEffects(artifactKey, gameState);
  }

  // Handle inventory overflow
  await handleInventoryOverflow(gameState, () => {
    // Callback after overflow handling
  });

  return {
    success: true,
    message: `Gained ${artifactDetails.emoji} ${artifactDetails.name}`,
  };
}

/**
 * Handle add card boon effect
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleAddCardBoon(gameState, handlers) {
  // Draw multiple cards based on hand size (Focus stat)
  const handSize = gameState.gameData.stats.focus || 4;
  const drawnCards = [];

  // Draw multiple cards from standard deck
  for (let i = 0; i < handSize; i++) {
    const card = await drawFromStandardDeck();
    if (card) {
      drawnCards.push(card);
    }
  }

  // Show multi-card choice dialog (no drawing animation)
  showMultiCardChoiceDialog(drawnCards, gameState, handlers, applyAddCard);
}

/**
 * Handle remove card boon effect
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleRemoveCardBoon(gameState, handlers) {
  // Draw multiple cards based on hand size (Focus stat) or deck size, whichever is smaller
  const handSize = gameState.gameData.stats.focus || 4;
  const deckSize = gameState.runData?.playerDeck?.length || 0;
  const cardsToDraw = Math.min(handSize, deckSize);
  const drawnCards = [];

  // Draw multiple cards from player's deck
  for (let i = 0; i < cardsToDraw; i++) {
    const card = await drawFromPlayerDeck(gameState);
    if (card) {
      drawnCards.push(card);
    }
  }

  // Show multi-card remove dialog (no drawing animation)
  showMultiCardRemoveDialog(drawnCards, gameState, handlers, applyRemoveCard);
}

/**
 * Handle artifact boon effect
 * @param {Object} boonResult - Boon result object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleArtifactBoon(boonResult, gameState, handlers) {
  // Force draw a 10 for artifact events (charm pool)
  const secondCard = {
    value: '10',
    suit: '♠', // Default suit, will be randomized
    display: '10♠',
    code: '10♠',
  };

  // Randomize the suit for variety
  const randomSuit = getRandomElement(STANDARD_SUITS);
  secondCard.suit = randomSuit;
  secondCard.display = `10${randomSuit}`;
  secondCard.code = `10${randomSuit}`;

  // Show deck drawing animation for artifacts
  showDeckDrawingAnimation(() => {
    // Artifact - handle with promise
    const effectPromise = applyArtifact(secondCard, gameState);

    effectPromise.then(async (result) => {
      const suitSymbol = SUIT_TO_EMOJI_MAP[secondCard.suit] || secondCard.suit;
      const cardDisplay = `${secondCard.value}${suitSymbol}`;

      let cardIcon;
      let artifactTitle;
      let artifactDescription;
      if (result.applied) {
        const artifactDetails = ARTIFACT_DETAILS[result.artifactGained];

        cardIcon = cardDisplay;
        artifactTitle = `${artifactDetails.emoji} ${artifactDetails.name}`;

        if (artifactDetails.type === 'weapon') {
          const weaponData = EQUIPMENT.weapons[result.artifactGained];
          artifactDescription = `<strong style="color: #FFD700;">Weapon:</strong> ${weaponData.cardCondition}`;
        } else if (artifactDetails.type === 'armor') {
          const armorData = EQUIPMENT.armor[result.artifactGained];
          artifactDescription = `<strong style="color: #FFD700;">Armor:</strong> ${armorData.cardCondition}`;
        } else {
          artifactDescription = artifactDetails.effectText;
        }
      } else {
        artifactTitle = boonResult.header;
        artifactDescription = UI_MESSAGES.CARD_EFFECTS.DRAW_NO_ARTIFACT.replace(
          '{card}',
          cardDisplay
        );
      }

      showGameMessage(
        artifactTitle,
        artifactDescription,
        'info',
        cardIcon,
        null, // No timeout
        () => handleEventCompletion(handlers)
      );
    });
  }, secondCard);
}

/**
 * Handle standard boon effects (currency gain, stat XP gain)
 * @param {Object} boonResult - Boon result object
 * @param {Object} secondCard - Second drawn card
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleStandardBoonEffect(boonResult, secondCard, gameState, handlers) {
  // Show deck drawing animation for other boon types
  showDeckDrawingAnimation(() => {
    // Apply the appropriate effect based on boon type
    let effectPromise;
    if (boonResult.header === UI_MESSAGES.BOON_HEADERS.FIND_TREASURE) {
      // Apply currency gain
      effectPromise = applyCurrencyGain(secondCard, gameState);
    } else if (boonResult.header === UI_MESSAGES.BOON_HEADERS.LEARN_SOMETHING) {
      // Apply stat XP gain
      effectPromise = applyStatXpGain(secondCard, gameState);
    }

    // Only proceed with promise handling if we have an effectPromise
    if (effectPromise) {
      effectPromise.then(async (result) => {
        const suitSymbol =
          SUIT_TO_EMOJI_MAP[secondCard.suit] || secondCard.suit;
        let message;

        if (boonResult.header === UI_MESSAGES.BOON_HEADERS.FIND_TREASURE) {
          // Currency gain message - use the simplified description from the function
          message = result.description;

          // Update currency display in the UI
          const { updateCurrencyDisplay } = await import('./uiUtils.js');
          updateCurrencyDisplay(
            result.originalCurrency + result.currencyGained
          );
        } else if (
          boonResult.header === UI_MESSAGES.BOON_HEADERS.LEARN_SOMETHING
        ) {
          // Stat XP gain message - use the simplified description from the function
          message = result.description;
        }

        // Build card display for all cards drawn
        let cardDisplay;
        if (
          (boonResult.header === UI_MESSAGES.BOON_HEADERS.LEARN_SOMETHING ||
            boonResult.header === UI_MESSAGES.BOON_HEADERS.FIND_TREASURE) &&
          result.allCardsDrawn
        ) {
          // Show all cards drawn for XP gain or currency gain
          const allCardDisplays = result.allCardsDrawn.map((card) => {
            const cardSuitSymbol = SUIT_TO_EMOJI_MAP[card.suit] || card.suit;
            return `${card.value}${cardSuitSymbol}`;
          });
          cardDisplay = `${allCardDisplays.join(' ')} ${boonResult.icon}`;
        } else {
          // Show single card for other events
          cardDisplay = `${secondCard.value}${suitSymbol} ${boonResult.icon}`;
        }

        showGameMessage(
          boonResult.header,
          message,
          'info',
          cardDisplay,
          null, // No timeout
          () => handleEventCompletion(handlers)
        );
      });
    }
  }, secondCard);
}

/**
 * Handle second card draw for boon effects
 * @param {Object} boonResult - Boon result object
 * @param {Object} drawnCard - First drawn card
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleBoonSecondDraw(boonResult, drawnCard, gameState, handlers) {
  // Go directly to drawing the second card for currency gain
  let drawPromise;
  if (boonResult.secondDrawDeck === 'player') {
    // For currency gain, get card without removing it
    drawPromise = getRandomCardFromPlayerDeck(null, 'boon');
  } else if (boonResult.secondDrawDeck === 'standard') {
    // For addCard, draw from standard deck
    drawPromise = drawFromStandardDeck();
  } else {
    // Fallback to player's personal deck
    drawPromise = getRandomCardFromPlayerDeck(null, 'boon');
  }

  drawPromise.then((secondCard) => {
    if (secondCard) {
      // Handle add card case separately (no drawing animation)
      if (boonResult.header === UI_MESSAGES.BOON_HEADERS.DISCOVER_POTENTIAL) {
        handleAddCardBoon(gameState, handlers);
        return; // Exit early, don't continue with promise handling
      }

      // Handle remove card case separately (no drawing animation)
      if (boonResult.header === UI_MESSAGES.BOON_HEADERS.PURGE_WEAKNESS) {
        handleRemoveCardBoon(gameState, handlers);
        return; // Exit early, don't continue with promise handling
      }

      // Handle artifact case separately (no drawing animation)
      if (boonResult.header === UI_MESSAGES.BOON_HEADERS.FIND_ARTIFACT) {
        handleArtifactBoon(boonResult, gameState, handlers);
        return; // Exit early, don't continue with promise handling
      }

      // Handle standard boon effects
      handleStandardBoonEffect(boonResult, secondCard, gameState, handlers);
    }
  });
}

/**
 * Handle boon event
 * @param {Object} event - Event object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleBoonEvent(event, gameState, handlers) {
  // Show initial blessing message
  const blessingMessage = getUIMessage('EVENTS', 'BLESSING');
  showGameMessage(
    blessingMessage.title,
    blessingMessage.message,
    blessingMessage.type,
    blessingMessage.icon,
    null, // No timeout
    () => {
      // Draw from player's deck first (but don't remove the card)
      getRandomCardFromPlayerDeck(null, 'boon').then((drawnCard) => {
        if (drawnCard) {
          // Show deck drawing animation with the actual drawn card
          showDeckDrawingAnimation(() => {
            // Process the boon based on the drawn card
            processBoon(drawnCard, gameState).then((boonResult) => {
              // Check if this is a boon that needs a second card draw
              if (boonResult.needsSecondDraw && boonResult.secondDrawMessage) {
                // Show the main boon message first
                showGameMessage(
                  boonResult.header,
                  boonResult.description,
                  'success',
                  `${drawnCard.display} ${boonResult.icon}`,
                  null, // No timeout
                  () =>
                    handleBoonSecondDraw(
                      boonResult,
                      drawnCard,
                      gameState,
                      handlers
                    )
                );
              } else {
                // Show the specific boon result using the header and description from gameData
                showGameMessage(
                  boonResult.header,
                  boonResult.description,
                  'success',
                  `${drawnCard.display} ${boonResult.icon}`,
                  null, // No timeout
                  () => handleEventCompletion(handlers)
                );
              }
            });
          }, drawnCard);
        }
      });
    }
  );
}

/**
 * Get the appropriate draw promise for bane effects
 * @param {Object} baneResult - Bane result object
 * @returns {Promise} - Draw promise
 */
function getBaneDrawPromise(baneResult) {
  if (baneResult.secondDrawDeck === 'player') {
    // For both stat loss and currency loss, get card without removing it
    // The card is just used to determine the effect, not actually lost
    return getRandomCardFromPlayerDeck(null, 'bane');
  } else if (baneResult.secondDrawDeck === 'playerHighCards') {
    // Pick from high cards in player's personal deck (for loseHighCard)
    return pickRandomHighCard(baneResult.highCards);
  } else if (baneResult.secondDrawDeck === 'playerFaceCards') {
    // Pick from face cards in player's personal deck (for loseFaceCard)
    return pickRandomFaceCard(baneResult.faceCards);
  } else {
    // Fallback to player's personal deck
    return drawAndRemoveCardFromPlayerDeck();
  }
}

/**
 * Get the appropriate effect promise for bane effects
 * @param {Object} baneResult - Bane result object
 * @param {Object} secondCard - Second drawn card
 * @param {Object} gameState - Current game state
 * @returns {Promise} - Effect promise
 */
function getBaneEffectPromise(baneResult, secondCard, gameState) {
  if (baneResult.secondDrawDeck === 'player') {
    // Check if this is a stat loss or currency loss
    if (baneResult.header === UI_MESSAGES.BANE_HEADERS.FEEL_WEAKER) {
      // Apply stat loss
      return applyStatLoss(secondCard, gameState);
    } else {
      // Apply currency loss
      return applyCurrencyLoss(secondCard, gameState);
    }
  } else if (baneResult.secondDrawDeck === 'playerHighCards') {
    // Apply high card loss
    return applyHighCardLoss(secondCard, gameState);
  } else if (baneResult.secondDrawDeck === 'playerFaceCards') {
    // Apply face card loss
    return applyFaceCardLoss(secondCard, gameState);
  }
  return null;
}

/**
 * Build bane result message
 * @param {Object} baneResult - Bane result object
 * @param {Object} secondCard - Second drawn card
 * @param {Object} result - Effect result
 * @returns {Object} - Message object with title and message
 */
function buildBaneResultMessage(baneResult, secondCard, result) {
  const suitSymbol = SUIT_TO_EMOJI_MAP[secondCard.suit] || secondCard.suit;
  let message;
  let messageTitle = baneResult.header; // Default title

  if (baneResult.secondDrawDeck === 'player') {
    // Currency loss message
    const cardDisplay = `${secondCard.value}${suitSymbol}`;

    let messageConfig;
    if (result.currencyLost === 0) {
      // No currency to lose
      messageConfig = baneResult.messages?.noCurrency || {
        title: UI_MESSAGES.CARD_EFFECTS.EMPTY_POCKETS.title,
        message: UI_MESSAGES.CARD_EFFECTS.EMPTY_POCKETS.message,
      };
    } else if (result.currencyLost < result.cardValue) {
      // Partial loss
      messageConfig = baneResult.messages?.partialLoss || {
        title: UI_MESSAGES.CARD_EFFECTS.MISSING_TREASURE.title,
        message: UI_MESSAGES.CARD_EFFECTS.MISSING_TREASURE.message,
      };
    } else {
      // Full loss
      messageConfig = baneResult.messages?.fullLoss || {
        title: UI_MESSAGES.CARD_EFFECTS.MISSING_TREASURE_FULL.title,
        message: UI_MESSAGES.CARD_EFFECTS.MISSING_TREASURE_FULL.message
          .replace('{card}', cardDisplay)
          .replace('{amount}', result.currencyLost),
      };
      if (messageConfig.message.includes('{card}')) {
        messageConfig.message = messageConfig.message
          .replace('{card}', cardDisplay)
          .replace('{amount}', result.currencyLost);
      }
    }

    message = messageConfig.message;
    messageTitle = messageConfig.title;
  } else {
    // Card loss message
    message = UI_MESSAGES.CARD_EFFECTS.CARD_LOST.replace(
      '{card}',
      `${secondCard.value}${suitSymbol}`
    );
  }

  // Handle stat loss message
  if (baneResult.header === UI_MESSAGES.BANE_HEADERS.FEEL_WEAKER) {
    // Stat loss message
    const statToLose = SUIT_TO_STAT_MAP[secondCard.suit] || 'power';
    message = UI_MESSAGES.CARD_EFFECTS.DRAW_AND_LOSE_STAT.replace(
      '{card}',
      suitSymbol
    ).replace('{stat}', statToLose);
    messageTitle = baneResult.header;
  }

  return { message, messageTitle, suitSymbol };
}

/**
 * Handle second card draw for bane effects
 * @param {Object} baneResult - Bane result object
 * @param {Object} drawnCard - First drawn card
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleBaneSecondDraw(baneResult, drawnCard, gameState, handlers) {
  // Go directly to drawing the second card for all bane effects
  const drawPromise = getBaneDrawPromise(baneResult);

  drawPromise.then((secondCard) => {
    if (secondCard) {
      // Show deck drawing animation for second card
      showDeckDrawingAnimation(() => {
        // Apply the appropriate effect based on bane type
        const effectPromise = getBaneEffectPromise(
          baneResult,
          secondCard,
          gameState
        );

        if (effectPromise) {
          effectPromise.then((result) => {
            const { message, messageTitle, suitSymbol } =
              buildBaneResultMessage(baneResult, secondCard, result);

            showGameMessage(
              messageTitle,
              message,
              'error',
              `${secondCard.value}${suitSymbol} ${baneResult.icon}`,
              null, // No timeout
              () => handleEventCompletion(handlers)
            );
          });
        }
      }, secondCard);
    }
  });
}

/**
 * Handle bane event
 * @param {Object} event - Event object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleBaneEvent(event, gameState, handlers) {
  // Show initial misfortune message
  const misfortuneMessage = getUIMessage('EVENTS', 'MISFORTUNE');
  showGameMessage(
    misfortuneMessage.title,
    misfortuneMessage.message,
    misfortuneMessage.type,
    misfortuneMessage.icon,
    null, // No timeout
    () => {
      // Draw from player's deck first
      getRandomCardFromPlayerDeck(null, 'bane').then((drawnCard) => {
        if (drawnCard) {
          // Show deck drawing animation with the actual drawn card
          showDeckDrawingAnimation(() => {
            // Process the bane based on the drawn card
            processBane(drawnCard, gameState).then((baneResult) => {
              // Check if this is a bane that needs a second card draw
              if (baneResult.needsSecondDraw && baneResult.secondDrawMessage) {
                // Show the main bane message first
                showGameMessage(
                  baneResult.header,
                  baneResult.description,
                  'error',
                  `${drawnCard.display} ${baneResult.icon}`,
                  null, // No timeout
                  () =>
                    handleBaneSecondDraw(
                      baneResult,
                      drawnCard,
                      gameState,
                      handlers
                    )
                );
              } else {
                // Show the specific bane result using the header and description from gameData
                showGameMessage(
                  baneResult.header,
                  baneResult.description,
                  'error',
                  `${drawnCard.display} ${baneResult.icon}`,
                  null, // No timeout
                  () => handleEventCompletion(handlers)
                );
              }
            });
          }, drawnCard);
        }
      });
    }
  );
}

/**
 * Handle nothing event
 * @param {Object} event - Event object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
function handleNothingEvent(event, gameState, handlers) {
  showGameMessage(
    'Nothing Happens',
    'You find nothing of interest in this place.',
    'nothing',
    '🍂',
    ANIMATION_TIMING.MESSAGE_TIMEOUT,
    () => {
      // Callback when message is dismissed (either by timeout or click)
      if (handlers.resetBusyState) {
        handlers.resetBusyState();
        // Re-render the map after resetting busy state
        if (handlers.renderOverworldMap) {
          handlers.renderOverworldMap();
        }
      }
    }
  );
}

/**
 * Handle boss event
 * @param {Object} event - Event object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
async function handleBossEvent(event, gameState, _handlers) {
  // Determine boss ID based on event or realm
  const bossId = event.bossId || gameState.runData.location.realm || 1;

  // Mark current tile as visited before starting battle
  const currentX = gameState.runData.location.mapX;
  const currentY = gameState.runData.location.mapY;

  if (gameState.runData.map && gameState.runData.map.tiles) {
    const tileIndex = gameState.runData.map.tiles.findIndex(
      (tile) => tile.x === currentX && tile.y === currentY
    );
    if (tileIndex !== -1) {
      gameState.runData.map.tiles[tileIndex].visited = true;
      // Save the updated game state
      await saveGameState(gameState);
    }
  }

  try {
    // Start boss battle by calling the battle start endpoint
    const response = await fetch('/battle/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enemyType: 'boss',
        enemyId: bossId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to battle page
      window.location.href = data.redirect;
    } else {
      throw new Error(data.error || 'Failed to start boss battle');
    }
  } catch (error) {
    // Error saving player deck
  }
}

/**
 * Common callback function for resetting busy state and re-rendering map
 * @param {Object} handlers - Handler functions
 */
function handleEventCompletion(handlers) {
  if (handlers.resetBusyState) {
    handlers.resetBusyState();
    // Re-render the map after resetting busy state
    if (handlers.renderOverworldMap) {
      handlers.renderOverworldMap();
    }
  }
}
