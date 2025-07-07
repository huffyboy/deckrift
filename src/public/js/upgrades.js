// upgrades.js - Page-specific logic for Upgrades page

function updateCurrencyDisplay(newCurrency) {
  // Update the currency display on the page
  const currencyElement = document.querySelector('h4');
  if (currencyElement && currencyElement.textContent.includes('Currency:')) {
    currencyElement.textContent = `Currency: ${newCurrency}`;
  }
}

function showSuccess(message) {
  // Create a success alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  // Insert at the top of the container
  const container = document.querySelector('.container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }
}

function showError(message) {
  // Create an error alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  // Insert at the top of the container
  const container = document.querySelector('.container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }
}

function purchaseUpgrade(upgradeId, cost, buttonElement) {
  const button = buttonElement;
  button.disabled = true;
  button.textContent = 'Purchasing...';

  fetch('/upgrades/purchase-upgrade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      upgradeId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        button.textContent = 'Purchased';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-success');
        button.disabled = true;

        updateCurrencyDisplay(data.newCurrency);

        showSuccess(data.message);
      } else {
        showError(data.error);

        button.disabled = false;
        button.textContent = `Purchase (${cost} Currency)`;
      }
    })
    .catch((_error) => {
      showError('Error purchasing upgrade. Please try again.');

      button.disabled = false;
      button.textContent = `Purchase (${cost} Currency)`;
    });
}

function updateUpgradeUI() {
  fetch('/api/upgrades')
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const { upgrades, currency } = data;

        const currencyElement = document.getElementById('currency-display');
        if (currencyElement) {
          currencyElement.textContent = currency;
        }

        upgrades.forEach((upgrade) => {
          const buttonElement = document.querySelector(
            `[data-upgrade="${upgrade.id}"]`
          );
          if (buttonElement) {
            if (upgrade.unlocked) {
              buttonElement.textContent = 'Unlocked';
              buttonElement.disabled = true;
              buttonElement.classList.add('unlocked');
            } else {
              buttonElement.textContent = `Purchase (${upgrade.cost})`;
              buttonElement.disabled = currency < upgrade.cost;
              buttonElement.classList.remove('unlocked');
            }
          }
        });
      }
    })
    .catch((_error) => {
      showError('Failed to load upgrades');
    });
}

function setupUpgradeEventListeners() {
  // Upgrade purchase buttons
  const upgradeButtons = document.querySelectorAll('.purchase-upgrade-btn');
  upgradeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const upgradeId = btn.getAttribute('data-upgrade-id');
      const cost = parseInt(btn.getAttribute('data-cost'), 10);

      if (upgradeId) {
        purchaseUpgrade(upgradeId, cost, btn);
      }
    });
  });
}

function initializeUpgrades() {
  // Setup event listeners for upgrade buttons
  setupUpgradeEventListeners();

  // Update UI to show purchased upgrades
  updateUpgradeUI();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeUpgrades();
  setupUpgradeEventListeners();
  updateUpgradeUI();
});
