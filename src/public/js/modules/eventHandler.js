// eventHandler.js - Event processing logic

import { getCardValue } from './gameUtils.js';
import {
  showNotification,
  showGameMessage,
  showDeckDrawingAnimation,
} from './uiUtils.js';
import {
  EVENTS,
  GAME_CONSTANTS,
  BOONS,
  BANES,
  ARTIFACTS,
  CARD_ADDING_EFFECTS,
  BANE_AND_BOON_EFFECTS,
} from './gameData.js';
import { drawFromPlayerDeck } from '../game.js';

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
    }
  } catch (error) {
    // Error saving player deck
  }
}

/**
 * Save the current game state to the server
 * @param {Object} gameState - The current game state
 */
async function saveGameState(gameState) {
  try {
    const response = await fetch('/game/update-game-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameState),
    });

    const data = await response.json();
    if (!data.success) {
      // Failed to save game state
    }
  } catch (error) {
    // Error saving game state
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
    showGameMessage(
      'Nothing Happens',
      'You find nothing of interest in this place.',
      'nothing',
      '🍂',
      4000,
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
      handlers.startBattle(event.enemy, gameState.playerPosition);
      break;
    case 'challenge':
      handlers.startChallenge(event.stat, gameState.playerPosition);
      break;
    case 'rest': {
      // Calculate heal amount using constant from gameData
      const healAmount = Math.floor(
        gameState.maxHealth * GAME_CONSTANTS.REST_HEAL_PERCENTAGE
      );
      const actualHealAmount = Math.min(
        healAmount,
        gameState.maxHealth - gameState.health
      );
      const newHealth = Math.min(
        gameState.health + healAmount,
        gameState.maxHealth
      );

      // Update game state health
      gameState.health = newHealth;

      showGameMessage(
        'Rest Complete',
        `You rest and recover ${actualHealAmount} health.`,
        'success',
        '🏕️',
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
      break;
    }
    case 'shop':
      handlers.startShop(gameState.playerPosition);
      break;
    case 'boon': {
      // Show initial blessing message
      showGameMessage(
        'Blessing',
        'The fates smile upon you! Draw a card from your deck to receive a boon.',
        'success',
        '✨',
        null, // No timeout
        () => {
          // Draw from player's deck first
          drawFromPlayerDeck().then((drawnCard) => {
            if (drawnCard) {
              // Show deck drawing animation with the actual drawn card
              showDeckDrawingAnimation(() => {
                // Process the boon based on the drawn card
                processBoon(drawnCard, gameState).then((boonResult) => {
                  // Show the specific boon result using the header and description from gameData
                  showGameMessage(
                    boonResult.header,
                    boonResult.description,
                    'success',
                    `${drawnCard.display} ${boonResult.icon}`,
                    null, // No timeout
                    () => {
                      // Callback when message is dismissed
                      if (handlers.resetBusyState) {
                        handlers.resetBusyState();
                        // Re-render the map after resetting busy state
                        if (handlers.renderOverworldMap) {
                          handlers.renderOverworldMap();
                        }
                      }
                    }
                  );
                });
              }, drawnCard);
            }
          });
        }
      );
      break;
    }
    case 'bane': {
      // Show initial misfortune message
      showGameMessage(
        'Misfortune',
        'The fates frown upon you! Draw a card from your deck to receive a bane.',
        'error',
        '🌩️',
        null, // No timeout
        () => {
          // Draw from player's deck first
          drawFromPlayerDeck().then((drawnCard) => {
            if (drawnCard) {
              // Show deck drawing animation with the actual drawn card
              showDeckDrawingAnimation(() => {
                // Process the bane based on the drawn card
                processBane(drawnCard, gameState).then((baneResult) => {
                  // Show the specific bane result using the header and description from gameData
                  showGameMessage(
                    baneResult.header,
                    baneResult.description,
                    'error',
                    `${drawnCard.display} ${baneResult.icon}`,
                    null, // No timeout
                    () => {
                      // Callback when message is dismissed
                      if (handlers.resetBusyState) {
                        handlers.resetBusyState();
                        // Re-render the map after resetting busy state
                        if (handlers.renderOverworldMap) {
                          handlers.renderOverworldMap();
                        }
                      }
                    }
                  );
                });
              }, drawnCard);
            }
          });
        }
      );
      break;
    }
    case 'nothing':
      showGameMessage(
        'Nothing Happens',
        'You find nothing of interest in this place.',
        'nothing',
        '🍂',
        4000,
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
      break;
    case 'boss':
      handlers.startBossBattle(gameState.playerPosition);
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

    // Wait 0.5 seconds for player to see the revealed card
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

      // Wait another 0.5 seconds for player to see they moved
      setTimeout(() => {
        // Trigger the encounter
        handleCardEvent(updatedMapCell, newPosition, gameState, handlers);
      }, 500);
    }, 500);
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
  showNotification(
    'Battle Encounter',
    `A ${enemyType}-focused enemy appears!`,
    'warning'
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
  showNotification(
    'Stat Challenge',
    `You must prove your ${statType}!`,
    'info'
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
  showNotification('Shop Encounter', 'A merchant offers their wares.', 'info');

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
  const healAmount = Math.floor(gameState.player.maxHealth * 0.5);
  gameState.player.health = Math.min(
    gameState.player.health + healAmount,
    gameState.player.maxHealth
  );

  showGameMessage(
    'Rest Complete',
    `You rest and recover ${healAmount} health.`,
    'success',
    '🏕️',
    4000
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
  showGameMessage(
    'Boon Received',
    'You receive a beneficial effect!',
    'success',
    '🌟',
    4000
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
  showGameMessage(
    'Bane Received',
    'You suffer a negative effect!',
    'error',
    '🌧️',
    4000
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
  showNotification('Boss Battle', 'A powerful boss appears!', 'warning');

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
  const cardValue = getCardValue(card);
  const cardSuit = card.suit;

  // Convert suit symbols to suit names for BOONS lookup
  const suitSymbolToName = {
    '♠': 'spade',
    '♥': 'heart',
    '♦': 'diamond',
    '♣': 'club',
  };
  const cardSuitName = suitSymbolToName[cardSuit];
  const isRed = cardSuit === '♥' || cardSuit === '♦';

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
  const cardValue = getCardValue(card);
  const cardSuit = card.suit;
  const isRed = cardSuit === 'hearts' || cardSuit === 'diamonds';

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
      description: 'Nothing happens',
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
      gameState[stat] = (gameState[stat] || 0) + value;
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
      gameState[stat] = (gameState[stat] || 0) + 2;
      return {
        description: `+2 to ${stat}`,
        applied: true,
      };
    }

    case 'statXpGain': {
      const xpGain = getCardValue(card);
      // For now, add to power XP as default
      gameState.powerXP = (gameState.powerXP || 0) + xpGain;
      return {
        description: `+${xpGain} Power XP`,
        applied: true,
      };
    }

    case 'currencyGain': {
      const currencyGain = getCardValue(card);
      gameState.currency = (gameState.currency || 0) + currencyGain;
      return {
        description: `+${currencyGain} currency`,
        applied: true,
      };
    }

    case 'artifact': {
      // Handle artifact based on card value string (not numeric value)
      const cardValueString = card.value; // Use the card's value string ('K', 'Q', etc.)
      const artifact = ARTIFACTS[cardValueString];
      if (artifact) {
        if (artifact.type === 'random' && artifact.pool) {
          const randomArtifact =
            artifact.pool[Math.floor(Math.random() * artifact.pool.length)];
          return {
            description: `Gained artifact: ${randomArtifact.name}`,
            applied: true,
          };
        } else if (artifact.type === 'equipment') {
          return {
            description: `Gained equipment: ${artifact.equipmentType}`,
            applied: true,
          };
        }
      }
      return {
        description: 'Gained a random artifact',
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
        description: 'Unknown boon effect',
        applied: false,
      };
  }
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
      description: 'Nothing happens',
      applied: false,
    };
  }

  switch (baneEffect.type) {
    case 'loseItem': {
      // For now, just return the effect description
      return {
        description: 'Lose a random item',
        applied: true,
      };
    }

    case 'loseStat': {
      // For now, just return the effect description
      return {
        description: 'Lose 1 stat point',
        applied: true,
      };
    }

    case 'loseHighCard': {
      // For now, just return the effect description
      return {
        description: 'Lose a high card from your deck',
        applied: true,
      };
    }

    case 'loseFaceCard': {
      // For now, just return the effect description
      return {
        description: 'Lose a face card from your deck',
        applied: true,
      };
    }

    case 'loseCurrency': {
      const currencyLoss = getCardValue(card);
      gameState.currency = Math.max(
        0,
        (gameState.currency || 0) - currencyLoss
      );
      return {
        description: `Lose ${currencyLoss} currency`,
        applied: true,
      };
    }

    case 'addJoker': {
      const jokerAmount = baneEffect.amount || 1;
      // Add jokers to the player's deck
      if (
        gameState.runData &&
        gameState.runData.fightStatus &&
        gameState.runData.fightStatus.playerDeck
      ) {
        for (let i = 0; i < jokerAmount; i++) {
          gameState.runData.fightStatus.playerDeck.push({
            value: '𝕁',
            suit: '🃏',
            type: 'joker',
          });
        }
        // Save the updated deck to the server
        await savePlayerDeck(gameState.runData.fightStatus.playerDeck);
      }
      return {
        description: `Add ${jokerAmount} joker(s) to your deck`,
        applied: true,
      };
    }

    default:
      return {
        description: 'Unknown bane effect',
        applied: false,
      };
  }
}
