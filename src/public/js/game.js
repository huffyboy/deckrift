// game.js - Page-specific logic for Game

// Import game data constants
import { EVENTS, SUIT_TO_EMOJI_MAP } from './modules/gameData.js';

// Import game utility functions
import {
  getRandomCardDisplay,
  getCardValue,
  convertApiValueToInternal,
  convertInternalValueToApi,
  convertInternalSuitToApi,
  generateEnemyStats as generateEnemyStatsUtil,
  generateBossStats as generateBossStatsUtil,
  generateShopItems as generateShopItemsUtil,
  calculateShopCosts as calculateShopCostsUtil,
  generateBaneEffect as generateBaneEffectUtil,
} from './modules/gameUtils.js';

import { showNotification, updateHealthDisplay } from './modules/uiUtils.js';

// Import event handler functions
import {
  handleCardFlip as handleCardFlipUtil,
  handleCardEvent as handleCardEventUtil,
} from './modules/eventHandler.js';

import {
  drawCardFromDeck,
  DECK_TYPES,
  saveDeckToServer,
} from './modules/deckService.js';

// Game state management
let currentGameState = null;
let currentDeck = null; // Store the current deck state
let isCardSequenceInProgress = false; // Track if card flip/movement is happening
let playerDirection = 'right'; // Track player direction: 'left' or 'right'

// Test mode configuration
const testMode = {
  enabled: true,
  baneCard: { value: '2', suit: '♠' }, // Default test card for bane events (2 for currencyGain)
  boonCard: { value: 'J', suit: '♥' }, // Default test card for boon events
};

// Deck management functions
async function initializeDeck(customCards = null) {
  try {
    let apiUrl =
      'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1';

    // If custom cards are specified, create a custom deck
    if (customCards && customCards.length > 0) {
      // Convert card values to API format
      const apiCards = customCards.map((card) => {
        const apiValue = convertInternalValueToApi(card.value);
        const apiSuit = convertInternalSuitToApi(card.suit);
        return `${apiValue}${apiSuit}`;
      });

      // Create custom deck with specific cards
      apiUrl = `https://deckofcardsapi.com/api/deck/new/shuffle/?cards=${apiCards.join(',')}`;
    }

    // Use Deck of Cards API to create and shuffle a new deck
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.success) {
      currentDeck = {
        deckId: data.deck_id,
        remaining: data.remaining || 52,
        drawnCards: [],
      };
    }
  } catch (error) {
    // Fallback to random selection if API fails
    currentDeck = null;
  }
}

// Function to create a testing deck with only J cards
// To use for testing: replace initializeDeck() with initializeTestingDeck() in initializeGame()
async function initializeTestingDeck() {
  // Create a deck with only J cards (4 suits)
  const jCards = [
    { value: 'A', suit: '♠', display: 'A♠' },
    { value: 'A', suit: '♥', display: 'A♥' },
    { value: 'A', suit: '♦', display: 'A♦' },
    { value: 'A', suit: '♣', display: 'A♣' },
  ];

  return initializeDeck(jCards);
}

// Function to create a custom deck with specific cards
// Example: createCustomDeck(['J♠', 'J♥', 'K♠', 'Q♠', 'A♠'])
async function createCustomDeck(cardStrings) {
  const customCards = cardStrings.map((cardStr) => {
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

    return {
      value,
      suit,
      display: cardStr,
    };
  });

  return initializeDeck(customCards);
}

// Make testing functions available globally for debugging
window.initializeTestingDeck = initializeTestingDeck;
window.createCustomDeck = createCustomDeck;

// Test mode control functions
window.enableTestMode = (
  baneCard = { value: '2', suit: '♠' },
  boonCard = { value: '2', suit: '♠' }
) => {
  testMode.enabled = true;
  testMode.baneCard = baneCard;
  testMode.boonCard = boonCard;
};

window.disableTestMode = () => {
  testMode.enabled = false;
};

window.setTestBaneCard = (card) => {
  testMode.baneCard = card;
};

