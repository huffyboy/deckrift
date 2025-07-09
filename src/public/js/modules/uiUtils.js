// uiUtils.js - Shared UI utility functions

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
