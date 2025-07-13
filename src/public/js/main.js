// Main Game Controller - Multi-Page Version
// This file now handles basic initialization and page-specific functionality

// Remove ES6 imports and make it work without modules
// The functions will be available globally if needed

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
    if (path.startsWith('/status')) return 'status';
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
      case 'status':
        this.initializeStatusPage();
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
    // Data loading handled by server-side rendering
  }

  initializeGamePage() {
    // Game page specific initialization
    // Data loading handled by server-side rendering
  }

  initializeBattlePage() {
    // Battle page specific initialization
    // Data loading handled by server-side rendering
  }

  initializeEventPage() {
    // Event page specific initialization
    // Data loading handled by server-side rendering
  }

  initializeShopPage() {
    // Shop page specific initialization
    // Data loading handled by server-side rendering
  }

  initializeGameOverPage() {
    // Game over page specific initialization
    // Data loading handled by server-side rendering
  }

  initializeStatusPage() {
    // Status page specific initialization
    // Data loading handled by server-side rendering
  }

  initializeProfilePage() {
    // Profile page specific initialization
    // Data loading handled by server-side rendering
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

  // Page-specific data loading methods - now using server-side rendering
  // No client-side data loading needed for most pages

  showError(message) {
    if (window.showNotification) {
      window.showNotification('Error', message, 'error');
    }
  }

  showSuccess(message) {
    if (window.showNotification) {
      window.showNotification('Success', message, 'success');
    }
  }

  showWarning(message) {
    if (window.showNotification) {
      window.showNotification('Warning', message, 'warning');
    }
  }

  showInfo(message) {
    if (window.showNotification) {
      window.showNotification('Info', message, 'info');
    }
  }

  showNotification(title, message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(title, message, type);
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }

  showGameInterface() {
    const gameInterface = document.querySelector('.game-interface');
    if (gameInterface) {
      gameInterface.style.display = 'block';
    }
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.game = new DeckriftGame();
});
