// Main Game Controller - Multi-Page Version
// This file now handles basic initialization and page-specific functionality

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
      // Check authentication status
      await this.checkAuthentication();

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

  async checkAuthentication() {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();

      if (data.authenticated) {
        this.isAuthenticated = true;
        this.user = data.user;
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/auth/login';
      }
    } catch (error) {
      // Handle authentication check errors
    }
  }

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

  setupAuthForms() {
    // Setup authentication forms for home page
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister();
      });
    }
  }

  async handleLogin() {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.get('username'),
          password: formData.get('password'),
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/home-realm';
      } else {
        this.showError(data.error || 'Login failed');
      }
    } catch (error) {
      this.showError('Login failed. Please try again.');
    }
  }

  async handleRegister() {
    const form = document.getElementById('register-form');
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/home-realm';
      } else {
        this.showError(data.error || 'Registration failed');
      }
    } catch (error) {
      this.showError('Registration failed. Please try again.');
    }
  }

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

  // Page-specific data loading methods
  async loadHomeRealmData() {
    try {
      const response = await fetch('/api/home-realm/data');
      const data = await response.json();
      this.updateHomeRealmInterface(data);
    } catch (error) {
      this.showError('Failed to load home realm data');
    }
  }

  async loadGameState() {
    try {
      const response = await fetch('/api/game/state');
      const gameState = await response.json();
      this.updateGameInterface(gameState);
    } catch (error) {
      this.showError('Failed to load game state');
    }
  }

  async loadBattleState() {
    try {
      const response = await fetch('/api/battle/state');
      const battleState = await response.json();
      this.updateBattleInterface(battleState);
    } catch (error) {
      this.showError('Failed to load battle state');
    }
  }

  async loadEventData() {
    try {
      const response = await fetch('/api/event/data');
      const eventData = await response.json();
      this.updateEventInterface(eventData);
    } catch (error) {
      this.showError('Failed to load event data');
    }
  }

  async loadShopData() {
    try {
      const response = await fetch('/api/shop/data');
      const shopData = await response.json();
      this.updateShopInterface(shopData);
    } catch (error) {
      this.showError('Failed to load shop data');
    }
  }

  async loadGameOverData() {
    try {
      const response = await fetch('/api/game-over/data');
      const runResult = await response.json();
      this.updateGameOverInterface(runResult);
    } catch (error) {
      this.showError('Failed to load game over data');
    }
  }

  async loadStatsData() {
    try {
      const response = await fetch('/api/stats/data');
      const statsData = await response.json();
      this.updateStatsInterface(statsData);
    } catch (error) {
      this.showError('Failed to load stats data');
    }
  }

  async loadProfileData() {
    try {
      const response = await fetch('/api/profile/data');
      const profileData = await response.json();
      this.updateProfileInterface(profileData);
    } catch (error) {
      this.showError('Failed to load profile data');
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

  // Utility methods
  showError(message) {
    this.showNotification('Error', message, 'error');
  }

  showSuccess(message) {
    this.showNotification('Success', message, 'success');
  }

  showWarning(message) {
    this.showNotification('Warning', message, 'warning');
  }

  showInfo(message) {
    this.showNotification('Info', message, 'info');
  }

  showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-title">${title}</span>
        <button class="notification-close">&times;</button>
      </div>
      <div class="notification-body">${message}</div>
    `;

    // Add to page
    const container =
      document.querySelector('.notification-container') || document.body;
    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Handle close button
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }

  showGameInterface() {
    const gameInterface = document.getElementById('game-interface');
    if (gameInterface) {
      gameInterface.style.display = 'block';
    }
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new DeckriftGame();
  game.init();
});
