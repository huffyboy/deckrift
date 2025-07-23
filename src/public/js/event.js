// event.js - Page-specific logic for Event

// Import shared utilities
import { getCardValue } from './modules/sharedGameUtils.js';

// Initialize event interface
document.addEventListener('DOMContentLoaded', () => {
  // Get event state from server-side data
  if (typeof window.eventState !== 'undefined') {
    // Event state available
  }

  // Initialize event interface
  initializeEvent();
});

function initializeEvent() {
  // Event initialization logic
}

// Make getCardValue available globally for EJS compatibility
window.getCardValue = getCardValue;
