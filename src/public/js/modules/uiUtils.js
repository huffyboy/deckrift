// uiUtils.js - Shared UI utility functions

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
export function showDeckDrawingAnimation(onComplete, drawnCard = null, delayAfterAnimation = 1000) {
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
  const FADE_DELAY = 50; // ms between each card fade
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
  setTimeout(() => {
    const lastCard = cards[cards.length - 1];

    // Get card display info
    const cardValue = drawnCard?.value || 'A';
    const cardSuit = drawnCard?.suit || '♥️';

    // Step 1: Squash the card (make it invisible)
    lastCard.style.transform = `translate(260px, 260px) scaleX(0)`;
    lastCard.style.transition = 'transform 0.4s ease-in-out';

    // Step 2: After squash completes, switch to front and stretch back
    setTimeout(() => {
      lastCard.textContent = `${cardValue}${cardSuit}`;
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
  }, allButLast.length * FADE_DELAY + FADE_WAIT_AFTER);
}