window.setTestBoonCard = (card) => {
  testMode.boonCard = card;
};

window.getTestMode = () => {
  return { ...testMode };
};

// Helper function to quickly set test cards
window.setTestCard = (value, suit, eventType = 'boon') => {
  testMode.enabled = true;
  if (eventType === 'boon') {
    testMode.boonCard = { value, suit };
  } else {
    testMode.baneCard = { value, suit };
  }
};

// Helper function to set both test cards at once
window.setTestCards = (boonValue, boonSuit, baneValue, baneSuit) => {
  testMode.enabled = true;
  testMode.boonCard = { value: boonValue, suit: boonSuit };
  testMode.baneCard = { value: baneValue, suit: baneSuit };
};

async function drawCard() {
  if (!currentDeck) {
    // Fallback to random selection if no deck
    return getRandomCardDisplay();
  }

  try {
    // Draw a card from the API
    const response = await fetch(
      `https://deckofcardsapi.com/api/deck/${currentDeck.deckId}/draw/?count=1`
    );
    const data = await response.json();

    if (data.success && data.cards.length > 0) {
      const card = data.cards[0];
      currentDeck.remaining = data.remaining;
      currentDeck.drawnCards.push(card);

      // Convert API card format to our format
      const cardObject = {
        value: convertApiValueToInternal(card.value),
        suit: card.suit.toLowerCase(),
        display: `${convertApiValueToInternal(card.value)}${SUIT_TO_EMOJI_MAP[card.suit.toLowerCase()] || card.suit}`,
        code: card.code,
      };

      return cardObject;
    } else {
      // Log failed card draw
      return getRandomCardDisplay();
    }
  } catch (error) {
    // Log card draw error
    return getRandomCardDisplay();
  }
}

/**
 * Get a random card from the player deck for display (without removing it)
 * Used for bane/boon trigger cards
 */
async function getRandomCardFromPlayerDeck(
  testCard = null,
  eventType = 'bane'
) {
  // Test mode: return the specified test card
  if (testCard) {
    return {
      value: testCard.value,
      suit: testCard.suit,
      display: `${testCard.value}${SUIT_TO_EMOJI_MAP[testCard.suit] || testCard.suit}`,
      code: `${testCard.value}${testCard.suit}`,
    };
  }

  // Global test mode: return the configured test card based on event type
  if (testMode.enabled) {
    const testCard =
      eventType === 'boon' ? testMode.boonCard : testMode.baneCard;
    return {
      value: testCard.value,
      suit: testCard.suit,
      display: `${testCard.value}${SUIT_TO_EMOJI_MAP[testCard.suit] || testCard.suit}`,
      code: `${testCard.value}${testCard.suit}`,
    };
  }

  if (!currentGameState) {
    // If no game state, fallback to random card
    return getRandomCardDisplay();
  }

  try {
    // Get the player's main deck
    const playerDeck = currentGameState.runData?.playerDeck || [];

    if (playerDeck.length === 0) {
      // If deck is empty, fallback to random card
      return getRandomCardDisplay();
    }

    // Pick a random card without removing it
    const randomIndex = Math.floor(Math.random() * playerDeck.length);
    const drawnCard = playerDeck[randomIndex];

    // Convert to our card format
    const cardObject = {
      value: drawnCard.value,
      suit: drawnCard.suit,
      display: `${drawnCard.value}${SUIT_TO_EMOJI_MAP[drawnCard.suit] || drawnCard.suit}`,
      code: `${drawnCard.value}${drawnCard.suit}`,
    };

    return cardObject;
  } catch (error) {
    // Fallback to random card if there's an error
    return getRandomCardDisplay();
  }
}

/**
 * Draw a card from the player's deck (removes the card)
 */
