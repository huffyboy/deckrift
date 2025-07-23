// uiUtils.js - Shared UI utility functions

import { SUIT_TO_EMOJI_MAP } from './gameConstants.js';
import { getCardValue } from './sharedGameUtils.js';

/**
 * Show a stylized game message (fantasy/roguelike themed)
 * @param {string} title - Message title
 * @param {string} message - Message text
 * @param {string} type - Message type ('nothing', 'success', 'warning', 'error', 'info')
 * @param {string} icon - Optional icon emoji
 * @param {number} duration - Duration in milliseconds (default: 3000)
 * @param {Function} onComplete - Optional callback function called when message is dismissed
 */
export function showGameMessage(
  title,
  message,
  type = 'info',
  icon = null,
  duration = 3000,
  onComplete = null
) {
  // Create game message element
  const gameMessage = document.createElement('div');
  gameMessage.className = `game-message game-message-${type}`;

  let iconHtml = '';
  if (icon) {
    iconHtml = `<span class="game-message-icon">${icon}</span>`;
  }

  gameMessage.innerHTML = `
    ${iconHtml}
    <div class="game-message-title">${title}</div>
    <div class="game-message-text">${message}</div>
  `;

  // Get or create game message container
  let container = document.getElementById('game-message-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-message-container';
    container.className = 'game-message-container';
    document.body.appendChild(container);
  }

  // Add to page
  container.appendChild(gameMessage);

  // Helper function to remove message and call callback
  const removeMessage = () => {
    if (gameMessage.parentElement) {
      gameMessage.classList.add('hiding');
      setTimeout(() => {
        if (gameMessage.parentElement) {
          gameMessage.remove();
          if (onComplete) {
            onComplete();
          }
        }
      }, 300);
    }
  };

  // Auto-remove after duration, if duration is a positive number
  if (typeof duration === 'number' && duration > 0) {
    setTimeout(removeMessage, duration);
  }

  // Allow clicking to dismiss
  gameMessage.addEventListener('click', removeMessage);
}

/**
 * Show a notification message to the user
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('info', 'success', 'warning', 'error')
 */
