// Battle Logic Module
export class BattleLogic {
    constructor(gameState, deckManager) {
        this.gameState = gameState;
        this.deckManager = deckManager;
        this.currentBattle = null;
    }
    
    async generateEnemy(card) {
        const { getRealms, getWeapons } = await import('./equipmentData.js');
        const realm = getRealms().find(r => r.id === this.gameState.currentRun.realm);
        const challengeModifier = this.gameState.currentRun.level + (realm ? realm.difficultyModifier : 0);
        
        // Determine enemy type based on card value
        let enemyType, coreStat, weapon;
        
        switch (card.value) {
            case '3':
                enemyType = 'Power-focused';
                coreStat = 'power';
                weapon = getWeapons().find(w => w.id === 'sword');
                break;
            case '4':
                enemyType = 'Will-focused';
                coreStat = 'will';
                weapon = getWeapons().find(w => w.id === 'staff');
                break;
            case '5':
                enemyType = 'Craft-focused';
                coreStat = 'craft';
                const craftWeapons = getWeapons().filter(w => ['sword', 'staff', 'hammer'].includes(w.id));
                weapon = craftWeapons[Math.floor(Math.random() * craftWeapons.length)];
                break;
            case '6':
                enemyType = 'Control-focused';
                coreStat = 'control';
                weapon = getWeapons().find(w => w.id === 'hammer');
                break;
            default:
                enemyType = 'Generic';
                coreStat = 'power';
                weapon = getWeapons().find(w => w.id === 'sword');
        }
        
        // Calculate stats: base 2 in each + 1 in core stat + challenge modifier distribution
        const stats = {
            power: 2,
            will: 2,
            craft: 2,
            control: 2
        };
        
        stats[coreStat] += 1; // Core stat bonus
        
        // Distribute challenge modifier randomly
        for (let i = 0; i < challengeModifier; i++) {
            const randomStat = ['power', 'will', 'craft', 'control'][Math.floor(Math.random() * 4)];
            stats[randomStat]++;
        }
        
        // Calculate HP: 10 + challenge modifier
        const maxHealth = 10 + challengeModifier;
        
        return {
            name: `${enemyType} Enemy`,
            type: enemyType,
            stats: stats,
            weapon: weapon,
            maxHealth: maxHealth,
            health: maxHealth,
            coreStat: coreStat
        };
    }
    
    async drawBattleHands() {
        try {
            // Draw cards for both player and enemy
            const playerHandSize = this.gameState.gameData.stats.control;
            const enemyHandSize = this.currentBattle.enemy.stats.control;
            
            // Draw player hand from their deck
            if (this.gameState.currentRun.deck && this.gameState.currentRun.deck.length > 0) {
                const drawResult = this.deckManager.drawFromPlayerDeck(this.gameState.currentRun.deck, playerHandSize);
                this.currentBattle.playerHand = drawResult.drawn;
                this.gameState.currentRun.deck = drawResult.remaining;
                
                // If deck is empty, shuffle discard pile back (for now, just draw from API)
                if (this.gameState.currentRun.deck.length === 0) {
                    console.log('Player deck empty, drawing from API');
                    this.currentBattle.playerHand = await this.deckManager.drawCards(playerHandSize);
                }
            } else {
                // Fallback to API if no deck
                this.currentBattle.playerHand = await this.deckManager.drawCards(playerHandSize);
            }
            
            // Draw enemy hand from API (enemies don't have persistent decks)
            this.currentBattle.enemyHand = await this.deckManager.drawCards(enemyHandSize);
            
        } catch (error) {
            console.error('Failed to draw battle hands:', error);
            // Fallback to local card generation
            this.currentBattle.playerHand = this.deckManager.generateLocalHand(this.gameState.gameData.stats.control);
            this.currentBattle.enemyHand = this.deckManager.generateLocalHand(this.currentBattle.enemy.stats.control);
        }
    }
    
    checkWeaponHit(weapon, card) {
        const value = card.value;
        const suit = card.suit;
        const isRed = suit === 'HEARTS' || suit === 'DIAMONDS';
        
        switch (weapon.id) {
            case 'sword':
                return value >= 5 || ['JACK', 'QUEEN', 'KING', 'ACE'].includes(card.code?.slice(0, -1));
            case 'dagger':
                return isRed || value === 1; // Ace
            case 'bow':
                return value <= 6 || value === 1; // A-6, A
            case 'staff':
                return suit === 'HEARTS' || suit === 'DIAMONDS' || value === 1; // Hearts heal, Diamonds+A damage
            case 'hammer':
                return ['JACK', 'QUEEN', 'KING', 'ACE'].includes(card.code?.slice(0, -1)) || value === 1;
            case 'needle':
                return value === 1; // Only Ace hits
            default:
                return false;
        }
    }
    