async function drawAndRemoveCardFromPlayerDeck() {
  if (!currentGameState) {
    // If no game state, fallback to random card
    return getRandomCardDisplay();
  }

  try {
    // Use deck service to draw from the main player deck
    const { gameState: updatedState, drawnCard } = drawCardFromDeck(
      currentGameState,
      DECK_TYPES.PLAYER_MAIN
    );

    if (!drawnCard) {
      // If no card drawn, fallback to random card
      return getRandomCardDisplay();
    }

    // Update the current game state
    Object.assign(currentGameState, updatedState);

    // Save the updated deck to the server
    await saveDeckToServer(currentGameState.runData.playerDeck);

    // Convert to our card format
    const cardObject = {
      value: drawnCard.value,
      suit: drawnCard.suit,
      display: `${drawnCard.value}${SUIT_TO_EMOJI_MAP[drawnCard.suit] || drawnCard.suit}`,
      code: `${drawnCard.value}${drawnCard.suit}`,
    };

    return cardObject;
  } catch (error) {
    // Fallback to random card if there's an error
    return getRandomCardDisplay();
  }
}

export { drawAndRemoveCardFromPlayerDeck, getRandomCardFromPlayerDeck };

// Game state generation functions - now using shared gameUtils
function generateEnemyStats(enemyType) {
  const challengeModifier = currentGameState.runData?.location?.level || 1;
  return generateEnemyStatsUtil(enemyType, challengeModifier);
}

function generateBossStats() {
  const challengeModifier = currentGameState.runData?.location?.level || 1;
  return generateBossStatsUtil(challengeModifier);
}

function generateShopItems() {
  return generateShopItemsUtil();
}

function calculateShopCosts() {
  const challengeModifier = currentGameState.runData?.location?.level || 1;
  return calculateShopCostsUtil(challengeModifier);
}

function generateBaneEffect() {
  return generateBaneEffectUtil();
}

function handleCardFlip(mapCell, _newPosition) {
  const handlers = {
    drawCard,
    renderOverworldMap,
    startBattle,
    startChallenge,
    handleRest,
    startShop,
    handleBoon,
    handleBane,
    startBossBattle,
    resetBusyState: () => {
      isCardSequenceInProgress = false;
    },
  };
  handleCardFlipUtil(mapCell, _newPosition, currentGameState, handlers);
}

function handleCardEvent(mapCell, _newPosition) {
  const handlers = {
    startBattle,
    startChallenge,
    handleRest,
    startShop,
    handleBoon,
    handleBane,
    startBossBattle,
    renderOverworldMap,
    resetBusyState: () => {
      isCardSequenceInProgress = false;
    },
  };
  handleCardEventUtil(mapCell, _newPosition, currentGameState, handlers, false);
}