export function showNotification(title, message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-header">
            <h4>${title}</h4>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="notification-body">
            <p>${message}</p>
        </div>
    `;

  // Add to page
  const container =
    document.getElementById('notification-container') || document.body;
  container.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

/**
 * Show an error notification
 * @param {string} message - Error message
 */
export function showError(message) {
  showNotification('Error', message, 'error');
}

/**
 * Show a success notification
 * @param {string} message - Success message
 */
export function showSuccess(message) {
  showNotification('Success', message, 'success');
}

/**
 * Show a warning notification
 * @param {string} message - Warning message
 */
export function showWarning(message) {
  showNotification('Warning', message, 'warning');
}

/**
 * Show an info notification
 * @param {string} message - Info message
 */
export function showInfo(message) {
  showNotification('Info', message, 'info');
}

/**
 * Update currency display across the UI
 * @param {number} newCurrency - New currency amount
 */
export function updateCurrencyDisplay(newCurrency) {
  const currencyElements = document.querySelectorAll(
    '.currency-display, .currency-value'
  );
  currencyElements.forEach((element) => {
    element.textContent = newCurrency;
  });
}

/**
 * Update the health display in the game header
 * @param {number} currentHealth - Current health value
 * @param {number} maxHealth - Maximum health value
 */
export function updateHealthDisplay(currentHealth, maxHealth) {
  // Update the health bar fill
  const healthFill = document.querySelector('.health-fill');
  if (healthFill) {
    const healthPercentage = (currentHealth / maxHealth) * 100;
    healthFill.style.width = `${healthPercentage}%`;
  }

  // Update the health text
  const healthText = document.querySelector('.game-stat span');
  if (healthText) {
    healthText.textContent = `${currentHealth}/${maxHealth}`;
  }
}

/**
 * Show a card choice dialog with accept/decline buttons
 * @param {Object} card - The card object to show
 * @param {Function} onAccept - Callback when card is accepted
 * @param {Function} onDecline - Callback when card is declined
 */
export function showCardChoiceDialog(card, onAccept, onDecline) {
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'card-choice-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  // Create dialog content
  const dialog = document.createElement('div');
  dialog.className = 'card-choice-dialog';
  dialog.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a, #1e1e1e);
    border: 3px solid #4a2c8f;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    max-width: 400px;
    color: white;
    font-family: 'Cinzel', serif;
  `;

  const cardDisplay = `${card.value}${SUIT_TO_EMOJI_MAP[card.suit] || card.suit}`;

  dialog.innerHTML = `
    <h3 style="margin-bottom: 1rem; color: #d4af37;">Add Card to Deck</h3>
    <div style="font-size: 4em; margin: 1rem 0;">${cardDisplay}</div>
    <p style="margin-bottom: 2rem; font-size: 1.1rem;">Would you like to add ${cardDisplay} to your deck?</p>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button class="btn btn-success" style="background: #28a745; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Accept</button>
      <button class="btn btn-secondary" style="background: #6c757d; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Decline</button>
    </div>
  `;

  // Add event listeners
  const acceptBtn = dialog.querySelector('.btn-success');
  const declineBtn = dialog.querySelector('.btn-secondary');

  acceptBtn.addEventListener('click', () => {
    overlay.remove();
    if (onAccept) onAccept();
  });

  declineBtn.addEventListener('click', () => {
    overlay.remove();
    if (onDecline) onDecline();
  });

  // Add to page
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

/**
 * Show a multi-card choice dialog with accept/decline options for each card
 * @param {Array} cards - Array of card objects to show
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 * @param {Function} applyAddCard - Function to apply add card effect
 */
export function showMultiCardChoiceDialog(
  cards,
  gameState,
  handlers,
  applyAddCard
) {
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'multi-card-choice-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  // Create dialog content
  const dialog = document.createElement('div');
  dialog.className = 'multi-card-choice-dialog';
  dialog.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a, #1e1e1e);
    border: 3px solid #4a2c8f;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    max-width: 800px;
    color: white;
    font-family: 'Cinzel', serif;
  `;

  // Create cards row (horizontal layout)
  const cardsRow = document.createElement('div');
  cardsRow.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  `;

  // Add each card to the row
  cards.forEach((card) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'choice-card';
    cardElement.style.cssText = `
      background: linear-gradient(135deg, #ffffff, #f0f0f0);
      border: 2px solid #4a2c8f;
      border-radius: 8px;
      padding: 1rem 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #1e1e1e;
      width: 60px;
      height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      user-select: none;
      position: relative;
      overflow: hidden;
    `;

    const cardDisplay = `${card.value}${SUIT_TO_EMOJI_MAP[card.suit] || card.suit}`;
    cardElement.innerHTML = `
      <div style="font-size: 1.2em; transition: transform 0.2s ease;">${cardDisplay}</div>
    `;

    // Add hover effect
    cardElement.addEventListener('mouseenter', () => {
      cardElement.style.transform = 'translateY(-4px) scale(1.05)';
      cardElement.style.borderColor = '#d4af37';
      cardElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });

    cardElement.addEventListener('mouseleave', () => {
      cardElement.style.transform = 'translateY(0) scale(1)';
      cardElement.style.borderColor = '#4a2c8f';
      cardElement.style.boxShadow = 'none';
    });

    // Add click handler with satisfying feedback
    cardElement.addEventListener('click', async () => {
      // Immediate visual feedback
      cardElement.style.transform = 'translateY(-2px) scale(0.95)';
      cardElement.style.borderColor = '#28a745';
      cardElement.style.background =
        'linear-gradient(135deg, #d4edda, #c3e6cb)';
      cardElement.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.4)';

      // Add a subtle glow effect
      cardElement.style.filter = 'brightness(1.1)';

      // Disable pointer events to prevent double-clicks
      cardElement.style.pointerEvents = 'none';

      // Small delay for visual feedback, then proceed
      setTimeout(async () => {
        // Apply the add card effect
        await applyAddCard(card, gameState);

        // Show success notification
        showNotification(
          'Card Added!',
          `Added ${cardDisplay} to your deck.`,
          'success'
        );

        // Fade out the overlay with a satisfying animation
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';

        setTimeout(() => {
          overlay.remove();
          // Continue after choice
          if (handlers.resetBusyState) {
            handlers.resetBusyState();
            if (handlers.renderOverworldMap) {
              handlers.renderOverworldMap();
            }
          }
        }, 300);
      }, 150); // Short delay for visual feedback
    });

    cardsRow.appendChild(cardElement);
  });

  dialog.innerHTML = `
    <h3 style="margin-bottom: 1rem; color: #d4af37;">Choose a Card to Add</h3>
    <p style="margin-bottom: 1rem; font-size: 1.1rem;">Select one card to add to your deck, or decline all:</p>
  `;

  dialog.appendChild(cardsRow);

  // Add decline all button with enhanced feedback
  const declineButton = document.createElement('button');
  declineButton.className = 'btn btn-secondary';
  declineButton.style.cssText = `
    background: #6c757d;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
    color: white;
    transition: all 0.2s ease;
    user-select: none;
  `;
  declineButton.textContent = 'Decline All';

  // Add hover effect for decline button
  declineButton.addEventListener('mouseenter', () => {
    declineButton.style.background = '#5a6268';
    declineButton.style.transform = 'translateY(-1px)';
    declineButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  });

  declineButton.addEventListener('mouseleave', () => {
    declineButton.style.background = '#6c757d';
    declineButton.style.transform = 'translateY(0)';
    declineButton.style.boxShadow = 'none';
  });

  declineButton.addEventListener('click', () => {
    // Immediate visual feedback
    declineButton.style.background = '#495057';
    declineButton.style.transform = 'translateY(1px)';
    declineButton.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.2)';

    // Disable pointer events
    declineButton.style.pointerEvents = 'none';

    setTimeout(() => {
      showNotification(
        'Cards Declined',
        'You chose not to add any cards to your deck.',
        'info'
      );

      // Fade out the overlay
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.style.opacity = '0';

      setTimeout(() => {
        overlay.remove();
        // Continue after choice
        if (handlers.resetBusyState) {
          handlers.resetBusyState();
          if (handlers.renderOverworldMap) {
            handlers.renderOverworldMap();
          }
        }
      }, 300);
    }, 100);
  });

  dialog.appendChild(declineButton);

  // Add to page
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

