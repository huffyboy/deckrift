// status.js - Page-specific logic for Status page

// Status state management
let currentDeck = [];
let sortByValue = true; // true = sort by value first, false = sort by suit first

// Wait for gameData to be loaded
function waitForGameData() {
  if (window.gameData) {
    initializeStatus();
  } else {
    setTimeout(waitForGameData, 100);
  }
}

// Initialize status interface
document.addEventListener('DOMContentLoaded', () => {
  // Get data from server
  if (window.currentDeck && Array.isArray(window.currentDeck)) {
    currentDeck = window.currentDeck;
  }

  // Wait for gameData to be available before initializing
  waitForGameData();
});

function initializeStatus() {
  displayDeck();
  updateDeckInfo();
  setupSortToggle();
}

function setupSortToggle() {
  const sortButton = document.getElementById('sort-toggle');
  if (sortButton) {
    sortButton.addEventListener('click', () => {
      sortByValue = !sortByValue;
      updateSortButtonText();
      displayDeck();
    });
    updateSortButtonText();
  }
}

function updateSortButtonText() {
  const sortButton = document.getElementById('sort-toggle');
  if (sortButton) {
    sortButton.textContent = sortByValue ? 'Sort by Suit' : 'Sort by Value';
  }
}

function sortDeck(deck) {
  return [...deck].sort((a, b) => {
    if (sortByValue) {
      // Sort by value first, then by suit
      const valueDiff =
        window.gameData.CARD_VALUES[b.value] -
        window.gameData.CARD_VALUES[a.value];
      if (valueDiff !== 0) return valueDiff;
      return (
        window.gameData.SUIT_ORDER[a.suit] - window.gameData.SUIT_ORDER[b.suit]
      );
    } else {
      // Sort by suit first, then by value
      const suitDiff =
        window.gameData.SUIT_ORDER[a.suit] - window.gameData.SUIT_ORDER[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return (
        window.gameData.CARD_VALUES[b.value] -
        window.gameData.CARD_VALUES[a.value]
      );
    }
  });
}

function displayDeck() {
  const deckDisplay = document.getElementById('deck-display');
  if (!deckDisplay) {
    return;
  }

  deckDisplay.innerHTML = '';

  // Sort the deck
  const sortedDeck = sortDeck(currentDeck);

  // Display sorted cards
  sortedDeck.forEach((card) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'status-deck-card';
    cardElement.setAttribute('data-suit', card.suit);
    cardElement.innerHTML =
      '<div class="card-value">' +
      card.value +
      '</div>' +
      '<div class="card-suit">' +
      window.gameData.SUIT_TO_EMOJI_MAP[card.suit] +
      '</div>';
    deckDisplay.appendChild(cardElement);
  });
}

function updateDeckInfo() {
  const deckSize = document.getElementById('deck-size');

  if (deckSize) deckSize.textContent = currentDeck.length;
}