// Render functions - defined before use
function renderOverworldMap() {
  const mapGrid = document.getElementById('map-grid');
  if (!mapGrid) {
    return;
  }

  mapGrid.innerHTML = '';

  // Get map data from the new structure
  const mapData = currentGameState.runData?.map;
  if (!mapData || !mapData.tiles) {
    return;
  }

  // Convert tiles array to 2D grid for easier access
  const mapGrid2D = [];
  const maxRows = Math.max(...mapData.tiles.map((tile) => tile.y)) + 1;
  const maxCols = 7; // Fixed width of 7 columns

  // Initialize 2D grid
  for (let row = 0; row < maxRows; row++) {
    mapGrid2D[row] = [];
    for (let col = 0; col < maxCols; col++) {
      mapGrid2D[row][col] = null;
    }
  }

  // Populate grid with tiles
  mapData.tiles.forEach((tile) => {
    mapGrid2D[tile.y][tile.x] = tile;
  });

  const rows = maxRows;

  // Player position (default to 0,0 if not set)
  const playerPos = currentGameState.runData?.location || { mapX: 0, mapY: 0 };
  const playerX = playerPos.mapX || 0;
  const playerY = playerPos.mapY || 0;

  for (let row = 0; row < rows; row += 1) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'map-row';
    rowDiv.style.display = 'flex';
    rowDiv.style.justifyContent = 'center';
    rowDiv.style.marginBottom = '10px';

    for (let col = 0; col < 7; col += 1) {
      // 7 columns: 0-6
      const mapCell = mapGrid2D[row] ? mapGrid2D[row][col] : null;

      if (!mapCell) {
        // Empty space - add invisible placeholder to maintain grid
        const emptyDiv = document.createElement('div');
        emptyDiv.style.width = '120px';
        emptyDiv.style.height = '160px';
        emptyDiv.style.margin = '10px';
        emptyDiv.style.visibility = 'hidden';
        rowDiv.appendChild(emptyDiv);
      } else {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'map-card';
        cardDiv.style.width = '120px';
        cardDiv.style.height = '160px';
        cardDiv.style.margin = '10px';
        cardDiv.style.border = 'none';
        cardDiv.style.borderRadius = '12px';
        cardDiv.style.display = 'flex';
        cardDiv.style.alignItems = 'center';
        cardDiv.style.justifyContent = 'center';
        cardDiv.style.cursor = 'pointer';
        cardDiv.style.backgroundColor = '#f0f0f0';
        cardDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

        // Determine card type and render accordingly
        const isPlayerPosition = playerX === col && playerY === row;
        const isFirstJoker = col === 0 && row === 0; // First joker position
        let cardType;

        if (mapCell && mapCell.type === 'joker' && isFirstJoker) {
          // First joker tile - show portal (regardless of player position or revealed status)
          cardType = 'player-start';
        } else if (mapCell && mapCell.type === 'joker') {
          // Other joker tiles - show joker
          cardType = 'joker';
        } else if (mapCell && mapCell.revealed) {
          // Revealed cards - show their content (player will be overlaid if present)
          cardType = 'revealed';
        } else {
          // Unrevealed cards
          cardType = 'unrevealed';
        }

        // Always show the card content first, then overlay player if needed
        let cardContent = '';
        let backgroundColor = '#d0d0d0';

        switch (cardType) {
          case 'player-start':
            cardContent = `<div style="text-align: center;">
              <span style="font-size: 4em; display: block; margin-bottom: 5px; opacity: 0.3;">🌀</span>
              <div style="font-size: 0.9em; color: #666; font-weight: bold;">Portal</div>
            </div>`;
            break;

          case 'joker': {
            const jokerEvent = EVENTS['𝕁'] || { icon: '🃏', text: 'Joker' };
            const isLastJoker = col === 6; // Last column, bottom row

            if (isLastJoker) {
              // Last joker - show as portal
              cardContent = `<div style="text-align: center;">
                <span style="font-size: 4em; display: block; margin-bottom: 10px;">🌀</span>
                <div style="font-size: 0.9em; color: #fff; font-weight: bold;">Portal</div>
              </div>`;
              backgroundColor = '#9c27b0';
            } else {
              // Other jokers - show as joker
              cardContent = `<div style="text-align: center;">
                <span style="font-size: 4em; display: block; margin-bottom: 10px;">${jokerEvent.icon}</span>
              </div>`;
              backgroundColor = '#9c27b0';
            }
            break;
          }

          case 'revealed': {
            const cardObject = {
              value: mapCell.value || ' ',
              suit: mapCell.suit || ' ',
              display: `${mapCell.value || ' '}${SUIT_TO_EMOJI_MAP[mapCell.suit] || mapCell.suit || ' '}`,
            };

            // Get the card value for event lookup
            const cardValue = getCardValue(cardObject);
            const eventInfo = EVENTS[cardValue] || {
              icon: '❓',
              text: 'Unknown Event',
            }; // Default to unknown event

            // Always show the playing card representation at the top
            const cardRepresentation = cardObject.display;

            // Determine card state
            const justRevealed = mapCell.justRevealed || false;
            const hasBeenVisited = mapCell.visited || false;

            // Set visual styles based on state
            let opacity, textColor;

            if (justRevealed) {
              // Just revealed: bright but not gold
              opacity = '1.0';
              textColor = '#fff';
              backgroundColor = '#fff';
            } else if (hasBeenVisited) {
              // Past traveled: faded (including when player is on it)
              opacity = '0.3';
              textColor = '#666';
              backgroundColor = '#d0d0d0';
            } else {
              // Fallback
              opacity = '1.0';
              textColor = '#fff';
              backgroundColor = '#fff';
            }

            if (eventInfo.icon) {
              cardContent = `<div style="text-align: center;">
                <div style="font-size: 0.7em; color: ${textColor}; margin-bottom: 2px;">
                  ${cardRepresentation}
                </div>
                <span style="font-size: 4em; display: block; margin-bottom: 5px; opacity: ${opacity};">
                  ${eventInfo.icon}
                </span>
                <div style="font-size: 0.9em; color: ${textColor}; font-weight: bold;">
                  ${eventInfo.text}
                </div>
              </div>`;
            } else {
              // Fallback for events without icons
              cardContent = `<div style="text-align: center;">
                <div style="font-size: 0.7em; color: #ccc; margin-bottom: 2px;">
                  ${cardRepresentation}
                </div>
                <div style="font-size: 0.9em; color: ${textColor}; font-weight: bold; margin-top: 60px;">
                  ${eventInfo.text}
                </div>
              </div>`;
            }
            break;
          }

          default: // unrevealed
            cardContent =
              '<span style="font-size:6em; color: #666; opacity: 0.5;">🔮</span>';
            cardDiv.style.background =
              'linear-gradient(135deg, #1a1a1a, #2a2a2a)'; // Charcoal gradient
            break;
        }

        // Set the card content
        cardDiv.innerHTML = cardContent;
        cardDiv.style.backgroundColor = backgroundColor;

        // Overlay player token if player is at this position
        if (isPlayerPosition) {
          cardDiv.style.position = 'relative';
          const playerIcon = playerDirection === 'left' ? '🚶‍' : '🚶‍➡️';
          cardDiv.innerHTML += `<span style="font-size: 4em; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));">${playerIcon}</span>`;
          cardDiv.style.border = '3px solid #d4af37';
        }

        // Allow clicking on adjacent cards (both revealed and unrevealed)
        if (
          Math.abs(playerX - col) + Math.abs(playerY - row) === 1 &&
          mapCell &&
          !isCardSequenceInProgress
        ) {
          cardDiv.style.border = '3px solid #4CAF50'; // Green border for all clickable cards

          // Special case for portal (first joker) - just move there, no events
          if (mapCell.type === 'joker' && col === 0 && row === 0) {
            cardDiv.onclick = () => {
              // Update player direction based on movement
              if (col < currentGameState.runData.location.mapX) {
                playerDirection = 'left';
              } else if (col > currentGameState.runData.location.mapX) {
                playerDirection = 'right';
              }
              currentGameState.runData.location.mapX = col;
              currentGameState.runData.location.mapY = row;
              isCardSequenceInProgress = false; // Reset busy state immediately
              renderOverworldMap();
            };
          } else if (!mapCell.revealed) {
            // Unrevealed card - flip it and move there
            cardDiv.onclick = () => {
              // Update player direction based on movement
              if (col < currentGameState.runData.location.mapX) {
                playerDirection = 'left';
              } else if (col > currentGameState.runData.location.mapX) {
                playerDirection = 'right';
              }
              isCardSequenceInProgress = true; // Set busy state
              handleCardFlip(mapCell, { x: col, y: row });
            };
          } else {
            // Revealed card - move there (only if not already visited)
            cardDiv.onclick = () => {
              // Don't trigger event if already visited
              if (mapCell.visited) {
                // Update player direction based on movement
                if (col < currentGameState.runData.location.mapX) {
                  playerDirection = 'left';
                } else if (col > currentGameState.runData.location.mapX) {
                  playerDirection = 'right';
                }
                // Just move player to the position without triggering event
                currentGameState.runData.location.mapX = col;
                currentGameState.runData.location.mapY = row;
                isCardSequenceInProgress = false; // Reset busy state immediately
                renderOverworldMap();
                return;
              }

              // Update player direction based on movement
              if (col < currentGameState.runData.location.mapX) {
                playerDirection = 'left';
              } else if (col > currentGameState.runData.location.mapX) {
                playerDirection = 'right';
              }
              isCardSequenceInProgress = true; // Set busy state
              // Mark this card as visited when player moves to it
              mapCell.visited = true;
              // Move player to the position and trigger the event through the proper sequence
              currentGameState.runData.location.mapX = col;
              currentGameState.runData.location.mapY = row;
              renderOverworldMap();
              // Trigger the event through the proper sequence
              handleCardEvent(mapCell, { x: col, y: row });
            };
          }
        }

        rowDiv.appendChild(cardDiv);
      }
    }

    mapGrid.appendChild(rowDiv);
  }
}

