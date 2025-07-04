// Artifact System Module
export class ArtifactSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }
    
    async getArtifacts() {
        const { getArtifacts } = await import('./equipmentData.js');
        return getArtifacts();
    }
    
    async addArtifact(artifactId) {
        if (!this.gameState.currentRun.artifacts) {
            this.gameState.currentRun.artifacts = [];
        }
        
        const artifacts = await this.getArtifacts();
        const artifact = artifacts.find(a => a.id === artifactId);
        if (artifact) {
            this.gameState.currentRun.artifacts.push(artifact);
            await this.applyArtifactEffect(artifact);
            this.gameState.saveGameData();
            return artifact;
        }
        return null;
    }
    
    async applyArtifactEffect(artifact) {
        const { getWeapons, getArmors } = await import('./equipmentData.js');
        
        switch (artifact.effect) {
            case 'add_ace_to_deck':
                // Add Ace to deck (placeholder for now)
                this.gameState.currentRun.deck.push({
                    value: 'ACE',
                    suit: 'HEARTS',
                    code: 'AH'
                });
                break;
                
            case 'stat_boost':
                // Boost a random stat
                const stats = ['power', 'will', 'craft', 'control'];
                const randomStat = stats[Math.floor(Math.random() * stats.length)];
                this.gameState.gainStat(randomStat, artifact.value);
                break;
                
            case 'gain_weapon':
                // Add weapon to equipment
                const weapon = getWeapons().find(w => w.id === artifact.weapon);
                if (weapon && this.gameState.currentRun.equipment.length < this.gameState.gameData.stats.craft) {
                    this.gameState.currentRun.equipment.push(weapon);
                }
                break;
                
            case 'gain_armor':
                // Add armor to equipment
                const armor = getArmors().find(a => a.id === artifact.armor);
                if (armor && this.gameState.currentRun.equipment.length < this.gameState.gameData.stats.craft) {
                    this.gameState.currentRun.equipment.push(armor);
                }
                break;
                
            case 'xp_boost':
                // XP boost effect (handled in gainXP method)
                break;
                
            case 'currency_boost':
                // Currency boost effect (handled in gainCurrency method)
                break;
                
            case 'add_black_cards':
            case 'add_red_cards':
                // Add cards to deck (placeholder for now)
                const suits = artifact.effect === 'add_black_cards' ? ['CLUBS', 'SPADES'] : ['HEARTS', 'DIAMONDS'];
                const values = ['9', '10', 'JACK', 'QUEEN', 'KING'];
                
                for (let i = 0; i < 2; i++) {
                    const suit = suits[Math.floor(Math.random() * suits.length)];
                    const value = values[Math.floor(Math.random() * values.length)];
                    this.gameState.currentRun.deck.push({
                        value: value,
                        suit: suit,
                        code: value + suit.charAt(0)
                    });
                }
                break;
                
            case 'random_armor':
                // Add random armor
                const randomArmor = getArmors()[Math.floor(Math.random() * getArmors().length)];
                if (this.gameState.currentRun.equipment.length < this.gameState.gameData.stats.craft) {
                    this.gameState.currentRun.equipment.push(randomArmor);
                }
                break;
                
            case 'random_weapon':
                // Add random weapon
                const randomWeapon = getWeapons()[Math.floor(Math.random() * getWeapons().length)];
                if (this.gameState.currentRun.equipment.length < this.gameState.gameData.stats.craft) {
                    this.gameState.currentRun.equipment.push(randomWeapon);
                }
                break;
        }
    }
    
    async getRandomArtifact() {
        const artifacts = await this.getArtifacts();
        return artifacts[Math.floor(Math.random() * artifacts.length)];
    }
    
    hasArtifact(artifactId) {
        if (!this.gameState.currentRun.artifacts) return false;
        return this.gameState.currentRun.artifacts.some(a => a.id === artifactId);
    }
    
    getArtifactsByRarity(rarity) {
        if (!this.gameState.currentRun.artifacts) return [];
        return this.gameState.currentRun.artifacts.filter(a => a.rarity === rarity);
    }
    
    removeArtifact(artifactId) {
        if (!this.gameState.currentRun.artifacts) return false;
        
        const index = this.gameState.currentRun.artifacts.findIndex(a => a.id === artifactId);
        if (index !== -1) {
            this.gameState.currentRun.artifacts.splice(index, 1);
            this.gameState.saveGameData();
            return true;
        }
        return false;
    }
} 