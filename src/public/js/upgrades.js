// upgrades.js - Page-specific logic for Upgrades page

import {
  showSuccess,
  showError,
  updateCurrencyDisplay,
} from './modules/uiUtils.js';
import { loadUpgradesData } from './modules/dataLoader.js';

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

async function updateUpgradeUI() {
  try {
    const data = await loadUpgradesData();
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
  } catch (error) {
    // Error already handled by dataLoader
  }
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