function renderBattleInterface() {
  // Battle interface rendering logic
}

function renderEventInterface() {
  // Event interface rendering logic
}

function renderShopInterface() {
  // Shop interface rendering logic
}

// Battle and event functions - defined before use
function startBattle(enemyType, _newPosition) {
  const enemyStats = generateEnemyStats(enemyType);

  fetch('/battle/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enemyType,
      enemyStats,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = '/battle';
      } else {
        // Handle error silently
      }
    })
    .catch((_error) => {
      // Handle error silently
    });
}

function startChallenge(_statType, _newPosition) {
  // The new challenge system is handled directly in eventHandler.js
  // This function is kept for compatibility but should not be called
  // console.warn(
  //   'startChallenge called - this should be handled by the new challenge system'
  // );
}

function startShop(_newPosition) {
  fetch('/event/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'shop',
      eventData: {
        items: generateShopItems(),
        costs: calculateShopCosts(),
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = '/shop';
      } else {
        // Handle error silently
      }
    })
    .catch((_error) => {
      // Handle error silently
    });
}

function handleRest(_newPosition) {
  // Calculate heal amount (50% of max HP)
  const healAmount = Math.floor(currentGameState.runData.maxHealth / 2);

  fetch('/event/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'rest',
      eventData: {
        healAmount,
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Apply healing immediately
        currentGameState.runData.health = Math.min(
          currentGameState.runData.maxHealth,
          currentGameState.runData.health + healAmount
        );
        showNotification(
          'Rest Complete',
          `Healed for ${healAmount} HP`,
          'success'
        );
        updateHealthDisplay(
          currentGameState.runData.health,
          currentGameState.runData.maxHealth
        );
        renderOverworldMap();
      } else {
        // Handle error silently
      }
    })
    .catch((_error) => {
      // Handle error silently
    });
}

