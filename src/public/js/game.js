// game.js - Page-specific logic for Game

// Import game data constants
import {
  EVENTS,
  SUIT_SYMBOL_MAP,
} from './modules/gameData.js';

// Import game utility functions
import {
  getRandomCardDisplay,
  getCardValue,
} from './modules/gameUtils.js';

// Game state management
let currentGameState = null;
let currentDeck = null; // Store the current deck state

// Deck management functions
async function initializeDeck() {
  try {
    // Use Deck of Cards API to create and shuffle a new deck
    const response = await fetch(
      'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1'
    );
    const data = await response.json();

    if (data.success) {
      currentDeck = {
        deckId: data.deck_id,
        remaining: 52,
        drawnCards: [],
      };
    }
  } catch (error) {
    // Fallback to random selection if API fails
    currentDeck = null;
  }
}

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
        value: card.value,
        suit: card.suit,
        display: `${card.value}${SUIT_SYMBOL_MAP[card.suit]}`,
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

function showNotification(title, message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <h4>${title}</h4>
    <p>${message}</p>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

function generateEnemyStats(enemyType) {
  const baseStats = { power: 2, will: 2, craft: 2, control: 2 };
  const challengeModifier = currentGameState.challengeModifier || 1;

  // Add challenge modifier to stats
  Object.keys(baseStats).forEach((stat) => {
    baseStats[stat] += challengeModifier;
  });

  // Boost the primary stat based on enemy type
  if (enemyType === 'power') baseStats.power += 1;
  else if (enemyType === 'will') baseStats.will += 1;
  else if (enemyType === 'craft') baseStats.craft += 1;
  else if (enemyType === 'control') baseStats.control += 1;

  return baseStats;
}

function generateBossStats() {
  const challengeModifier = currentGameState.challengeModifier || 1;
  return {
    power: 2 * challengeModifier,
    will: 2 * challengeModifier,
    craft: 2 * challengeModifier,
    control: 2 * challengeModifier,
  };
}

function generateShopItems() {
  return ['heal', 'equipment1', 'equipment2', 'card_removal'];
}

function calculateShopCosts() {
  const challengeModifier = currentGameState.challengeModifier || 1;
  return {
    heal: 10 + challengeModifier,
    equipment1: 25 + challengeModifier,
    equipment2: 30 + challengeModifier,
    card_removal: 25 + challengeModifier,
  };
}

function generateBoonOptions() {
  return ['stat_boost', 'artifact', 'currency'];
}

function generateBaneEffect() {
  return 'lose_item';
}

// Card handling functions - defined before render functions
function handleCardEncounter(card) {
  const cardValue = getCardValue(card);

  if (cardValue >= 3 && cardValue <= 6) {
    // Fight encounter
    const enemyTypes = ['power', 'will', 'craft', 'control'];
    const enemyType = enemyTypes[cardValue - 3];
    startBattle(enemyType, currentGameState.playerPosition);
  } else if (cardValue >= 7 && cardValue <= 10) {
    // Stat challenge
    const statTypes = ['power', 'will', 'craft', 'control'];
    const statType = statTypes[cardValue - 7];
    startChallenge(statType, currentGameState.playerPosition);
  } else if (cardValue === 11) {
    // Nothing
    showNotification(
      'Nothing Happens',
      'You find nothing of interest.',
      'info'
    );
  } else if (cardValue === 12) {
    // Rest
    handleRest(currentGameState.playerPosition);
  } else if (cardValue === 13) {
    // Shop
    startShop(currentGameState.playerPosition);
  } else if (cardValue === 14) {
    // Boon
    handleBoon(currentGameState.playerPosition);
  } else if (cardValue === 2) {
    // Bane
    handleBane(currentGameState.playerPosition);
  }
}

function handleCardFlip(mapCell, _newPosition) {
  // Create a new object instead of mutating the parameter
  const updatedMapCell = { ...mapCell, revealed: true, justRevealed: true };

  // Draw a card from the deck for this position
  drawCard().then((cardObject) => {
    updatedMapCell.card = cardObject;

    // Update the map in the game state
    const { x, y } = _newPosition;
    if (currentGameState.map[y] && currentGameState.map[y][x]) {
      currentGameState.map[y][x] = updatedMapCell;
    }

    // Update the map display
    renderOverworldMap();

    // Handle the encounter
    handleCardEncounter(updatedMapCell.card);
  });
}

function handleCardEvent(mapCell, _newPosition) {
  // Create a new object instead of mutating the parameter
  const updatedMapCell = { ...mapCell, visited: true, justRevealed: false };

  // Update the map in the game state
  const { x, y } = _newPosition;
  if (currentGameState.map[y] && currentGameState.map[y][x]) {
    currentGameState.map[y][x] = updatedMapCell;
  }

  // Update player position
  currentGameState.playerPosition = _newPosition;

  // Handle the encounter based on card type
  const cardValue = getCardValue(updatedMapCell.card);

  if (cardValue >= 3 && cardValue <= 6) {
    // Fight encounter
    const enemyTypes = ['power', 'will', 'craft', 'control'];
    const enemyType = enemyTypes[cardValue - 3];
    startBattle(enemyType, _newPosition);
  } else if (cardValue >= 7 && cardValue <= 10) {
    // Stat challenge
    const statTypes = ['power', 'will', 'craft', 'control'];
    const statType = statTypes[cardValue - 7];
    startChallenge(statType, _newPosition);
  } else if (cardValue === 11) {
    // Nothing
    showNotification(
      'Nothing Happens',
      'You find nothing of interest.',
      'info'
    );
    renderOverworldMap();
  } else if (cardValue === 12) {
    // Rest
    handleRest(_newPosition);
  } else if (cardValue === 13) {
    // Shop
    startShop(_newPosition);
  } else if (cardValue === 14) {
    // Boon
    handleBoon(_newPosition);
  } else if (cardValue === 2) {
    // Bane
    handleBane(_newPosition);
  } else if (updatedMapCell.type === 'joker') {
    // Boss battle
    startBossBattle(_newPosition);
  }
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

        // Show player token or portal
        if (playerX === col && playerY === row) {
          cardDiv.innerHTML = '<span style="font-size:4em">🚶‍➡️</span>';
          cardDiv.style.backgroundColor = '#d4af37';
          cardDiv.style.border = '3px solid #d4af37';
        } else if (mapCell && mapCell.type === 'player-start') {
          // Show portal swirl for starting position
          cardDiv.innerHTML = `<div style="text-align: center;">
            <span style="font-size: 4em; display: block; margin-bottom: 5px; opacity: 0.3;">🌀</span>
            <div style="font-size: 0.9em; color: #111; font-weight: bold;">Portal</div>
          </div>`;
          cardDiv.style.backgroundColor = '#d0d0d0';
          cardDiv.style.border = '3px solid #d0d0d0';
        } else if (mapCell.type === 'joker') {
          const jokerEvent = EVENTS.joker;
          cardDiv.innerHTML = `<div style="text-align: center;">
            <span style="font-size: 4em; display: block; margin-bottom: 10px;">${jokerEvent.icon}</span>
          </div>`;
          cardDiv.style.backgroundColor = '#9c27b0';
        } else if (mapCell.revealed) {
          const cardObject = mapCell.card || {
            value: ' ',
            suit: ' ',
            display: ' ',
          };

          // Get the card value for event lookup
          const cardValue = getCardValue(cardObject);
          const eventInfo = EVENTS[cardValue] || EVENTS[11]; // Default to nothing

          // Create card content with event icon and text
          let cardContent = '';

          // Always show the playing card representation at the top
          const cardRepresentation = cardObject.display;

          // Determine card state
          const isCurrentPosition = playerX === col && playerY === row;
          const justRevealed = mapCell.justRevealed || false;
          const hasBeenVisited = mapCell.visited || false;

          // Set visual styles based on state
          let opacity;
          let textColor;
          let backgroundColor;

          if (isCurrentPosition) {
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
        } else {
          cardDiv.innerHTML =
            '<span style="font-size:6em; color: #666; opacity: 0.5;">🔮</span>';
          cardDiv.style.background =
            'linear-gradient(135deg, #1a1a1a, #2a2a2a)'; // Charcoal gradient
        }

        // Allow clicking on adjacent cards (both revealed and unrevealed)
        if (
          Math.abs(playerX - col) + Math.abs(playerY - row) === 1 &&
          mapCell
        ) {
          cardDiv.style.border = '3px solid #4CAF50'; // Green border for all clickable cards

          if (!mapCell.revealed) {
            // Unrevealed card - flip it
            cardDiv.onclick = () => {
              handleCardFlip(mapCell, { x: col, y: row });
            };
          } else {
            // Revealed card - just move there
            cardDiv.onclick = () => {
              // Mark this card as visited when player moves to it
              mapCell.visited = true;
              currentGameState.playerPosition = { x: col, y: row };
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

  // Initialize the deck for this level
  initializeDeck().then(() => {
    if (currentGameState.currentScreen === 'overworld') {
      renderOverworldMap();
    } else if (currentGameState.currentScreen === 'battle') {
      renderBattleInterface();
    } else if (currentGameState.currentScreen === 'event') {
      renderEventInterface();
    } else if (currentGameState.currentScreen === 'shop') {
      renderShopInterface();
    } else {
      // Default to overworld if no screen is specified
      renderOverworldMap();
    }
  });
}

// Initialize game interface
document.addEventListener('DOMContentLoaded', () => {
  // Get game state from server-side data
  if (typeof window.gameState !== 'undefined') {
    currentGameState = window.gameState;
  }

  initializeGame();
});
