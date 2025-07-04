// Main Game Controller - Highly Modular Version
import { GameState } from './modules/gameState.js';
import { ProfileManager } from './modules/profileManager.js';
import { DeckManager } from './modules/deckManager.js';
import { BattleLogic } from './modules/battleLogic.js';
import { EventHandler } from './modules/eventHandler.js';
import { UIManager } from './modules/uiManager.js';
import { ShopSystem } from './modules/shopSystem.js';
import { ArtifactSystem } from './modules/artifactSystem.js';
import { BossSystem } from './modules/bossSystem.js';

class DeckriftGame {
    constructor() {
        // Error handling state
        this.errorState = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Initialize core modules
        this.gameState = new GameState();
        this.deckManager = new DeckManager();
        
        // Initialize specialized modules
        this.profileManager = new ProfileManager(this.gameState);
        this.battleLogic = new BattleLogic(this.gameState, this.deckManager);
        this.eventHandler = new EventHandler(this.gameState, this.deckManager);
        this.uiManager = new UIManager(this.gameState, this.deckManager);
        this.shopSystem = new ShopSystem(this.gameState, this.deckManager);
        this.artifactSystem = new ArtifactSystem(this.gameState);
        this.bossSystem = new BossSystem(this.gameState, this.deckManager);
        
        // Game state
        this.currentBattle = null;
        
        // Performance tracking
        this.performanceMetrics = {
            loadTime: 0,
            lastActionTime: 0,
            errors: []
        };
        
        // Initialize game
        this.init();
    }
    
    async init() {
        const startTime = performance.now();
        
        try {
            // Load game data
            await this.gameState.loadGameData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Determine initial screen
            await this.determineInitialScreen();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Record performance
            this.performanceMetrics.loadTime = performance.now() - startTime;
            console.log(`Game loaded in ${this.performanceMetrics.loadTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.handleError(error, 'Failed to initialize game. Please refresh the page.');
        }
    }
    
    handleError(error, userMessage) {
        this.performanceMetrics.errors.push({
            timestamp: Date.now(),
            error: error.message,
            stack: error.stack
        });
        
        console.error('Game Error:', error);
        
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retrying... Attempt ${this.retryCount}/${this.maxRetries}`);
            setTimeout(() => this.init(), 1000 * this.retryCount);
        } else {
            this.errorState = true;
            this.showError(userMessage);
        }
    }
    
