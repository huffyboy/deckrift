// Main Game Controller - Multi-Page Version
// This file now handles basic initialization and page-specific functionality

import {
  showError as showErrorUtil,
  showSuccess as showSuccessUtil,
  showWarning as showWarningUtil,
  showInfo as showInfoUtil,
  showNotification as showNotificationUtil,
  toggleLoadingScreen,
  showGameInterface as showGameInterfaceUtil,
} from './modules/uiUtils.js';

import {
  loadHomeRealmData as loadHomeRealmDataUtil,
  loadGameState as loadGameStateUtil,
  loadBattleState as loadBattleStateUtil,
  loadEventData as loadEventDataUtil,
  loadShopData as loadShopDataUtil,
  loadGameOverData as loadGameOverDataUtil,
  loadStatsData as loadStatsDataUtil,
  loadProfileData as loadProfileDataUtil,
} from './modules/dataLoader.js';

class DeckriftGame {
  constructor() {
    // Initialize basic state
    this.currentPage = this.getCurrentPage();
    this.isAuthenticated = false;
    this.user = null;

    // Initialize game
    this.init();
  }

  async init() {
    try {
      // Initialize page-specific functionality
      this.initializePage();

      // Setup global event listeners
      this.setupGlobalEventListeners();
    } catch (error) {
      this.showError('Failed to initialize game. Please refresh the page.');
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/home-realm')) return 'home-realm';
    if (path.startsWith('/game')) return 'game';
    if (path.startsWith('/battle')) return 'battle';
    if (path.startsWith('/event')) return 'event';
    if (path.startsWith('/shop')) return 'shop';
    if (path.startsWith('/game-over')) return 'game-over';
    if (path.startsWith('/stats')) return 'stats';
    if (path.startsWith('/profile')) return 'profile';
    return 'home';
  }

  // Authentication is handled by server-side middleware
  // No client-side authentication checks needed

  initializePage() {
    switch (this.currentPage) {
      case 'home':
        this.initializeHomePage();
        break;
      case 'home-realm':
        this.initializeHomeRealmPage();
        break;
      case 'game':
        this.initializeGamePage();
        break;
      case 'battle':
        this.initializeBattlePage();
        break;
      case 'event':
        this.initializeEventPage();
        break;
      case 'shop':
        this.initializeShopPage();
        break;
      case 'game-over':
        this.initializeGameOverPage();
        break;
      case 'stats':
        this.initializeStatsPage();
        break;
      case 'profile':
        this.initializeProfilePage();
        break;
    }
  }

  initializeHomePage() {
    // Home page specific initialization
    this.hideLoadingScreen();
    this.showGameInterface();
  }

  initializeHomeRealmPage() {
    // Home realm page specific initialization
    this.loadHomeRealmData();
  }

  initializeGamePage() {
    // Game page specific initialization
    this.loadGameState();
  }

  initializeBattlePage() {
    // Battle page specific initialization
    this.loadBattleState();
  }

  initializeEventPage() {
    // Event page specific initialization
    this.loadEventData();
  }

  initializeShopPage() {
    // Shop page specific initialization
    this.loadShopData();
  }

  initializeGameOverPage() {
    // Game over page specific initialization
    this.loadGameOverData();
  }

  initializeStatsPage() {
    // Stats page specific initialization
    this.loadStatsData();
  }

  initializeProfilePage() {
    // Profile page specific initialization
    this.loadProfileData();
  }

  setupGlobalEventListeners() {
    // Global event listeners that work across all pages

    // Handle logout
    const logoutBtn = document.querySelector('a[href="/api/auth/logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.handleLogout();
      });
    }

    // Handle navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[href^="/"]')) {
        // Let normal navigation happen for internal links
      }
    });

    // Handle form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.matches('form')) {
        // Handle form submission
      }
    });
  }

  // Authentication forms are handled by normal HTML form submission
  // No JavaScript setup needed - server handles everything

  // Login and register are handled by server-side form processing
  // No client-side handlers needed

  async handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/';
      } else {
        this.showError('Logout failed');
      }
    } catch (error) {
      this.showError('Logout failed. Please try again.');
    }
  }

  // Page-specific data loading methods - now using shared dataLoader
  async loadHomeRealmData() {
    try {
      const data = await loadHomeRealmDataUtil();
      this.updateHomeRealmInterface(data);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  async loadGameState() {
    try {
      const gameState = await loadGameStateUtil();
      this.updateGameInterface(gameState);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  async loadBattleState() {
    try {
      const battleState = await loadBattleStateUtil();
      this.updateBattleInterface(battleState);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  async loadEventData() {
    try {
      const eventData = await loadEventDataUtil();
      this.updateEventInterface(eventData);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  async loadShopData() {
    try {
      const shopData = await loadShopDataUtil();
      this.updateShopInterface(shopData);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  async loadGameOverData() {
    try {
      const runResult = await loadGameOverDataUtil();
      this.updateGameOverInterface(runResult);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  async loadStatsData() {
    try {
      const statsData = await loadStatsDataUtil();
      this.updateStatsInterface(statsData);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  async loadProfileData() {
    try {
      const profileData = await loadProfileDataUtil();
      this.updateProfileInterface(profileData);
    } catch (error) {
      // Error already handled by dataLoader
    }
  }

  // Interface update methods (to be implemented by page-specific scripts)
  updateHomeRealmInterface(_data) {
    // Update home realm interface with data
  }

  updateGameInterface(_gameState) {
    // Update game interface with state
  }

  updateBattleInterface(_battleState) {
    // Update battle interface with state
  }

  updateEventInterface(_eventData) {
    // Update event interface with data
  }

  updateShopInterface(_shopData) {
    // Update shop interface with data
  }

  updateGameOverInterface(_runResult) {
    // Update game over interface with result
  }

  updateStatsInterface(_statsData) {
    // Update stats interface with data
  }

  updateProfileInterface(_profileData) {
    // Update profile interface with data
  }

  // Utility methods - now using shared uiUtils
  showError(message) {
    showErrorUtil(message);
  }

  showSuccess(message) {
    showSuccessUtil(message);
  }

  showWarning(message) {
    showWarningUtil(message);
  }

  showInfo(message) {
    showInfoUtil(message);
  }

  showNotification(title, message, type = 'info') {
    showNotificationUtil(title, message, type);
  }

  hideLoadingScreen() {
    toggleLoadingScreen(false);
  }

  showGameInterface() {
    showGameInterfaceUtil();
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new DeckriftGame();
  game.init();
});
