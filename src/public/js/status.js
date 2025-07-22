// status.js - Page-specific logic for Status page

import {
  TEXT_TO_VALUE_MAP,
  SUIT_ORDER,
  SUIT_TO_EMOJI_MAP,
} from './modules/gameData.js';

// Status state management
let currentDeck = [];
let sortByValue = true; // true = sort by value first, false = sort by suit first

// Initialize status interface
document.addEventListener('DOMContentLoaded', () => {
  // Get data from server
  if (window.currentDeck && Array.isArray(window.currentDeck)) {
    currentDeck = window.currentDeck;
  }

  initializeStatus();
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
      const valueDiff = TEXT_TO_VALUE_MAP[b.value] - TEXT_TO_VALUE_MAP[a.value];
      if (valueDiff !== 0) return valueDiff;
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    } else {
      // Sort by suit first, then by value
      const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return TEXT_TO_VALUE_MAP[b.value] - TEXT_TO_VALUE_MAP[a.value];
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
      SUIT_TO_EMOJI_MAP[card.suit] +
      '</div>';
    deckDisplay.appendChild(cardElement);
  });
}

function updateDeckInfo() {
  const deckSizeElement = document.getElementById('deck-size');
  if (deckSizeElement) {
    deckSizeElement.textContent = currentDeck.length;
  }
}
