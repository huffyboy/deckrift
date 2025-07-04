// UI Manager Module
export class UIManager {
    constructor(gameState, deckManager) {
        this.gameState = gameState;
        this.deckManager = deckManager;
        this.currentScreen = null;
    }
    
    async showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            await this.updateScreenContent(screenId);
        }
    }
    
    async updateScreenContent(screenId) {
        switch (screenId) {
            case 'profile-screen':
                this.updateProfileScreen();
                break;
            case 'home-realm-screen':
                this.updateHomeRealmScreen();
                break;
            case 'overworld-screen':
                await this.updateOverworldScreen();
                break;
            case 'stats-screen':
                this.updateStatsScreen();
                break;
            case 'inventory-screen':
                this.updateInventoryScreen();
                break;
        }
    }
    
    updateProfileScreen() {
        const profileList = document.getElementById('profile-list');
        if (!profileList) return;
        
        profileList.innerHTML = '';
        
        // Create profile cards for 10 slots
        for (let i = 0; i < 10; i++) {
            const profile = this.gameState.gameData.profiles[i];
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';
            
            if (profile) {
                profileCard.innerHTML = `
                    <div class="profile-name">${profile.name}</div>
                    <div class="profile-stats">
                        Runs: ${profile.totalRuns || 0} | Best: ${profile.bestScore || 0}
                    </div>
                `;
                profileCard.addEventListener('click', () => {
                    this.gameState.currentProfile = profile;
                    this.gameState.gameData.activeProfileId = profile.id;
                    this.gameState.saveGameData();
                    this.showScreen('home-realm-screen');
                });
            } else {
                profileCard.className = 'profile-card empty';
                profileCard.textContent = 'Empty Slot';
                profileCard.addEventListener('click', () => {
                    this.showCreateProfileModal(i);
                });
            }
            
            profileList.appendChild(profileCard);
        }
    }
    
    updateHomeRealmScreen() {
        if (!this.gameState.currentProfile) return;
        
        // Update profile name
        const profileName = document.getElementById('current-profile-name');
        if (profileName) {
            profileName.textContent = this.gameState.currentProfile.name;
        }
        
        // Update currency
        const currentCurrency = document.getElementById('current-currency');
        if (currentCurrency) {
            currentCurrency.textContent = this.gameState.gameData.currency;
        }
        
        // Update basic stats
        const totalRuns = document.getElementById('total-runs');
        const bestScore = document.getElementById('best-score');
        
        if (totalRuns) totalRuns.textContent = this.gameState.currentProfile.totalRuns || 0;
        if (bestScore) bestScore.textContent = this.gameState.currentProfile.bestScore || 0;
        
        // Update character stats
        this.updateCharacterStats();
        
        // Update upgrades
        this.updateUpgradesDisplay();
        
        // Update equipment selection
        this.updateEquipmentSelection();
        
        // Update realm selection
        this.updateRealmSelection();
        
        // Show/hide resume button
        const resumeBtn = document.getElementById('resume-run-btn');
        if (resumeBtn) {
            if (this.gameState.currentRun) {
                resumeBtn.classList.remove('hidden');
            } else {
                resumeBtn.classList.add('hidden');
            }
        }
    }
    
    updateCharacterStats() {
        const stats = ['power', 'will', 'craft', 'control'];
        
        stats.forEach(stat => {
            const statElement = document.getElementById(`${stat}-stat`);
            const levelElement = document.getElementById(`${stat}-level`);
            const xpElement = document.getElementById(`${stat}-xp`);
            
            if (statElement) {
                statElement.textContent = this.gameState.gameData.stats[stat];
            }
            
            if (levelElement) {
                const level = this.gameState.calculateLevel(this.gameState.gameData.statXP[stat]);
                levelElement.textContent = `(Level ${level})`;
            }
            
            if (xpElement) {
                const currentXP = this.gameState.gameData.statXP[stat];
                const level = this.gameState.calculateLevel(currentXP);
                const xpForLevel = this.gameState.calculateXPForLevel(level);
                const xpInLevel = currentXP - xpForLevel;
                xpElement.textContent = `(${xpInLevel}/40 XP)`;
            }
        });
    }
    
    updateUpgradesDisplay() {
        const upgrades = [
            { id: 'xp_bonus', buttonId: 'xp-bonus-btn', cost: 50 },
            { id: 'extra_draw', buttonId: 'extra-draw-btn', cost: 100 },
            { id: 'currency_boost', buttonId: 'currency-boost-btn', cost: 100 }
        ];
        
        upgrades.forEach(upgrade => {
            const button = document.getElementById(upgrade.buttonId);
            if (button) {
                if (this.gameState.hasUpgrade(upgrade.id)) {
                    button.textContent = 'Purchased';
                    button.disabled = true;
                } else {
                    button.textContent = `Purchase (${upgrade.cost} Currency)`;
                    button.disabled = this.gameState.gameData.currency < upgrade.cost;
                }
            }
        });
    }
    
    async updateEquipmentSelection() {
        // Update weapon selection
        const weaponSelection = document.getElementById('weapon-selection');
        if (weaponSelection) {
            weaponSelection.innerHTML = '';
            
            // Import equipment data
            const { getWeapons } = await import('./equipmentData.js');
            getWeapons().forEach(weapon => {
                const weaponElement = document.createElement('div');
                weaponElement.className = 'equipment-option';
                if (this.gameState.gameData.selectedWeapon === weapon.id) {
                    weaponElement.classList.add('selected');
                }
                
                weaponElement.innerHTML = `
                    <h4>${weapon.name}</h4>
                    <p>${weapon.description}</p>
                `;
                
                weaponElement.addEventListener('click', () => {
                    this.gameState.gameData.selectedWeapon = weapon.id;
                    this.gameState.saveGameData();
                    this.updateEquipmentSelection();
                });
                
                weaponSelection.appendChild(weaponElement);
            });
        }
        
        // Update armor selection
        const armorSelection = document.getElementById('armor-selection');
        if (armorSelection) {
            armorSelection.innerHTML = '';
            
            const { getArmors } = await import('./equipmentData.js');
            getArmors().forEach(armor => {
                const armorElement = document.createElement('div');
                armorElement.className = 'equipment-option';
                if (this.gameState.gameData.selectedArmor === armor.id) {
                    armorElement.classList.add('selected');
                }
                
                armorElement.innerHTML = `
                    <h4>${armor.name}</h4>
                    <p>${armor.description}</p>
                `;
                
                armorElement.addEventListener('click', () => {
                    this.gameState.gameData.selectedArmor = armor.id;
                    this.gameState.saveGameData();
                    this.updateEquipmentSelection();
                });
                
                armorSelection.appendChild(armorElement);
            });
        }
    }
    
    async updateRealmSelection() {
        const realmOptions = document.getElementById('realm-options');
        if (!realmOptions) return;
        
        realmOptions.innerHTML = '';
        
        const { getRealms } = await import('./gameData.js');
        getRealms().forEach(realm => {
            const realmElement = document.createElement('div');
            realmElement.className = 'realm-option';
            if (this.gameState.gameData.selectedRealm === realm.id) {
                realmElement.classList.add('selected');
            }
            
            realmElement.innerHTML = `
                <h4>${realm.name}</h4>
                <p>${realm.description}</p>
                <span class="difficulty">Difficulty: +${realm.difficultyModifier}</span>
            `;
            
            realmElement.addEventListener('click', () => {
                this.gameState.gameData.selectedRealm = realm.id;
                this.gameState.saveGameData();
                this.updateRealmSelection();
            });
            
            realmOptions.appendChild(realmElement);
        });
    }
    
    async updateOverworldScreen() {
        if (!this.gameState.currentRun) return;
        
        // Update run info
        const runLevel = document.getElementById('run-level');
        const runHealth = document.getElementById('run-health');
        
        if (runLevel) runLevel.textContent = `Level ${this.gameState.currentRun.level}`;
        if (runHealth) runHealth.textContent = `Health: ${this.gameState.currentRun.health}`;
        
        // Generate map if needed
        if (!this.gameState.currentRun.map) {
            await this.generateOverworldMap();
        }
        
        // Render map
        this.renderOverworldMap();
    }
    
    updateStatsScreen() {
        if (!this.gameState.currentProfile) return;
        
        // Update lifetime stats
        const lifetimeRuns = document.getElementById('lifetime-runs');
        const lifetimeBest = document.getElementById('lifetime-best');
        const totalPlaytime = document.getElementById('total-playtime');
        
        if (lifetimeRuns) lifetimeRuns.textContent = this.gameState.currentProfile.totalRuns || 0;
        if (lifetimeBest) lifetimeBest.textContent = this.gameState.currentProfile.bestScore || 0;
        if (totalPlaytime) totalPlaytime.textContent = this.formatPlaytime(this.gameState.currentProfile.totalPlaytime || 0);
    }
    
    updateInventoryScreen() {
        if (!this.gameState.currentRun) return;
        
        // Update current deck
        this.updateDeckDisplay();
        
        // Update equipment display
        this.updateEquipmentDisplay();
        
        // Update artifacts display
        this.updateArtifactsDisplay();
    }
    
    updateDeckDisplay() {
        const deckDisplay = document.getElementById('current-deck');
        if (!deckDisplay) return;
        
        if (!this.gameState.currentRun.deck || this.gameState.currentRun.deck.length === 0) {
            deckDisplay.innerHTML = '<p>No cards in deck</p>';
            return;
        }
        
        // Get deck statistics
        const deckStats = this.deckManager.getDeckStats(this.gameState.currentRun.deck);
        
        deckDisplay.innerHTML = `
            <div class="deck-info">
                <div class="deck-stats">
                    <span class="deck-size">Deck Size: ${deckStats.total}</span>
                    <div class="deck-breakdown">
                        <span>Hearts: ${deckStats.suits.HEARTS || 0}</span>
                        <span>Diamonds: ${deckStats.suits.DIAMONDS || 0}</span>
                        <span>Clubs: ${deckStats.suits.CLUBS || 0}</span>
                        <span>Spades: ${deckStats.suits.SPADES || 0}</span>
                        <span>Jokers: ${deckStats.values.JOKER || 0}</span>
                    </div>
                </div>
            </div>
            <div class="deck-cards">
                ${this.gameState.currentRun.deck.slice(0, 12).map(card => `
                    <div class="deck-card ${card.value === 'JOKER' ? 'joker-card' : ''}">
                        <span class="card-value">${card.value}</span>
                        ${card.value !== 'JOKER' ? `<span class="card-suit" style="color: ${(card.suit === 'HEARTS' || card.suit === 'DIAMONDS') ? '#DC143C' : '#1E1E1E'}">${this.deckManager.getSuitSymbol(card.suit)}</span>` : ''}
                    </div>
                `).join('')}
                ${this.gameState.currentRun.deck.length > 12 ? `<div class="deck-more">+${this.gameState.currentRun.deck.length - 12} more</div>` : ''}
            </div>
        `;
    }
    
    updateEquipmentDisplay() {
        const equipmentDisplay = document.getElementById('equipment-display');
        if (!equipmentDisplay) return;
        
        if (!this.gameState.currentRun.equipment || this.gameState.currentRun.equipment.length === 0) {
            equipmentDisplay.innerHTML = '<p>No equipment</p>';
            return;
        }
        
        equipmentDisplay.innerHTML = this.gameState.currentRun.equipment.map(item => `
            <div class="equipment-item">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <span class="equipment-type">${item.type || 'Equipment'}</span>
            </div>
        `).join('');
    }
    
    updateArtifactsDisplay() {
        const artifactsDisplay = document.getElementById('artifacts-display');
        if (!artifactsDisplay) return;
        
        if (!this.gameState.currentRun.artifacts || this.gameState.currentRun.artifacts.length === 0) {
            artifactsDisplay.innerHTML = '<p>No artifacts</p>';
            return;
        }
        
        artifactsDisplay.innerHTML = this.gameState.currentRun.artifacts.map(artifact => `
            <div class="artifact-item ${artifact.rarity}">
                <h4>${artifact.name}</h4>
                <p>${artifact.description}</p>
                <span class="artifact-rarity">${artifact.rarity}</span>
            </div>
        `).join('');
    }
    
    async generateOverworldMap() {
        const { getRealms } = await import('./gameData.js');
        const realm = getRealms().find(r => r.id === this.gameState.gameData.selectedRealm);
        const challengeModifier = this.gameState.currentRun.level + (realm ? realm.difficultyModifier : 0);
        const cardCount = 5 + challengeModifier;
        
        // Generate map cards
        const mapCards = await this.deckManager.generateMapCards(cardCount);
        
        // Add joker at the end
        mapCards.push({
            card: { value: 'JOKER', suit: 'JOKER', code: 'JOKER' },
            type: 'joker',
            revealed: false
        });
        
        this.gameState.currentRun.map = mapCards;
        this.gameState.currentRun.playerPosition = -1; // Start off-map
        this.gameState.saveGameData();
    }
    
    renderOverworldMap() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer || !this.gameState.currentRun.map) return;
        
        mapContainer.innerHTML = '';
        
        this.gameState.currentRun.map.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'map-card';
            
            if (index === this.gameState.currentRun.playerPosition) {
                cardElement.classList.add('player-position');
            }
            
            if (card.revealed) {
                // Show actual card information
                if (card.card && card.card.value !== 'JOKER') {
                    const suitSymbol = this.deckManager.getSuitSymbol(card.card.suit);
                    const isRedSuit = card.card.suit === 'HEARTS' || card.card.suit === 'DIAMONDS';
                    cardElement.innerHTML = `
                        <div class="card-value">${card.card.value}</div>
                        <div class="card-suit" data-suit="${card.card.suit}" style="color: ${isRedSuit ? '#DC143C' : '#1E1E1E'}">${suitSymbol}</div>
                        <div class="card-type">${card.type.toUpperCase()}</div>
                    `;
                } else {
                    cardElement.innerHTML = `
                        <div class="card-value">JOKER</div>
                        <div class="card-type">BOSS/EXIT</div>
                    `;
                }
                cardElement.classList.add('revealed');
            } else {
                cardElement.innerHTML = `
                    <div class="card-back">?</div>
                `;
                cardElement.addEventListener('click', async () => {
                    await this.moveToCard(index);
                });
            }
            
            mapContainer.appendChild(cardElement);
        });
    }
    
    async moveToCard(index) {
        if (!this.gameState.currentRun || !this.gameState.currentRun.map) return;
        
        // Check if adjacent
        const currentPos = this.gameState.currentRun.playerPosition;
        if (Math.abs(index - currentPos) > 1 && currentPos !== -1) return;
        
        // Reveal card
        this.gameState.currentRun.map[index].revealed = true;
        this.gameState.currentRun.playerPosition = index;
        
        // Handle card effect
        await this.handleMapCard(this.gameState.currentRun.map[index]);
        
        this.gameState.saveGameData();
        this.renderOverworldMap();
    }
    
    async handleMapCard(card) {
        const { EventHandler } = await import('./eventHandler.js');
        const eventHandler = new EventHandler(this.gameState, this.deckManager);
        
        switch (card.type) {
            case 'bane':
                await eventHandler.drawBane();
                break;
            case 'enemy':
                await this.startBattle();
                break;
            case 'challenge':
                await this.startStatChallenge();
                break;
            case 'nothing':
                // Do nothing
                break;
            case 'rest':
                const restMessage = eventHandler.rest();
                this.showMessage(restMessage);
                break;
            case 'shop':
                await this.showShop();
                break;
            case 'boon':
                await eventHandler.drawBoon();
                break;
            case 'joker':
                await this.handleJoker();
                break;
        }
    }
    
    showCreateProfileModal(slotIndex = null) {
        const modalContent = `
            <h2>Create New Profile</h2>
            <form id="create-profile-form">
                <div class="form-group">
                    <label for="profile-name" class="form-label">Profile Name</label>
                    <input type="text" id="profile-name" class="form-input" maxlength="20" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Create Profile</button>
                    <button type="button" class="btn btn-secondary" onclick="game.hideModal()">Cancel</button>
                </div>
            </form>
        `;
        
        this.showModal(modalContent);
        
        // Handle form submission
        document.getElementById('create-profile-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('profile-name').value.trim();
            
            if (name) {
                this.createProfile(name, slotIndex);
                this.hideModal();
                this.updateProfileScreen();
            }
        });
    }
    
    showEditProfileModal() {
        if (!this.gameState.currentProfile) {
            this.showMessage('No profile selected');
            return;
        }
        
        const modalContent = `
            <h2>Edit Profile</h2>
            <form id="edit-profile-form">
                <div class="form-group">
                    <label for="edit-profile-name" class="form-label">Profile Name</label>
                    <input type="text" id="edit-profile-name" class="form-input" maxlength="20" value="${this.gameState.currentProfile.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-profile-bio" class="form-label">Bio (Optional)</label>
                    <textarea id="edit-profile-bio" class="form-input" maxlength="100" rows="3">${this.gameState.currentProfile.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-profile-avatar" class="form-label">Avatar URL (Optional)</label>
                    <input type="url" id="edit-profile-avatar" class="form-input" value="${this.gameState.currentProfile.avatarUrl || ''}">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn btn-secondary" onclick="game.hideModal()">Cancel</button>
                </div>
            </form>
        `;
        
        this.showModal(modalContent);
        
        // Handle form submission
        document.getElementById('edit-profile-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-profile-name').value.trim();
            const bio = document.getElementById('edit-profile-bio').value.trim();
            const avatarUrl = document.getElementById('edit-profile-avatar').value.trim();
            
            if (name) {
                this.editProfile(name, bio, avatarUrl);
                this.hideModal();
                this.updateProfileScreen();
                this.updateHomeRealmScreen();
            }
        });
    }
    
    showDeleteProfileModal() {
        if (!this.gameState.currentProfile) {
            this.showMessage('No profile selected');
            return;
        }
        
        const modalContent = `
            <h2>Delete Profile</h2>
            <p>Are you sure you want to delete the profile "${this.gameState.currentProfile.name}"?</p>
            <p><strong>This action cannot be undone!</strong></p>
            <div class="form-group">
                <button type="button" class="btn btn-danger" onclick="game.confirmDeleteProfile()">Delete Profile</button>
                <button type="button" class="btn btn-secondary" onclick="game.hideModal()">Cancel</button>
            </div>
        `;
        
        this.showModal(modalContent);
    }
    
    createProfile(name, slotIndex) {
        const newProfile = this.profileManager.createProfile(name, slotIndex);
        this.gameState.selectProfile(newProfile.id);
        this.updateProfileScreen();
        this.updateHomeRealmScreen();
    }
    
    editProfile(name, bio, avatarUrl) {
        if (!this.gameState.currentProfile) return;
        
        this.gameState.currentProfile.name = name;
        this.gameState.currentProfile.bio = bio;
        this.gameState.currentProfile.avatarUrl = avatarUrl;
        this.gameState.saveGameData();
        
        this.showMessage('Profile updated successfully!');
    }
    
    confirmDeleteProfile() {
        if (!this.gameState.currentProfile) return;
        
        const success = this.profileManager.deleteProfile(this.gameState.currentProfile.id);
        if (success) {
            this.hideModal();
            this.showMessage('Profile deleted successfully!');
            this.updateProfileScreen();
            this.updateHomeRealmScreen();
        } else {
            this.showMessage('Failed to delete profile');
        }
    }
    
    showModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        
        if (modalOverlay && modalContent) {
            modalContent.innerHTML = content;
            modalOverlay.classList.remove('hidden');
        }
    }
    
    hideModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    }
    
    showMessage(message) {
        // Simple message display - could be enhanced with a proper UI
        console.log(message);
        alert(message);
    }
    
    formatPlaytime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
    
    async handleJoker() {
        try {
            // Check if this is a boss encounter (joker at the end of the map)
            const isLastCard = this.gameState.currentRun.playerPosition === this.gameState.currentRun.map.length - 1;
            
            if (isLastCard) {
                // This is a boss encounter
                await this.startBossBattle();
            } else {
                // This is an exit (early joker)
                this.showMessage('You found an early exit! Your journey ends here.');
                // TODO: Handle early exit logic
            }
        } catch (error) {
            console.error('Failed to handle joker:', error);
            this.showMessage('Failed to handle joker encounter. Please try again.');
        }
    }
    
    async startBossBattle() {
        try {
            // Import boss system
            const { BossSystem } = await import('./bossSystem.js');
            const bossSystem = new BossSystem(this.gameState, this.deckManager);
            
            // Get boss for current realm
            const boss = bossSystem.getBossForRealm(this.gameState.currentRun.realm);
            if (!boss) {
                throw new Error('No boss found for current realm');
            }
            
            // Show boss description
            const bossDescription = bossSystem.getBossDescription(boss);
            this.showMessage(bossDescription);
            
            // Start boss battle after a short delay
            setTimeout(async () => {
                const bossEnemy = await bossSystem.startBossBattle();
                
                // Initialize boss battle state
                this.gameState.currentBattle = {
                    enemy: bossEnemy,
                    playerHand: [],
                    enemyHand: [],
                    playerTurn: true,
                    selectedWeapon: this.gameState.currentRun.equipment.find(e => e.type === 'weapon') || this.battleLogic.getWeapons()[0],
                    selectedArmor: this.gameState.currentRun.equipment.find(e => e.type === 'armor') || this.battleLogic.getArmors()[0],
                    battleLog: [],
                    round: 1,
                    isBossBattle: true,
                    bossSystem: bossSystem,
                    boss: boss
                };
                
                // Draw initial hands
                const { BattleLogic } = await import('./battleLogic.js');
                const battleLogic = new BattleLogic(this.gameState, this.deckManager);
                await battleLogic.drawBattleHands();
                
                // Update battle screen and show it
                this.updateBattleScreen();
                await this.showScreen('battle-screen');
                
            }, 2000);
            
        } catch (error) {
            console.error('Failed to start boss battle:', error);
            this.showMessage('Failed to start boss battle. Please try again.');
        }
    }
} 