/**
 * Show a multi-card choice dialog for removing cards from the player's deck
 * @param {Array} cards - Array of card objects to show
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 * @param {Function} applyRemoveCard - Function to apply remove card effect
 */
export function showMultiCardRemoveDialog(
  cards,
  gameState,
  handlers,
  applyRemoveCard
) {
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'multi-card-remove-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  // Create dialog content
  const dialog = document.createElement('div');
  dialog.className = 'multi-card-remove-dialog';
  dialog.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a, #1e1e1e);
    border: 3px solid #dc3545;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    max-width: 800px;
    color: white;
    font-family: 'Cinzel', serif;
  `;

  // Create cards row (horizontal layout)
  const cardsRow = document.createElement('div');
  cardsRow.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  `;

  // Add each card to the row
  cards.forEach((card) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'remove-choice-card';
    cardElement.style.cssText = `
      background: linear-gradient(135deg, #ffffff, #f0f0f0);
      border: 2px solid #dc3545;
      border-radius: 8px;
      padding: 1rem 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #1e1e1e;
      width: 60px;
      height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      user-select: none;
      position: relative;
      overflow: hidden;
    `;

    const cardDisplay = `${card.value}${SUIT_TO_EMOJI_MAP[card.suit] || card.suit}`;
    cardElement.innerHTML = `
      <div style="font-size: 1.2em; transition: transform 0.2s ease;">${cardDisplay}</div>
    `;

    // Add hover effect
    cardElement.addEventListener('mouseenter', () => {
      cardElement.style.transform = 'translateY(-4px) scale(1.05)';
      cardElement.style.borderColor = '#dc3545';
      cardElement.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
    });

    cardElement.addEventListener('mouseleave', () => {
      cardElement.style.transform = 'translateY(0) scale(1)';
      cardElement.style.borderColor = '#dc3545';
      cardElement.style.boxShadow = 'none';
    });

    // Add click handler with satisfying feedback
    cardElement.addEventListener('click', async () => {
      // Immediate visual feedback
      cardElement.style.transform = 'translateY(-2px) scale(0.95)';
      cardElement.style.borderColor = '#dc3545';
      cardElement.style.background =
        'linear-gradient(135deg, #f8d7da, #f5c6cb)';
      cardElement.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.4)';

      // Add a subtle glow effect
      cardElement.style.filter = 'brightness(1.1)';

      // Disable pointer events to prevent double-clicks
      cardElement.style.pointerEvents = 'none';

      // Small delay for visual feedback, then proceed
      setTimeout(async () => {
        // Apply the remove card effect
        await applyRemoveCard(card, gameState);

        // Show success notification
        showNotification(
          'Card Removed!',
          `Removed ${cardDisplay} from your deck.`,
          'warning'
        );

        // Fade out the overlay with a satisfying animation
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';

        setTimeout(() => {
          overlay.remove();
          // Continue after choice
          if (handlers.resetBusyState) {
            handlers.resetBusyState();
            if (handlers.renderOverworldMap) {
              handlers.renderOverworldMap();
            }
          }
        }, 300);
      }, 150); // Short delay for visual feedback
    });

    cardsRow.appendChild(cardElement);
  });

  dialog.innerHTML = `
    <h3 style="margin-bottom: 1rem; color: #dc3545;">Choose a Card to Remove</h3>
    <p style="margin-bottom: 1rem; font-size: 1.1rem;">Select one card to remove from your deck, or decline all:</p>
  `;

  dialog.appendChild(cardsRow);

  // Add decline all button with enhanced feedback
  const declineButton = document.createElement('button');
  declineButton.className = 'btn btn-secondary';
  declineButton.style.cssText = `
    background: #6c757d;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
    color: white;
    transition: all 0.2s ease;
    user-select: none;
  `;
  declineButton.textContent = 'Decline All';

  // Add hover effect for decline button
  declineButton.addEventListener('mouseenter', () => {
    declineButton.style.background = '#5a6268';
    declineButton.style.transform = 'translateY(-1px)';
    declineButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  });

  declineButton.addEventListener('mouseleave', () => {
    declineButton.style.background = '#6c757d';
    declineButton.style.transform = 'translateY(0)';
    declineButton.style.boxShadow = 'none';
  });

  declineButton.addEventListener('click', () => {
    // Immediate visual feedback
    declineButton.style.background = '#495057';
    declineButton.style.transform = 'translateY(1px)';
    declineButton.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.2)';

    // Disable pointer events
    declineButton.style.pointerEvents = 'none';

    setTimeout(() => {
      showNotification(
        'Cards Kept',
        'You chose not to remove any cards from your deck.',
        'info'
      );

      // Fade out the overlay
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.style.opacity = '0';

      setTimeout(() => {
        overlay.remove();
        // Continue after choice
        if (handlers.resetBusyState) {
          handlers.resetBusyState();
          if (handlers.renderOverworldMap) {
            handlers.renderOverworldMap();
          }
        }
      }, 300);
    }, 100);
  });

  dialog.appendChild(declineButton);

  // Add to page
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