    calculateDamage(power, weapon, card) {
        let damage = power;
        
        // Apply weapon multipliers
        switch (weapon.id) {
            case 'bow':
                if (card.value === 1) damage *= 2; // Double damage for Ace
                break;
            case 'hammer':
                if (['JACK', 'QUEEN', 'KING', 'ACE'].includes(card.code?.slice(0, -1)) || card.value === 1) {
                    damage *= 2; // Double damage for face cards and Ace
                }
                break;
            case 'needle':
                if (card.value === 1) {
                    // Instant kill for non-boss enemies
                    return this.currentBattle.enemy.maxHealth;
                }
                break;
        }
        
        return Math.floor(damage);
    }
    
    handleWeaponSpecialEffect(weapon, card) {
        const suit = card.suit;
        const value = card.value;
        
        switch (weapon.id) {
            case 'staff':
                if (suit === 'HEARTS') {
                    // Hearts heal for staff value
                    return {
                        type: 'heal',
                        amount: Math.floor(this.gameState.gameData.stats.will * 2) // Heal based on Will stat
                    };
                } else if (suit === 'DIAMONDS' && value === 1) {
                    // Diamonds + Ace deal extra damage
                    return {
                        type: 'attack',
                        damage: Math.floor(this.gameState.gameData.stats.power * 1.5)
                    };
                }
                break;
        }
        
        return { type: 'normal' };
    }
    
    applyArmorMitigation(damage, armor, card) {
        const value = card.value;
        const suit = card.suit;
        
        switch (armor.id) {
            case 'light':
                if (value >= 11 || value === 1) return 0; // Dodge J-A
                break;
            case 'medium':
                if (value === 1) return 0; // Dodge A
                if (value >= 7 && value <= 13) return Math.floor(damage / 2); // Half damage 7-K
                break;
            case 'heavy':
                if (value === 1) return 0; // Dodge A
                if (value >= 12 && value <= 13) return Math.floor(damage / 4); // Quarter damage Q-K
                if (value >= 9 && value <= 11) return Math.floor(damage / 2); // Half damage 9-J
                if (value >= 5 && value <= 8) return Math.floor(damage * 3 / 4); // 3/4 damage 5-8
                break;
            case 'shield':
                if (value >= 5 && value <= 8) return Math.floor(damage * 3 / 4); // 3/4 damage 5-8
                break;
        }
        
        return damage;
    }
    
    performEnemyCraft() {
        const enemy = this.currentBattle.enemy;
        const craft = enemy.stats.craft;
        
        // Find worst card (lowest value)
        let worstCardIndex = 0;
        let worstValue = 14;
        
        this.currentBattle.enemyHand.forEach((card, index) => {
            if (card.value < worstValue) {
                worstValue = card.value;
                worstCardIndex = index;
            }
        });
        
        // Discard if card is under 8 and enemy has enough craft
        if (worstValue < 8 && craft > 0) {
            const discardedCard = this.currentBattle.enemyHand[worstCardIndex];
            this.currentBattle.enemyHand.splice(worstCardIndex, 1);
            
            return `Enemy discards ${discardedCard.value} of ${discardedCard.suit} (Craft: ${craft})`;
        }
        
        return null;
    }
    
    getHighestCardIndex(hand) {
        let highestIndex = 0;
        let highestValue = 0;
        
        hand.forEach((card, index) => {
            if (card.value > highestValue) {
                highestValue = card.value;
                highestIndex = index;
            }
        });
        
        return highestIndex;
    }
    
    // Add player hand cards back to deck (shuffle them in)
    returnPlayerHandToDeck() {
        if (this.currentBattle && this.currentBattle.playerHand) {
            // Add all cards from hand back to deck
            this.gameState.currentRun.deck = [
                ...this.gameState.currentRun.deck,
                ...this.currentBattle.playerHand
            ];
            
            // Shuffle the deck
            this.gameState.currentRun.deck = this.deckManager.shuffleDeck(this.gameState.currentRun.deck);
            
            // Clear the hand
            this.currentBattle.playerHand = [];
        }
    }
    
    // Equipment and realm methods moved to equipmentData.js
} 