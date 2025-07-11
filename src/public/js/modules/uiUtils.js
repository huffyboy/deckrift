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

  // Auto-remove after duration
  setTimeout(removeMessage, duration);

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
