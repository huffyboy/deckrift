// game.js - Page-specific logic for Game

// Import game data constants
import { EVENTS, SUIT_SYMBOL_MAP } from './modules/gameData.js';

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
  generateBoonOptions as generateBoonOptionsUtil,
  generateBaneEffect as generateBaneEffectUtil,
} from './modules/gameUtils.js';

import { showNotification } from './modules/uiUtils.js';

// Import event handler functions
import {
  handleCardFlip as handleCardFlipUtil,
  handleCardEvent as handleCardEventUtil,
} from './modules/eventHandler.js';

// Game state management
let currentGameState = null;
let currentDeck = null; // Store the current deck state
let isCardSequenceInProgress = false; // Track if card flip/movement is happening

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
    { value: 'J', suit: '♠', display: 'J♠' },
    { value: 'J', suit: '♥', display: 'J♥' },
    { value: 'J', suit: '♦', display: 'J♦' },
    { value: 'J', suit: '♣', display: 'J♣' },
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
        display: `${convertApiValueToInternal(card.value)}${SUIT_SYMBOL_MAP[card.suit]}`,
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

// Game state generation functions - now using shared gameUtils
function generateEnemyStats(enemyType) {
  const challengeModifier = currentGameState.challengeModifier || 1;
  return generateEnemyStatsUtil(enemyType, challengeModifier);
}

function generateBossStats() {
  const challengeModifier = currentGameState.challengeModifier || 1;
  return generateBossStatsUtil(challengeModifier);
}

function generateShopItems() {
  return generateShopItemsUtil();
}

function calculateShopCosts() {
  const challengeModifier = currentGameState.challengeModifier || 1;
  return calculateShopCostsUtil(challengeModifier);
}

function generateBoonOptions() {
  return generateBoonOptionsUtil();
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

  const rows = currentGameState.challengeModifier;
  const { map } = currentGameState;

  // Player position (default to 0,0 if not set)
  const playerPos = currentGameState.playerPosition || { x: 0, y: 0 };
  const playerX = playerPos.x || 0;
  const playerY = playerPos.y || 0;

  for (let row = 0; row < rows; row += 1) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'map-row';
    rowDiv.style.display = 'flex';
    rowDiv.style.justifyContent = 'center';
    rowDiv.style.marginBottom = '10px';

    for (let col = 0; col < 7; col += 1) {
      // 7 columns: 0-6
      const mapCell = map[row] ? map[row][col] : null;

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
        let cardType;

        if (isPlayerPosition) {
          cardType = 'player';
        } else if (mapCell && mapCell.type === 'player-start') {
          cardType = 'player-start';
        } else if (mapCell && mapCell.type === 'joker') {
          cardType = 'joker';
        } else if (mapCell && mapCell.revealed) {
          cardType = 'revealed';
        } else {
          cardType = 'unrevealed';
        }

        switch (cardType) {
          case 'player':
            cardDiv.innerHTML = '<span style="font-size:4em">🚶‍➡️</span>';
            cardDiv.style.backgroundColor = '#d4af37';
            cardDiv.style.border = '3px solid #d4af37';
            break;

          case 'player-start':
            cardDiv.innerHTML = `<div style="text-align: center;">
              <span style="font-size: 4em; display: block; margin-bottom: 5px; opacity: 0.3;">🌀</span>
              <div style="font-size: 0.9em; color: #111; font-weight: bold;">Portal</div>
            </div>`;
            cardDiv.style.backgroundColor = '#d0d0d0';
            cardDiv.style.border = '3px solid #d0d0d0';
            break;

          case 'joker': {
            const jokerEvent = EVENTS.joker;
            cardDiv.innerHTML = `<div style="text-align: center;">
              <span style="font-size: 4em; display: block; margin-bottom: 10px;">${jokerEvent.icon}</span>
            </div>`;
            cardDiv.style.backgroundColor = '#9c27b0';
            break;
          }

          case 'revealed': {
            const cardObject = mapCell.card || {
              value: ' ',
              suit: ' ',
              display: ' ',
            };

            // Get the card value for event lookup
            const cardValue = getCardValue(cardObject);
            const eventInfo = EVENTS[cardValue] || EVENTS[11]; // Default to nothing

            // Always show the playing card representation at the top
            const cardRepresentation = cardObject.display;

            // Determine card state
            const justRevealed = mapCell.justRevealed || false;
            const hasBeenVisited = mapCell.visited || false;

            // Set visual styles based on state
            let opacity, textColor, backgroundColor;

            if (isPlayerPosition) {
              // Current position: bright and prominent
              opacity = '1.0';
              textColor = '#fff';
              backgroundColor = '#d4af37';
            } else if (justRevealed) {
              // Just revealed: bright but not gold
              opacity = '1.0';
              textColor = '#fff';
              backgroundColor = '#fff';
            } else if (hasBeenVisited) {
              // Past traveled: faded
              opacity = '0.3';
              textColor = '#111';
              backgroundColor = '#d0d0d0';
            } else {
              // Fallback
              opacity = '1.0';
              textColor = '#fff';
              backgroundColor = '#fff';
            }

            let cardContent;
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

            cardDiv.innerHTML = cardContent;
            cardDiv.style.backgroundColor = backgroundColor;
            break;
          }

          default: // unrevealed
            cardDiv.innerHTML =
              '<span style="font-size:6em; color: #666; opacity: 0.5;">🔮</span>';
            cardDiv.style.background =
              'linear-gradient(135deg, #1a1a1a, #2a2a2a)'; // Charcoal gradient
            break;
        }

        // Allow clicking on adjacent cards (both revealed and unrevealed)
        if (
          Math.abs(playerX - col) + Math.abs(playerY - row) === 1 &&
          mapCell &&
          !isCardSequenceInProgress
        ) {
          cardDiv.style.border = '3px solid #4CAF50'; // Green border for all clickable cards

          if (!mapCell.revealed) {
            // Unrevealed card - flip it and move there
            cardDiv.onclick = () => {
              isCardSequenceInProgress = true; // Set busy state
              handleCardFlip(mapCell, { x: col, y: row });
            };
          } else {
            // Revealed card - move there and trigger event
            cardDiv.onclick = () => {
              isCardSequenceInProgress = true; // Set busy state
              // Mark this card as visited when player moves to it
              mapCell.visited = true;
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

function startChallenge(statType, _newPosition) {
  // Calculate challenge difficulty based on current level
  const challengeModifier = currentGameState.challengeModifier || 1;
  const target = 12 + challengeModifier;

  fetch('/event/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'challenge',
      eventData: {
        stat: statType,
        difficulty: challengeModifier,
        target,
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
  const healAmount = Math.floor(currentGameState.maxHealth / 2);

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
        currentGameState.health = Math.min(
          currentGameState.maxHealth,
          currentGameState.health + healAmount
        );
        showNotification(
          'Rest Complete',
          `Healed for ${healAmount} HP`,
          'success'
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
  fetch('/event/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'boon',
      eventData: {
        card: getRandomCardDisplay(),
        options: generateBoonOptions(),
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
  if (typeof window.gameState !== 'undefined') {
    currentGameState = window.gameState;
  }

  initializeGame();
});