    setupEventListeners() {
        // Profile selection
        document.getElementById('create-profile-btn')?.addEventListener('click', () => {
            this.uiManager.showCreateProfileModal();
        });
        
        // Home realm
        document.getElementById('start-new-run-btn')?.addEventListener('click', async () => {
            await this.startNewRun();
        });
        
        document.getElementById('resume-run-btn')?.addEventListener('click', async () => {
            await this.resumeRun();
        });
        
        document.getElementById('view-stats-btn')?.addEventListener('click', async () => {
            await this.uiManager.showScreen('stats-screen');
        });
        
        document.getElementById('switch-profile-btn')?.addEventListener('click', async () => {
            await this.uiManager.showScreen('profile-screen');
        });
        
        // Profile management buttons
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            this.uiManager.showEditProfileModal();
        });
        
        document.getElementById('delete-profile-btn')?.addEventListener('click', () => {
            this.uiManager.showDeleteProfileModal();
        });
        
        // Upgrade buttons
        document.getElementById('xp-bonus-btn')?.addEventListener('click', () => {
            this.gameState.purchaseUpgrade('xp_bonus', 50);
            this.uiManager.updateHomeRealmScreen();
        });
        
        document.getElementById('extra-draw-btn')?.addEventListener('click', () => {
            this.gameState.purchaseUpgrade('extra_draw', 100);
            this.uiManager.updateHomeRealmScreen();
        });
        
        document.getElementById('currency-boost-btn')?.addEventListener('click', () => {
            this.gameState.purchaseUpgrade('currency_boost', 100);
            this.uiManager.updateHomeRealmScreen();
        });
        
        // Inventory
        document.getElementById('inventory-btn')?.addEventListener('click', async () => {
            await this.uiManager.showScreen('inventory-screen');
        });
        
        document.getElementById('close-inventory-btn')?.addEventListener('click', async () => {
            await this.uiManager.showScreen('overworld-screen');
        });
        
        // Battle
        document.getElementById('flee-btn')?.addEventListener('click', () => {
            this.fleeBattle();
        });
        
        // Shop
        document.getElementById('shop-heal-btn')?.addEventListener('click', async () => {
            await this.purchaseHealing();
        });
        
        document.getElementById('shop-remove-card-btn')?.addEventListener('click', async () => {
            await this.purchaseCardRemoval();
        });
        
        document.getElementById('shop-continue-btn')?.addEventListener('click', async () => {
            await this.uiManager.showScreen('overworld-screen');
        });
        
        // Stats
        document.getElementById('close-stats-btn')?.addEventListener('click', async () => {
            await this.uiManager.showScreen('home-realm-screen');
        });
        
        // Modal events
        document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.uiManager.hideModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    async determineInitialScreen() {
        if (this.gameState.currentProfile) {
            if (this.gameState.currentRun) {
                await this.uiManager.showScreen('overworld-screen');
            } else {
                await this.uiManager.showScreen('home-realm-screen');
            }
        } else {
            await this.uiManager.showScreen('profile-screen');
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        if (loadingScreen && gameContainer) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                gameContainer.classList.remove('hidden');
            }, 500);
        }
    }
    
    async startBattle() {
        try {
            // Show loading state
            this.showMessage('Preparing for battle...', 'info');
            
            // Generate enemy based on current card
            const currentCard = this.gameState.currentRun.map[this.gameState.currentRun.playerPosition];
            const enemy = await this.battleLogic.generateEnemy(currentCard.card);
            
            // Initialize battle state
            this.currentBattle = {
                enemy: enemy,
                playerHand: [],
                enemyHand: [],
                playerTurn: true,
                selectedWeapon: this.gameState.currentRun.equipment.find(e => e.type === 'weapon') || this.battleLogic.getWeapons()[0],
                selectedArmor: this.gameState.currentRun.equipment.find(e => e.type === 'armor') || this.battleLogic.getArmors()[0],
                battleLog: [],
                round: 1
            };
            
            // Draw initial hands
            await this.battleLogic.drawBattleHands();
            
            // Update battle screen
            this.updateBattleScreen();
            await this.uiManager.showScreen('battle-screen');
            
        } catch (error) {
            console.error('Failed to start battle:', error);
            this.showMessage('Failed to start battle. Please try again.');
        }
    }
    
    updateBattleScreen() {
        if (!this.currentBattle) return;
        
        // Update enemy info
        const enemyName = document.getElementById('enemy-name');
        const enemyHealth = document.getElementById('enemy-health');
        const enemyStats = document.getElementById('enemy-stats');
        
        if (enemyName) enemyName.textContent = this.currentBattle.enemy.name;
        if (enemyHealth) enemyHealth.textContent = `Health: ${this.currentBattle.enemy.health}/${this.currentBattle.enemy.maxHealth}`;
        if (enemyStats) {
            enemyStats.innerHTML = `
                <div>Power: ${this.currentBattle.enemy.stats.power}</div>
                <div>Will: ${this.currentBattle.enemy.stats.will}</div>
                <div>Craft: ${this.currentBattle.enemy.stats.craft}</div>
                <div>Control: ${this.currentBattle.enemy.stats.control}</div>
            `;
        }
        
        // Update player info
        const playerHealth = document.getElementById('player-health');
        const playerStats = document.getElementById('player-stats');
        
        if (playerHealth) playerHealth.textContent = `Health: ${this.gameState.currentRun.health}/${this.gameState.currentRun.maxHealth}`;
        if (playerStats) {
            playerStats.innerHTML = `
                <div>Power: ${this.gameState.gameData.stats.power}</div>
                <div>Will: ${this.gameState.gameData.stats.will}</div>
                <div>Craft: ${this.gameState.gameData.stats.craft}</div>
                <div>Control: ${this.gameState.gameData.stats.control}</div>
            `;
        }
        
        // Update equipment
        const playerWeapon = document.getElementById('player-weapon');
        const playerArmor = document.getElementById('player-armor');
        
        if (playerWeapon) playerWeapon.textContent = `Weapon: ${this.currentBattle.selectedWeapon.name}`;
        if (playerArmor) playerArmor.textContent = `Armor: ${this.currentBattle.selectedArmor.name}`;
        
        // Update hands
        this.updatePlayerHand();
        this.updateEnemyHand();
        
        // Update battle log
        this.updateBattleLog();
        
        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (turnIndicator) {
            turnIndicator.textContent = this.currentBattle.playerTurn ? 'Your Turn' : 'Enemy Turn';
            turnIndicator.className = this.currentBattle.playerTurn ? 'player-turn' : 'enemy-turn';
        }
    }
    
    updatePlayerHand() {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        playerHand.innerHTML = '';
        
        this.currentBattle.playerHand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'battle-card';
            cardElement.innerHTML = `
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${this.deckManager.getSuitSymbol(card.suit)}</div>
            `;
            
            if (this.currentBattle.playerTurn) {
                cardElement.addEventListener('click', () => this.selectPlayerCard(index));
                cardElement.classList.add('selectable');
            }
            
            playerHand.appendChild(cardElement);
        });
    }
    
    updateEnemyHand() {
        const enemyHand = document.getElementById('enemy-hand');
        if (!enemyHand) return;
        
        enemyHand.innerHTML = '';
        
        this.currentBattle.enemyHand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'battle-card enemy-card';
            cardElement.innerHTML = `
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${this.deckManager.getSuitSymbol(card.suit)}</div>
            `;
            
            enemyHand.appendChild(cardElement);
        });
    }
    
    updateBattleLog() {
        const battleLog = document.getElementById('battle-log');
        if (!battleLog) return;
        
        battleLog.innerHTML = '';
        
        this.currentBattle.battleLog.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${log.type}`;
            logElement.textContent = log.message;
            battleLog.appendChild(logElement);
        });
        
        // Auto-scroll to bottom
        battleLog.scrollTop = battleLog.scrollHeight;
    }
    
    selectPlayerCard(cardIndex) {
        if (!this.currentBattle.playerTurn) return;
        
        const card = this.currentBattle.playerHand[cardIndex];
        this.performPlayerAttack(card, cardIndex);
    }
    
    performPlayerAttack(card, cardIndex) {
        // Check if weapon hit condition is met
        const hit = this.battleLogic.checkWeaponHit(this.currentBattle.selectedWeapon, card);
        
        if (hit) {
            // Handle special weapon effects first
            const specialEffect = this.battleLogic.handleWeaponSpecialEffect(this.currentBattle.selectedWeapon, card);
            
            if (specialEffect.type === 'heal') {
                // Staff healing effect
                this.gameState.currentRun.health = Math.min(this.gameState.currentRun.maxHealth, this.gameState.currentRun.health + specialEffect.amount);
                this.addBattleLog('player', `You heal ${specialEffect.amount} health with ${card.value} of ${card.suit}!`);
            } else {
                // Normal attack
                const damage = this.battleLogic.calculateDamage(this.gameState.gameData.stats.power, this.currentBattle.selectedWeapon, card);
                
                // Apply damage to enemy
                this.currentBattle.enemy.health = Math.max(0, this.currentBattle.enemy.health - damage);
                
                this.addBattleLog('player', `You attack with ${card.value} of ${card.suit} for ${damage} damage!`);
            }
        } else {
            this.addBattleLog('player', `You attack with ${card.value} of ${card.suit} but miss!`);
        }
        
        // Remove card from hand
        this.currentBattle.playerHand.splice(cardIndex, 1);
        
        // Check if enemy is defeated
        if (this.currentBattle.enemy.health <= 0) {
            this.endBattle(true);
            return;
        }
        
        // Switch to enemy turn
        this.currentBattle.playerTurn = false;
        this.updateBattleScreen();
        
        // Enemy turn after a short delay
        setTimeout(() => this.performEnemyTurn(), 1000);
    }
    
    async performEnemyTurn() {
        // Enemy craft mechanic: discard worst card if craft allows and card is under 8
        const craftMessage = this.battleLogic.performEnemyCraft();
        if (craftMessage) {
            this.addBattleLog('enemy', craftMessage);
        }
        
        // Enemy plays highest card
        const highestCardIndex = this.battleLogic.getHighestCardIndex(this.currentBattle.enemyHand);
        const card = this.currentBattle.enemyHand[highestCardIndex];
        
        // Check if enemy weapon hits
        const hit = this.battleLogic.checkWeaponHit(this.currentBattle.enemy.weapon, card);
        
        if (hit) {
            // Calculate enemy damage
            const damage = this.battleLogic.calculateDamage(this.currentBattle.enemy.stats.power, this.currentBattle.enemy.weapon, card);
            
            // Apply armor mitigation
            const finalDamage = this.battleLogic.applyArmorMitigation(damage, this.currentBattle.selectedArmor, card);
            
            // Apply damage to player
            this.gameState.currentRun.health = Math.max(0, this.gameState.currentRun.health - finalDamage);
            
            this.addBattleLog('enemy', `Enemy attacks with ${card.value} of ${card.suit} for ${finalDamage} damage!`);
        } else {
            this.addBattleLog('enemy', `Enemy attacks with ${card.value} of ${card.suit} but misses!`);
        }
        
        // Remove card from enemy hand
        this.currentBattle.enemyHand.splice(highestCardIndex, 1);
        
        // Check if player is defeated
        if (this.gameState.currentRun.health <= 0) {
            this.endBattle(false);
            return;
        }
        
        // Switch back to player turn
        this.currentBattle.playerTurn = true;
        this.currentBattle.round++;
        
        // Draw new hands
        await this.battleLogic.drawBattleHands();
        this.updateBattleScreen();
    }
    
    addBattleLog(type, message) {
        this.currentBattle.battleLog.push({
            type: type,
            message: message,
            round: this.currentBattle.round
        });
    }
    
    async endBattle(victory) {
        if (victory) {
            this.addBattleLog('system', 'Victory! Enemy defeated!');
            this.showSuccess('Victory! You defeated the enemy!');
            
            // Return player hand to deck
            this.battleLogic.returnPlayerHandToDeck();
            
            // Check if this was a boss battle
            if (this.currentBattle && this.currentBattle.isBossBattle) {
                await this.handleBossVictory();
            } else {
                // Regular enemy victory - draw a boon
                setTimeout(async () => {
                    this.showMessage('Drawing your reward...', 'info');
                    await this.eventHandler.drawBoon();
                }, 2000);
            }
        } else {
            this.addBattleLog('system', 'Defeat! You have been defeated!');
            this.showError('Defeat! You have been defeated!');
            
            // Return player hand to deck even on defeat
            this.battleLogic.returnPlayerHandToDeck();
            
            // Game over - return to home realm
            setTimeout(() => {
                this.gameState.abandonRun();
                this.uiManager.showScreen('home-realm-screen');
            }, 2000);
        }
        
        this.currentBattle = null;
        this.gameState.saveGameData();
    }
    
    async handleBossVictory() {
        try {
            const boss = this.currentBattle.boss;
            const bossSystem = this.currentBattle.bossSystem;
            
            const result = await bossSystem.handleBossVictory(boss);
            
            // Show victory message
            this.showSuccess(result.message);
            
            if (result.gameCompleted) {
                // Game completed - show completion screen
                setTimeout(async () => {
                    await this.showGameCompletion(result);
                }, 2000);
            } else {
                // Advanced to next realm - show realm transition
                setTimeout(async () => {
                    this.showSuccess(`Welcome to Realm ${this.gameState.currentRun.realm}!`);
                    await this.uiManager.showScreen('overworld-screen');
                }, 2000);
            }
            
        } catch (error) {
            console.error('Failed to handle boss victory:', error);
            this.showMessage('Failed to process boss victory. Please try again.');
        }
    }
    
    async showGameCompletion(result) {
        const completionMessage = `
            🎉 GAME COMPLETED! 🎉
            
            You have successfully completed your journey through the cursed realm!
            
            Final Rewards:
            - Power XP: ${result.xp.power}
            - Will XP: ${result.xp.will}
            - Craft XP: ${result.xp.craft}
            - Control XP: ${result.xp.control}
            - Currency: ${result.currency}
            
            Congratulations on your victory!
        `;
        
        this.showSuccess(completionMessage);
        
        // Return to home realm after a delay
        setTimeout(async () => {
            this.gameState.abandonRun();
            await this.uiManager.showScreen('home-realm-screen');
        }, 5000);
    }
    
    fleeBattle() {
        if (!this.currentBattle) return;
        
        this.addBattleLog('system', 'You flee from the battle!');
        this.showWarning('You have fled from the battle!');
        
        // Return player hand to deck
        this.battleLogic.returnPlayerHandToDeck();
        
        // Clear battle state
        this.currentBattle = null;
        
        // Return to overworld
        setTimeout(() => {
            this.uiManager.showScreen('overworld-screen');
        }, 1000);
        
        this.gameState.saveGameData();
    }
    
    async startStatChallenge() {
        try {
            // Calculate challenge difficulty
            const { getRealms } = await import('./equipmentData.js');
            const realm = getRealms().find(r => r.id === this.gameState.currentRun.realm);
            const challengeModifier = this.gameState.currentRun.level + (realm ? realm.difficultyModifier : 0);
            const difficulty = 12 + challengeModifier;
            
            // Draw a card for the challenge
            const cards = await this.deckManager.drawCards(1);
            const challengeCard = cards[0];
            const cardValue = this.deckManager.getCardValue(challengeCard.value);
            
            // Determine which stat to challenge
            const stats = ['power', 'will', 'craft', 'control'];
            const challengeStat = stats[Math.floor(Math.random() * stats.length)];
            const statValue = this.gameState.gameData.stats[challengeStat];
            
            // Calculate total (stat + card value)
            const total = statValue + cardValue;
            const success = total >= difficulty || challengeCard.value === 'ACE';
            
            // Apply results
            if (success) {
                // Success: gain XP and draw a boon
                const xpGain = cardValue;
                this.gameState.gainXP(challengeStat, xpGain);
                
                const message = `Stat Challenge: ${challengeStat.toUpperCase()}\n\n` +
                              `Card: ${challengeCard.value} of ${challengeCard.suit} (${cardValue})\n` +
                              `Stat: ${statValue}\n` +
                              `Total: ${total} vs ${difficulty}\n\n` +
                              `SUCCESS!\n\n` +
                              `Gained ${xpGain} XP in ${challengeStat}\n` +
                              `Drawing a boon...`;
                
                this.showSuccess(message);
                
                // Draw a boon after a short delay
                setTimeout(async () => {
                    await this.eventHandler.drawBoon();
                }, 2000);
                
            } else {
                // Failure: draw a bane
                const message = `Stat Challenge: ${challengeStat.toUpperCase()}\n\n` +
                              `Card: ${challengeCard.value} of ${challengeCard.suit} (${cardValue})\n` +
                              `Stat: ${statValue}\n` +
                              `Total: ${total} vs ${difficulty}\n\n` +
                              `FAILURE!\n\n` +
                              `Drawing a bane...`;
                
                this.showError(message);
                
                // Draw a bane after a short delay
                setTimeout(async () => {
                    await this.eventHandler.drawBane();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Failed to start stat challenge:', error);
            this.showMessage('Failed to start stat challenge. Please try again.');
        }
    }
    
    async showShop() {
        try {
            const { shopData, shopItems } = await this.shopSystem.showShop();
            
            // Update shop screen
            this.updateShopScreen(shopData, shopItems);
            await this.uiManager.showScreen('shop-screen');
            
        } catch (error) {
            console.error('Failed to show shop:', error);
            this.showMessage('Failed to open shop. Please try again.');
        }
    }
    
    updateShopScreen(shopData, shopItems) {
        // Update shop info
        const shopInfo = this.shopSystem.getShopInfo();
        const shopGold = document.getElementById('shop-gold');
        const shopHealth = document.getElementById('shop-health');
        
        if (shopGold) shopGold.textContent = `Gold: ${shopInfo.gold}`;
        if (shopHealth) shopHealth.textContent = `Health: ${shopInfo.health}`;
        
        // Update shop items
        const shopItemsContainer = document.getElementById('shop-items');
        if (shopItemsContainer) {
            shopItemsContainer.innerHTML = '';
            
            shopItems.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.className = 'shop-item';
                itemElement.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="price">${item.cost} Gold</div>
                    <button class="btn btn-secondary" onclick="game.purchaseShopItem(${index})">Purchase</button>
                `;
                shopItemsContainer.appendChild(itemElement);
            });
        }
    }
    
    async purchaseHealing() {
        try {
            const { healAmount, healCost } = await this.shopSystem.purchaseHealing();
            this.showSuccess(`Healed ${healAmount} health for ${healCost} gold!`);
            
            // Update shop display
            const shopInfo = this.shopSystem.getShopInfo();
            const shopGold = document.getElementById('shop-gold');
            const shopHealth = document.getElementById('shop-health');
            
            if (shopGold) shopGold.textContent = `Gold: ${shopInfo.gold}`;
            if (shopHealth) shopHealth.textContent = `Health: ${shopInfo.health}`;
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    async purchaseCardRemoval() {
        try {
            const { removedCard, removalCost } = await this.shopSystem.purchaseCardRemoval();
            this.showSuccess(`Removed ${removedCard.value} of ${removedCard.suit} for ${removalCost} gold!`);
            
            // Update shop display
            const shopInfo = this.shopSystem.getShopInfo();
            const shopGold = document.getElementById('shop-gold');
            if (shopGold) shopGold.textContent = `Gold: ${shopInfo.gold}`;
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    async startNewRun() {
        // Abandon old run if exists
        this.gameState.abandonRun();
        
        // Create new run
        const { getWeapons, getArmors } = await import('./modules/equipmentData.js');
        this.gameState.currentRun = {
            id: this.gameState.generateRunId(),
            startTime: Date.now(),
            level: 1,
            realm: this.gameState.gameData.selectedRealm,
            health: this.gameState.calculateMaxHealth(),
            maxHealth: this.gameState.calculateMaxHealth(),
            deck: await this.deckManager.generateStartingDeck(),
            equipment: [
                getWeapons().find(w => w.id === this.gameState.gameData.selectedWeapon),
                getArmors().find(a => a.id === this.gameState.gameData.selectedArmor)
            ],
            map: null,
            playerPosition: -1,
            artifacts: []
        };
        
        this.gameState.saveGameData();
        await this.uiManager.showScreen('overworld-screen');
    }
    
    async resumeRun() {
        if (this.gameState.currentRun) {
            await this.uiManager.showScreen('overworld-screen');
        }
    }
    
    handleKeyboardShortcuts(e) {
        // ESC to close modals
        if (e.key === 'Escape') {
            this.uiManager.hideModal();
        }
        
        // Performance tracking
        this.performanceMetrics.lastActionTime = performance.now();
    }
    
    // Performance monitoring
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    }
    
    // Debounced function for frequent operations
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    showMessage(message, type = 'info') {
        // Enhanced message display with different types
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create a proper message UI instead of alert
        const messageContainer = document.getElementById('message-container') || this.createMessageContainer();
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <span class="message-text">${message.replace(/\n/g, '<br>')}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        messageContainer.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showWarning(message) {
        this.showMessage(message, 'warning');
    }
    
    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'message-container';
        container.className = 'message-container';
        document.body.appendChild(container);
        return container;
    }
    
    // Profile management methods
    hideModal() {
        this.uiManager.hideModal();
    }
    
    confirmDeleteProfile() {
        this.uiManager.confirmDeleteProfile();
    }
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new DeckriftGame();
}); 