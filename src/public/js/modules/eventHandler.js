// eventHandler.js - Event processing logic

import { getCardValue, applyStatChanges } from './gameUtils.js';
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
  BANE_AND_BOON_EFFECTS,
  SUIT_TO_STAT_MAP,
  SUIT_TO_EMOJI_MAP,
  ARTIFACTS,
  CARD_ADDING_EFFECTS,
  NEGATIVE_CARD_VALUES,
} from './gameData.js';
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
} from './deckService.js';

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
          drawAndRemoveCardFromPlayerDeck().then((drawnCard) => {
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
          getRandomCardFromPlayerDeck().then((drawnCard) => {
            if (drawnCard) {
              // Show deck drawing animation with the actual drawn card
              showDeckDrawingAnimation(() => {
                // Process the bane based on the drawn card
                processBane(drawnCard, gameState).then((baneResult) => {
                  // Check if this is a bane that needs a second card draw
                  if (
                    baneResult.needsSecondDraw &&
                    baneResult.secondDrawMessage
                  ) {
                    // Show the main bane message first
                    showGameMessage(
                      baneResult.header,
                      baneResult.description,
                      'error',
                      `${drawnCard.display} ${baneResult.icon}`,
                      null, // No timeout
                      () => {
                        // Go directly to drawing the second card for all bane effects
                        // Determine which deck to draw from based on secondDrawDeck
                        let drawPromise;
                        if (baneResult.secondDrawDeck === 'player') {
                          // For both stat loss and currency loss, get card without removing it
                          // The card is just used to determine the effect, not actually lost
                          drawPromise = getRandomCardFromPlayerDeck();
                        } else if (
                          baneResult.secondDrawDeck === 'playerHighCards'
                        ) {
                          // Pick from high cards in player's personal deck (for loseHighCard)
                          drawPromise = pickRandomHighCard(
                            baneResult.highCards
                          );
                        } else if (
                          baneResult.secondDrawDeck === 'playerFaceCards'
                        ) {
                          // Pick from face cards in player's personal deck (for loseFaceCard)
                          drawPromise = pickRandomFaceCard(
                            baneResult.faceCards
                          );
                        } else {
                          // Fallback to player's personal deck
                          drawPromise = drawAndRemoveCardFromPlayerDeck();
                        }

                        drawPromise.then((secondCard) => {
                          if (secondCard) {
                            // Show deck drawing animation for second card
                            showDeckDrawingAnimation(() => {
                              // Apply the appropriate effect based on bane type
                              let effectPromise;
                              if (baneResult.secondDrawDeck === 'player') {
                                // Check if this is a stat loss or currency loss
                                if (
                                  baneResult.header === 'You feel a bit weaker'
                                ) {
                                  // Apply stat loss
                                  effectPromise = applyStatLoss(
                                    secondCard,
                                    gameState
                                  );
                                } else {
                                  // Apply currency loss
                                  effectPromise = applyCurrencyLoss(
                                    secondCard,
                                    gameState
                                  );
                                }
                              } else if (
                                baneResult.secondDrawDeck === 'playerHighCards'
                              ) {
                                // Apply high card loss
                                effectPromise = applyHighCardLoss(
                                  secondCard,
                                  gameState
                                );
                              } else if (
                                baneResult.secondDrawDeck === 'playerFaceCards'
                              ) {
                                // Apply face card loss
                                effectPromise = applyFaceCardLoss(
                                  secondCard,
                                  gameState
                                );
                              }

                              effectPromise.then((result) => {
                                const suitSymbol =
                                  SUIT_TO_EMOJI_MAP[secondCard.suit] ||
                                  secondCard.suit;
                                let message;
                                let messageTitle = baneResult.header; // Default title

                                if (baneResult.secondDrawDeck === 'player') {
                                  // Currency loss message
                                  const cardDisplay = `${secondCard.value}${suitSymbol}`;

                                  let messageConfig;
                                  if (result.currencyLost === 0) {
                                    // No currency to lose
                                    messageConfig = baneResult.messages
                                      ?.noCurrency || {
                                      title: 'Empty pockets',
                                      message:
                                        'You realize you had nothing to lose.',
                                    };
                                  } else if (
                                    result.currencyLost < result.cardValue
                                  ) {
                                    // Partial loss
                                    messageConfig = baneResult.messages
                                      ?.partialLoss || {
                                      title: 'Missing treasure',
                                      message: 'You lost what little you had.',
                                    };
                                  } else {
                                    // Full loss
                                    messageConfig = baneResult.messages
                                      ?.fullLoss || {
                                      title: 'Missing treasure',
                                      message: `You draw ${cardDisplay} and lose ${result.currencyLost} currency.`,
                                    };
                                    if (
                                      messageConfig.message.includes('{card}')
                                    ) {
                                      messageConfig.message =
                                        messageConfig.message
                                          .replace('{card}', cardDisplay)
                                          .replace(
                                            '{amount}',
                                            result.currencyLost
                                          );
                                    }
                                  }

                                  message = messageConfig.message;
                                  messageTitle = messageConfig.title;
                                } else {
                                  // Card loss message
                                  message = `You lose your ${secondCard.value}${suitSymbol}.`;
                                }

                                // Handle stat loss message
                                if (
                                  baneResult.header === 'You feel a bit weaker'
                                ) {
                                  // Stat loss message
                                  const statToLose =
                                    SUIT_TO_STAT_MAP[secondCard.suit] ||
                                    'power';
                                  message = `You drew ${suitSymbol} and lose 1 ${statToLose}.`;
                                  messageTitle = baneResult.header;
                                }

                                showGameMessage(
                                  messageTitle,
                                  message,
                                  'error',
                                  `${secondCard.value}${suitSymbol} ${baneResult.icon}`,
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
                            }, secondCard);
                          }
                        });
                      }
                    );
                  } else {
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
                  }
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
  const cardValue = card.value; // Use string value directly for BANES lookup
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
      description: 'Or so you thought, you have nothing worthwhile to lose.',
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
      description: `Add ${result.jokerAmount} joker${result.jokerAmount === 1 ? '' : 's'} to your deck.`,
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
      gameState.runData.runCurrency =
        (gameState.runData.runCurrency || 0) + currencyGain;
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
      description: 'Nothing happens',
      applied: false,
    };
  }

  switch (baneEffect.type) {
    case 'loseItem': {
      // Get the player's equipment inventory
      const equipment = gameState.runData?.equipment || [];

      if (equipment.length === 0) {
        return {
          description: 'You have no items to lose',
          applied: false,
        };
      }

      // Randomly select an item to lose
      const randomIndex = Math.floor(Math.random() * equipment.length);
      const lostItem = equipment[randomIndex];

      // Remove the item from the equipment array
      equipment.splice(randomIndex, 1);

      // Save the updated game state to the server
      await saveGameState(gameState);

      // Get the item name for display
      let itemName = lostItem.value;
      const itemType = lostItem.type;

      // Try to get a more descriptive name from EQUIPMENT data
      try {
        const { EQUIPMENT } = await import('./gameData.js');

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
        description: `Lost ${itemName} (${itemType})`,
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
        description: 'Stat loss effect triggered',
        applied: true,
      };
    }

    case 'loseHighCard': {
      // Get high cards from the player's main deck using deck service
      const highCards = getHighCards(gameState, DECK_TYPES.PLAYER_MAIN);

      if (highCards.length === 0) {
        return {
          description: 'You have no high cards to lose',
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
          description: 'You have no face cards to lose',
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
          description: 'You have no currency to lose',
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
        description: 'Unknown bane effect',
        applied: false,
      };
  }
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

  const currencyToLose = Math.min(cardValue, currentCurrency);

  gameState.runData.runCurrency = currentCurrency - currencyToLose;

  await saveGameState(gameState);

  return {
    description: `Lost ${currencyToLose} currency (${card.value}${card.suit})`,
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

  return {
    description: `Lost 1 ${statToLose} (${card.value}${card.suit})`,
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
    description: `Lost ${drawnCard.value}${drawnCard.suit} (high card)`,
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
    description: `Lost ${drawnCard.value}${drawnCard.suit} (face card)`,
    applied: true,
  };
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
      const randomIndex = Math.floor(Math.random() * highCards.length);
      const pickedCard = highCards[randomIndex];

      resolve(pickedCard);
    }, 1000);
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
      const randomIndex = Math.floor(Math.random() * faceCards.length);
      const pickedCard = faceCards[randomIndex];

      resolve(pickedCard);
    }, 1000);
  });
}