function handleBoon(_newPosition) {
  // The boon is now handled directly in the eventHandler
  // This function is kept for compatibility but doesn't need to do anything
  // since the boon processing happens in the eventHandler when the card is drawn
}

function handleBane(_newPosition) {
  fetch('/event/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'bane',
      eventData: {
        card: getRandomCardDisplay(),
        effect: generateBaneEffect(),
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = '/event';
      } else {
        // Handle error silently
      }
    })
    .catch((_error) => {
      // Handle error silently
    });
}

function startBossBattle(_newPosition) {
  // Boss battles are similar to regular battles but with special stats
  const bossStats = generateBossStats();

  fetch('/battle/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enemyType: 'boss',
      enemyStats: bossStats,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = '/battle';
      } else {
        // Handle error silently
      }
    })
    .catch((_error) => {
      // Handle error silently
    });
}

function initializeGame() {
  if (!currentGameState) {
    return;
  }

  // Initialize the deck for this level - commented out for testing
  initializeDeck().then(() => {
    switch (currentGameState.currentScreen) {
      case 'overworld':
        renderOverworldMap();
        break;
      case 'battle':
        renderBattleInterface();
        break;
      case 'event':
        renderEventInterface();
        break;
      case 'shop':
        renderShopInterface();
        break;
      default:
        // Default to overworld if no screen is specified
        renderOverworldMap();
        break;
    }
  }); // Commented out for testing
}

// Initialize game interface
document.addEventListener('DOMContentLoaded', () => {
  // Get game state from server-side data
  if (typeof window.gameSave !== 'undefined') {
    currentGameState = window.gameSave;
  }

  initializeGame();
});
