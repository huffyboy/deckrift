// dataLoader.js - Shared data loading functions

import { showError } from './uiUtils.js';

/**
 * Generic data loader with error handling
 * @param {string} endpoint - API endpoint to fetch from
 * @param {string} errorMessage - Error message to show on failure
 * @returns {Promise<Object>} - Parsed JSON response
 */
export async function loadData(endpoint, errorMessage = 'Failed to load data') {
  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || errorMessage);
    }

    return data;
  } catch (error) {
    showError(errorMessage);
    throw error;
  }
}

/**
 * Load home realm data
 * @returns {Promise<Object>} - Home realm data
 */
export async function loadHomeRealmData() {
  return loadData('/home-realm/data', 'Failed to load home realm data');
}

/**
 * Load game state
 * @returns {Promise<Object>} - Game state data
 */
export async function loadGameState() {
  return loadData('/game/state', 'Failed to load game state');
}

/**
 * Load battle state
 * @returns {Promise<Object>} - Battle state data
 */
export async function loadBattleState() {
  return loadData('/battle/state', 'Failed to load battle state');
}

/**
 * Load event data
 * @returns {Promise<Object>} - Event data
 */
export async function loadEventData() {
  return loadData('/event/data', 'Failed to load event data');
}

/**
 * Load shop data
 * @returns {Promise<Object>} - Shop data
 */
export async function loadShopData() {
  return loadData('/shop/data', 'Failed to load shop data');
}

/**
 * Load game over data
 * @returns {Promise<Object>} - Game over data
 */
export async function loadGameOverData() {
  return loadData('/game-over/data', 'Failed to load game over data');
}

/**
 * Load status data
 * @returns {Promise<Object>} - Status data
 */
export async function loadStatusData() {
  return loadData('/status/data', 'Failed to load status data');
}

/**
 * Load settings data
 * @returns {Promise<Object>} - Settings data
 */
export async function loadSettingsData() {
  return loadData('/settings/data', 'Failed to load settings data');
}

/**
 * Load upgrades data
 * @returns {Promise<Object>} - Upgrades data
 */
export async function loadUpgradesData() {
  return loadData('/upgrades', 'Failed to load upgrades');
}

/**
 * Load shop items
 * @returns {Promise<Object>} - Shop items data
 */
export async function loadShopItems() {
  return loadData('/shop/items', 'Failed to load shop items');
}

/**
 * Load status
 * @returns {Promise<Object>} - Status data
 */
export async function loadStatus() {
  return loadData('/status', 'Failed to load status');
}
