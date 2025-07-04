// Game State Management Module
export class GameState {
    constructor() {
        this.gameData = {
            profiles: [],
            activeProfileId: null,
            currency: 0,
            stats: {
                power: 4,
                will: 4,
                craft: 4,
                control: 4
            },
            statXP: {
                power: 0,
                will: 0,
                craft: 0,
                control: 0
            },
            upgrades: [],
            selectedWeapon: 'sword',
            selectedArmor: 'light',
            selectedRealm: 1
        };
        
        this.currentProfile = null;
        this.currentRun = null;
        this.currentScreen = null;
    }
    
    loadGameData() {
        try {
            const savedData = localStorage.getItem('deckrift_game_data');
            if (savedData) {
                this.gameData = { ...this.gameData, ...JSON.parse(savedData) };
            }
            
            // Load current profile
            if (this.gameData.activeProfileId) {
                this.currentProfile = this.gameData.profiles.find(p => p.id === this.gameData.activeProfileId);
            }
            
            // Load current run from session storage
            const savedRun = sessionStorage.getItem('deckrift_current_run');
            if (savedRun) {
                this.currentRun = JSON.parse(savedRun);
            }
            
        } catch (error) {
            console.error('Failed to load game data:', error);
            this.resetGameData();
        }
    }
    
    saveGameData() {
        try {
            localStorage.setItem('deckrift_game_data', JSON.stringify(this.gameData));
            
            if (this.currentRun) {
                sessionStorage.setItem('deckrift_current_run', JSON.stringify(this.currentRun));
            }
        } catch (error) {
            console.error('Failed to save game data:', error);
        }
    }
    
    resetGameData() {
        this.gameData = {
            profiles: [],
            activeProfileId: null,
            currency: 0,
            stats: {
                power: 4,
                will: 4,
                craft: 4,
                control: 4
            },
            statXP: {
                power: 0,
                will: 0,
                craft: 0,
                control: 0
            },
            upgrades: [],
            selectedWeapon: 'sword',
            selectedArmor: 'light',
            selectedRealm: 1
        };
        
        this.currentProfile = null;
        this.currentRun = null;
    }
    
    generateProfileId() {
        return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateRunId() {
        return 'run_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    calculateLevel(xp) {
        return Math.floor(xp / 40) + 1;
    }
    
    calculateXPForLevel(level) {
        return (level - 1) * 40;
    }
    
    calculateMaxHealth() {
        return this.gameData.stats.will * 10;
    }
    
    hasUpgrade(upgradeId) {
        return this.gameData.upgrades.includes(upgradeId);
    }
    
    addUpgrade(upgradeId) {
        if (!this.hasUpgrade(upgradeId)) {
            this.gameData.upgrades.push(upgradeId);
            this.saveGameData();
        }
    }
    
    getCurrencyMultiplier() {
        return this.hasUpgrade('currency_boost') ? 1.25 : 1;
    }
    
    getXPBonus() {
        return this.hasUpgrade('xp_bonus') ? 1 : 0;
    }
    
    getExtraDraws() {
        const extraDraws = {};
        ['power', 'will', 'craft', 'control'].forEach(stat => {
            extraDraws[stat] = this.hasUpgrade(`extra_draw_${stat}`) ? 1 : 0;
        });
        return extraDraws;
    }
    
    gainStat(statName, amount = 1) {
        if (this.gameData.stats[statName] !== undefined) {
            this.gameData.stats[statName] += amount;
            
            // Apply XP bonus if upgrade is purchased
            const xpBonus = this.getXPBonus();
            if (xpBonus > 0) {
                this.gainXP(statName, xpBonus);
            }
            
            this.saveGameData();
        }
    }
    
    gainXP(statName, amount = 1) {
        if (this.gameData.statXP[statName] !== undefined) {
            this.gameData.statXP[statName] += amount;
            this.saveGameData();
        }
    }
    
    gainCurrency(amount) {
        const multiplier = this.getCurrencyMultiplier();
        const finalAmount = Math.floor(amount * multiplier);
        this.gameData.currency += finalAmount;
        this.saveGameData();
        return finalAmount;
    }
    
    purchaseUpgrade(upgradeId, cost) {
        if (this.gameData.currency >= cost && !this.hasUpgrade(upgradeId)) {
            this.gameData.currency -= cost;
            this.addUpgrade(upgradeId);
            return true;
        }
        return false;
    }
    
    abandonRun() {
        if (!this.currentRun) return;
        
        this.currentRun = null;
        sessionStorage.removeItem('deckrift_current_run');
    }
} 