// eventHandler.js - Event processing logic

import { getCardValue } from './gameUtils.js';
import { showNotification } from './uiUtils.js';
import { EVENTS } from './gameData.js';

/**
 * Handle card encounter based on card value
 * @param {Object} card - Card object
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 */
export function handleCardEncounter(card, gameState, handlers) {
  const cardValue = getCardValue(card);
  const event = EVENTS[cardValue];

  switch (event.type) {
    case 'fight':
      handlers.startBattle(event.enemy, gameState.playerPosition);
      break;
    case 'challenge':
      handlers.startChallenge(event.stat, gameState.playerPosition);
      break;
    case 'rest':
      handlers.handleRest(gameState.playerPosition);
      break;
    case 'shop':
      handlers.startShop(gameState.playerPosition);
      break;
    case 'boon':
      handlers.handleBoon(gameState.playerPosition);
      break;
    case 'bane':
      handlers.handleBane(gameState.playerPosition);
      break;
    case 'nothing':
      showNotification(
        'Nothing Happens',
        'You find nothing of interest.',
        'info'
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

  // Draw a card from the deck for this position
  handlers.drawCard().then((cardObject) => {
    updatedMapCell.card = cardObject;

    // Update the map in the game state
    const { x, y } = newPosition;
    if (gameState.map[y] && gameState.map[y][x]) {
      gameState.map[y][x] = updatedMapCell;
    }

    // Update the map display to show the revealed card (player still on old position)
    handlers.renderOverworldMap();

    // Wait 0.5 seconds for player to see the revealed card
    setTimeout(() => {
      // Move player to the revealed card position
      gameState.playerPosition = newPosition;

      // Update the map display to show player on new position
      handlers.renderOverworldMap();

      // Wait another 0.5 seconds for player to see they moved
      setTimeout(() => {
        // Trigger the encounter
        handleCardEvent(updatedMapCell, newPosition, gameState, handlers);

        // Reset busy state after encounter is triggered
        if (handlers.resetBusyState) {
          handlers.resetBusyState();
        }
      }, 500);
    }, 500);
  });
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
  if (gameState.map[y] && gameState.map[y][x]) {
    gameState.map[y][x] = updatedMapCell;
  }

  // Handle the encounter for the card (with null check)
  if (updatedMapCell.card) {
    handleCardEncounter(updatedMapCell.card, gameState, handlers);
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

  showNotification(
    'Rest',
    `You rest and recover ${healAmount} health.`,
    'success'
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
  showNotification(
    'Boon Received',
    'You receive a beneficial effect!',
    'success'
  );

  // TODO: Implement boon logic
  // This would involve drawing a boon card and applying its effect

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
  showNotification('Bane Received', 'You suffer a negative effect!', 'error');

  // TODO: Implement bane logic
  // This would involve drawing a bane card and applying its effect

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
