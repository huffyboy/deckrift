// Boss System Module
export class BossSystem {
    constructor(gameState, deckManager) {
        this.gameState = gameState;
        this.deckManager = deckManager;
        
        this.bosses = [
            {
                id: 'jack',
                name: 'Jack of Steel',
                realm: 1,
                weapon: 'sword',
                baseStats: 8,
                description: 'A relentless warrior clad in steel armor.'
            },
            {
                id: 'queen',
                name: 'Queen of Blood',
                realm: 2,
                weapon: 'staff',
                baseStats: 10,
                description: 'A powerful sorceress who drains the life from her enemies.'
            },
            {
                id: 'king',
                name: 'King of Ash',
                realm: 3,
                weapon: 'hammer',
                baseStats: 12,
                description: 'A massive warrior who crushes all who oppose him.'
            },
            {
                id: 'ace',
                name: 'Ace of Speed',
                realm: 4,
                weapon: 'bow',
                baseStats: 14,
                description: 'A lightning-fast archer who never misses.'
            }
        ];
    }
    
    getBossForRealm(realmId) {
        return this.bosses.find(boss => boss.realm === realmId);
    }
    
    generateBossStats(boss, challengeModifier) {
        const baseStats = boss.baseStats;
        const bossStats = {
            power: baseStats + (challengeModifier * 2),
            will: baseStats + (challengeModifier * 2),
            craft: baseStats + (challengeModifier * 2),
            control: baseStats + (challengeModifier * 2)
        };
        
        // Calculate HP (10 + challenge modifier, like regular enemies)
        const hp = 10 + challengeModifier;
        
        return {
            ...bossStats,
            hp: hp,
            maxHp: hp,
            weapon: boss.weapon,
            name: boss.name,
            description: boss.description,
            isBoss: true
        };
    }
    
    async startBossBattle() {
        const boss = this.getBossForRealm(this.gameState.currentRun.realm);
        if (!boss) {
            throw new Error('No boss found for current realm');
        }
        
        const { getRealms } = await import('./equipmentData.js');
        const realm = getRealms().find(r => r.id === this.gameState.currentRun.realm);
        const challengeModifier = this.gameState.currentRun.level + (realm ? realm.difficultyModifier : 0);
        
        const bossStats = this.generateBossStats(boss, challengeModifier);
        
        // Create boss enemy object
        const bossEnemy = {
            ...bossStats,
            hand: [],
            hasDiscarded: false,
            type: 'boss'
        };
        
        // Draw initial hand for boss
        const handSize = bossStats.control;
        bossEnemy.hand = await this.deckManager.drawCards(handSize);
        
        return bossEnemy;
    }
    
    async handleBossVictory(boss) {
        const { getRealms } = await import('./equipmentData.js');
        const realm = getRealms().find(r => r.id === this.gameState.currentRun.realm);
        const challengeModifier = this.gameState.currentRun.level + (realm ? realm.difficultyModifier : 0);
        
        // Boss rewards: One XP card per stat + one card's worth of currency
        const rewards = {
            xp: {},
            currency: 0
        };
        
        // Generate XP rewards for each stat
        const stats = ['power', 'will', 'craft', 'control'];
        for (const stat of stats) {
            const xpCard = await this.deckManager.drawCards(1);
            const xpValue = this.deckManager.getCardValue(xpCard[0].value);
            rewards.xp[stat] = xpValue;
            this.gameState.gainXP(stat, xpValue);
        }
        
        // Generate currency reward
        const currencyCard = await this.deckManager.drawCards(1);
        const currencyValue = this.deckManager.getCardValue(currencyCard[0].value);
        rewards.currency = currencyValue;
        this.gameState.gameData.currency += currencyValue;
        
        // Check if this was the final boss (realm 4)
        if (this.gameState.currentRun.realm === 4) {
            // Game completion!
            return {
                ...rewards,
                gameCompleted: true,
                message: `Congratulations! You have defeated ${boss.name} and completed your journey through the cursed realm!`
            };
        } else {
            // Move to next realm
            this.gameState.currentRun.realm += 1;
            this.gameState.currentRun.level = 1;
            this.gameState.currentRun.health = this.gameState.calculateMaxHealth();
            this.gameState.currentRun.maxHealth = this.gameState.calculateMaxHealth();
            
            return {
                ...rewards,
                gameCompleted: false,
                message: `Victory! You have defeated ${boss.name} and advanced to the next realm.`
            };
        }
    }
    
    getBossDescription(boss) {
        return `${boss.name}\n\n${boss.description}\n\nThis is a boss encounter. Defeat them to advance to the next realm or complete your journey!`;
    }
} 