/**
 * Show/hide loading screen
 * @param {boolean} show - Whether to show or hide the loading screen
 */
export function toggleLoadingScreen(show = true) {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Show game interface (hide loading screen)
 */
export function showGameInterface() {
  toggleLoadingScreen(false);
}

/**
 * Show deck drawing animation for fortune/boon events
 * @param {Function} onComplete - Callback when animation completes
 * @param {Object} drawnCard - The card that was drawn (optional)
 * @param {number} delayAfterAnimation - Delay in milliseconds after animation completes (default: 1000)
 */
export function showDeckDrawingAnimation(
  onComplete,
  drawnCard = null,
  delayAfterAnimation = 400
) {
  // Get the player's actual deck size (default to 52 if not available)
  const deckSize = window.currentGameState?.deck?.length || 52;

  // Create deck drawing overlay
  const overlay = document.createElement('div');
  overlay.className = 'deck-drawing-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
  `;

  // Create container for the animation
  const container = document.createElement('div');
  container.className = 'deck-animation-container';
  container.style.cssText = `
    position: relative;
    width: 600px;
    height: 600px;
  `;

  // Create all cards stacked in the center
  for (let i = 0; i < deckSize; i++) {
    const card = document.createElement('div');
    card.className = 'deck-animation-card';
    card.textContent = '🔮'; // Crystal ball emoji for card back
    card.style.cssText = `
      position: absolute;
      width: 80px;
      height: 120px;
      background: linear-gradient(135deg, #2a2a2a, #1e1e1e);
      border: 2px solid #4a2c8f;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #8b8b8b;
      font-family: 'Cinzel', serif;
      font-size: 2rem;
      user-select: none;
      transform: translate(260px, 260px);
      opacity: 1;
      transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
      z-index: ${deckSize - i};
    `;
    container.appendChild(card);
  }

  // Add drawing text
  const drawingText = document.createElement('div');
  drawingText.textContent = 'Drawing from your deck...';
  drawingText.style.cssText = `
    text-align: center;
    color: white;
    font-size: 18px;
    margin-top: 20px;
  `;

  overlay.innerHTML = '';
  overlay.appendChild(container);
  overlay.appendChild(drawingText);

  // Add to page
  document.body.appendChild(overlay);

  // Animation configuration
  const FADE_DELAY = 25; // ms between each card fade
  const FADE_DISTANCE = 200; // pixels cards move when fading
  const FLIP_SQUASH_DURATION = 400; // ms for squash phase
  const FADE_WAIT_AFTER = 100; // ms to wait after all fades before flip

  const cards = Array.from(container.querySelectorAll('.deck-animation-card'));
  const allButLast = cards.slice(0, -1); // All except the last card

  // Move cards one by one in random directions, fading out
  allButLast.forEach((card, index) => {
    setTimeout(() => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = FADE_DISTANCE;
      const x = 260 + distance * Math.cos(angle);
      const y = 260 + distance * Math.sin(angle);
      card.style.transform = `translate(${x}px, ${y}px)`;
      card.style.opacity = '0';
    }, index * FADE_DELAY);
  });

  // Flip the last card after all fades complete
  setTimeout(
    () => {
      const lastCard = cards[cards.length - 1];

      // Get card display info
      const cardValue = drawnCard?.value;
      const cardSuit = drawnCard?.suit;
      const suitSymbol = SUIT_TO_EMOJI_MAP[cardSuit] || cardSuit;

      // Step 1: Squash the card (make it invisible)
      lastCard.style.transform = `translate(260px, 260px) scaleX(0)`;
      lastCard.style.transition = 'transform 0.4s ease-in-out';

      // Step 2: After squash completes, switch to front and stretch back
      setTimeout(() => {
        lastCard.textContent = `${cardValue}${suitSymbol}`;
        lastCard.style.background = 'linear-gradient(135deg, #2d1b69, #4a2c8f)'; // Purple gradient
        lastCard.style.color = '#e0e0e0'; // White text
        lastCard.style.fontSize = '1.5rem';
        lastCard.style.transform = `translate(260px, 260px) scaleX(1)`;

        // Step 3: Wait for delay, then remove overlay and call onComplete
        setTimeout(() => {
          overlay.remove();
          if (onComplete) {
            onComplete();
          }
        }, delayAfterAnimation);
      }, FLIP_SQUASH_DURATION);
    },
    allButLast.length * FADE_DELAY + FADE_WAIT_AFTER
  );
}

/**
 * Show inventory overflow dialog for selecting artifacts to remove
 * @param {Array} artifacts - Array of artifact objects with value, name, emoji, description
 * @param {number} overflowCount - Number of artifacts that need to be removed
 * @param {string} message - Custom message to display
 * @param {Function} onComplete - Callback when selection is complete
 */
export async function showInventoryOverflowDialog(
  artifacts,
  overflowCount,
  message,
  onComplete
) {
  // Import the data we need for tooltips
  const { EQUIPMENT, ARTIFACT_DETAILS } = await import('./gameConstants.js');

  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'inventory-overflow-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  // Create dialog content
  const dialog = document.createElement('div');
  dialog.className = 'inventory-overflow-dialog';
  dialog.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a, #1e1e1e);
    border: 3px solid #dc3545;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    max-width: 800px;
    color: white;
    font-family: 'Cinzel', serif;
  `;

  // Create artifacts row (horizontal layout)
  const artifactsRow = document.createElement('div');
  artifactsRow.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  `;

  const selectedArtifacts = [];

  // Add each artifact to the row
  artifacts.forEach((artifact) => {
    const artifactElement = document.createElement('div');
    artifactElement.className = 'inventory-overflow-artifact';
    artifactElement.style.cssText = `
      background: linear-gradient(135deg, #ffffff, #f0f0f0);
      border: 2px solid #dc3545;
      border-radius: 8px;
      padding: 1rem 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #1e1e1e;
      width: 80px;
      height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      user-select: none;
      position: relative;
      overflow: hidden;
    `;

    artifactElement.innerHTML = `
      <div style="font-size: 1.5em; margin-bottom: 0.5rem;">${artifact.emoji}</div>
      <div style="font-size: 0.8em; text-align: center; line-height: 1.2;">${artifact.name}</div>
    `;

    // Add tooltip with correct data sources
    let tooltipText = 'No description available';

    if (artifact.type === 'weapon') {
      const weaponData = EQUIPMENT.weapons[artifact.value];
      tooltipText = weaponData?.cardCondition || 'No effect available';
    } else if (artifact.type === 'armor') {
      const armorData = EQUIPMENT.armor[artifact.value];
      tooltipText = armorData?.cardCondition || 'No effect available';
    } else if (artifact.type === 'artifact') {
      const artifactData = ARTIFACT_DETAILS[artifact.value];
      tooltipText = artifactData?.effectText || 'No effect available';
    }

    artifactElement.title = tooltipText;

    // Add hover effect
    artifactElement.addEventListener('mouseenter', () => {
      artifactElement.style.transform = 'translateY(-4px) scale(1.05)';
      artifactElement.style.borderColor = '#dc3545';
      artifactElement.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
    });

    artifactElement.addEventListener('mouseleave', () => {
      artifactElement.style.transform = 'translateY(0) scale(1)';
      artifactElement.style.borderColor = '#dc3545';
      artifactElement.style.boxShadow = 'none';
    });

    // Add click handler
    artifactElement.addEventListener('click', () => {
      const index = selectedArtifacts.findIndex(
        (a) => a.value === artifact.value
      );

      if (index === -1) {
        // Select artifact
        selectedArtifacts.push(artifact);
        artifactElement.style.background =
          'linear-gradient(135deg, #f8d7da, #f5c6cb)';
        artifactElement.style.borderColor = '#dc3545';
        artifactElement.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.4)';
      } else {
        // Deselect artifact
        selectedArtifacts.splice(index, 1);
        artifactElement.style.background =
          'linear-gradient(135deg, #ffffff, #f0f0f0)';
        artifactElement.style.borderColor = '#dc3545';
        artifactElement.style.boxShadow = 'none';
      }

      // Update confirm button state
      updateConfirmButton();
    });

    artifactsRow.appendChild(artifactElement);
  });

  // Create confirm button
  const confirmButton = document.createElement('button');
  confirmButton.className = 'btn btn-danger';
  confirmButton.style.cssText = `
    background: #dc3545;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin: 1rem 0.5rem;
    color: white;
    transition: all 0.2s ease;
    user-select: none;
    opacity: 0.5;
    pointer-events: none;
  `;
  confirmButton.textContent = `Remove ${overflowCount} Item${overflowCount > 1 ? 's' : ''}`;

  function updateConfirmButton() {
    if (selectedArtifacts.length === overflowCount) {
      confirmButton.style.opacity = '1';
      confirmButton.style.pointerEvents = 'auto';
    } else {
      confirmButton.style.opacity = '0.5';
      confirmButton.style.pointerEvents = 'none';
    }
  }

  // Add hover effect for confirm button
  confirmButton.addEventListener('mouseenter', () => {
    if (selectedArtifacts.length === overflowCount) {
      confirmButton.style.background = '#c82333';
      confirmButton.style.transform = 'translateY(-1px)';
      confirmButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    }
  });

  confirmButton.addEventListener('mouseleave', () => {
    confirmButton.style.background = '#dc3545';
    confirmButton.style.transform = 'translateY(0)';
    confirmButton.style.boxShadow = 'none';
  });

  confirmButton.addEventListener('click', () => {
    if (selectedArtifacts.length === overflowCount) {
      // Fade out the overlay
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.style.opacity = '0';

      setTimeout(() => {
        overlay.remove();
        onComplete(selectedArtifacts);
      }, 300);
    }
  });

  dialog.innerHTML = `
    <h3 style="margin-bottom: 1rem; color: #dc3545;">Inventory Overload</h3>
    <p style="margin-bottom: 1rem; font-size: 1.1rem;">${message}</p>
    <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #ccc;">Hover over items to see descriptions</p>
  `;

  dialog.appendChild(artifactsRow);

  // Add button container (only confirm button, no cancel)
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
  `;
  buttonContainer.appendChild(confirmButton);
  dialog.appendChild(buttonContainer);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

/**
 * Show a challenge card selection dialog where players draw up to their hand limit and choose one card to play
 * @param {Array} cards - Array of card objects to show (drawn up to hand limit)
 * @param {Object} gameState - Current game state
 * @param {Object} handlers - Handler functions
 * @param {string} challengeStat - The stat being challenged (power, will, craft, focus)
 * @param {number} targetValue - The target value needed to succeed
 * @param {Function} onChallengeComplete - Callback when challenge is complete
 */
export function showChallengeCardDialog(
  cards,
  gameState,
  handlers,
  challengeStat,
  targetValue,
  onChallengeComplete
) {
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'challenge-card-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  // Create dialog content
  const dialog = document.createElement('div');
  dialog.className = 'challenge-card-dialog';
  dialog.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a, #1e1e1e);
    border: 3px solid #ffc107;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    max-width: 800px;
    color: white;
    font-family: 'Cinzel', serif;
  `;

  // Get current stat value
  const currentStat = gameState.gameData.stats[challengeStat] || 0;
  const statModifier = gameState.runData.statModifiers?.[challengeStat] || 0;
  const totalStat = currentStat + statModifier;

  // Create challenge info section
  const challengeInfo = document.createElement('div');
  challengeInfo.style.cssText = `
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(255, 193, 7, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(255, 193, 7, 0.3);
  `;
  challengeInfo.innerHTML = `
    <h3 style="margin-bottom: 1rem; color: #ffc107;">${challengeStat.charAt(0).toUpperCase() + challengeStat.slice(1)} Challenge</h3>
    <p style="margin-bottom: 0.5rem;"><strong>Target:</strong> ${targetValue}</p>
    <p style="margin-bottom: 0.5rem;"><strong>${challengeStat.charAt(0).toUpperCase() + challengeStat.slice(1)}:</strong> ${currentStat} (+${statModifier})</p>
  `;

  // Create cards row (horizontal layout)
  const cardsRow = document.createElement('div');
  cardsRow.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  `;

  // Add each card to the row
  cards.forEach((card) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'challenge-choice-card';
    cardElement.style.cssText = `
      background: linear-gradient(135deg, #ffffff, #f0f0f0);
      border: 2px solid #ffc107;
      border-radius: 8px;
      padding: 1rem 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #1e1e1e;
      width: 60px;
      height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      user-select: none;
      position: relative;
      overflow: hidden;
    `;

    const cardDisplay = `${card.value}${SUIT_TO_EMOJI_MAP[card.suit] || card.suit}`;
    const cardValue = getCardValue(card);
    const totalValue = totalStat + cardValue;
    const willSucceed = totalValue >= targetValue;

    cardElement.innerHTML = `
      <div style="font-size: 1.2em; transition: transform 0.2s ease;">${cardDisplay}</div>
      <div style="font-size: 0.7em; margin-top: 0.5rem; color: ${willSucceed ? '#28a745' : '#dc3545'};">
        ${totalValue} ${willSucceed ? '✓' : '✗'}
      </div>
    `;

    // Add hover effect
    cardElement.addEventListener('mouseenter', () => {
      cardElement.style.transform = 'translateY(-4px) scale(1.05)';
      cardElement.style.borderColor = willSucceed ? '#28a745' : '#dc3545';
      cardElement.style.boxShadow = `0 4px 12px rgba(${willSucceed ? '40, 167, 69' : '220, 53, 69'}, 0.3)`;
    });

    cardElement.addEventListener('mouseleave', () => {
      cardElement.style.transform = 'translateY(0) scale(1)';
      cardElement.style.borderColor = '#ffc107';
      cardElement.style.boxShadow = 'none';
    });

    // Add click handler with satisfying feedback
    cardElement.addEventListener('click', async () => {
      // Immediate visual feedback
      cardElement.style.transform = 'translateY(-2px) scale(0.95)';
      cardElement.style.borderColor = willSucceed ? '#28a745' : '#dc3545';
      cardElement.style.background = willSucceed
        ? 'linear-gradient(135deg, #d4edda, #c3e6cb)'
        : 'linear-gradient(135deg, #f8d7da, #f5c6cb)';
      cardElement.style.boxShadow = `0 2px 8px rgba(${willSucceed ? '40, 167, 69' : '220, 53, 69'}, 0.4)`;

      // Add a subtle glow effect
      cardElement.style.filter = 'brightness(1.1)';

      // Disable pointer events to prevent double-clicks
      cardElement.style.pointerEvents = 'none';

      // Small delay for visual feedback, then proceed
      setTimeout(async () => {
        // Call the challenge completion callback
        await onChallengeComplete(card, willSucceed, totalValue, targetValue);

        // Fade out the overlay with a satisfying animation
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';

        setTimeout(() => {
          overlay.remove();
          // Continue after choice
          if (handlers.resetBusyState) {
            handlers.resetBusyState();
            if (handlers.renderOverworldMap) {
              handlers.renderOverworldMap();
            }
          }
        }, 300);
      }, 150); // Short delay for visual feedback
    });

    cardsRow.appendChild(cardElement);
  });

  dialog.appendChild(challengeInfo);
  dialog.appendChild(cardsRow);

  // Add to page
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}
