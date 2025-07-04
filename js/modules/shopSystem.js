// Shop System Module
export class ShopSystem {
    constructor(gameState, deckManager) {
        this.gameState = gameState;
        this.deckManager = deckManager;
        this.currentShopData = null;
        this.currentShopItems = null;
    }
    
    async showShop() {
        try {
            // Calculate shop costs based on challenge modifier
            const { getRealms } = await import('./equipmentData.js');
            const realm = getRealms().find(r => r.id === this.gameState.currentRun.realm);
            const challengeModifier = this.gameState.currentRun.level + (realm ? realm.difficultyModifier : 0);
            
            const shopData = {
                healCost: 10 + challengeModifier,
                cardRemovalCost: 25 + challengeModifier,
                equipmentCosts: [
                    25 + challengeModifier,
                    30 + challengeModifier,
                    35 + challengeModifier
                ]
            };
            
            // Generate shop items
            const shopItems = await this.generateShopItems(shopData.equipmentCosts);
            
            // Store shop data for purchase methods
            this.currentShopData = shopData;
            this.currentShopItems = shopItems;
            
            return { shopData, shopItems };
            
        } catch (error) {
            console.error('Failed to show shop:', error);
            throw new Error('Failed to open shop. Please try again.');
        }
    }
    
    async generateShopItems(costs) {
        const items = [];
        const { getWeapons, getArmors } = await import('./equipmentData.js');
        
        for (let i = 0; i < 3; i++) {
            const isWeapon = Math.random() < 0.5;
            const itemPool = isWeapon ? getWeapons() : getArmors();
            const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];
            
            items.push({
                ...randomItem,
                cost: costs[i]
            });
        }
        
        return items;
    }
    
    async purchaseHealing() {
        const healCost = this.currentShopData?.healCost || 10;
        
        if (this.gameState.gameData.currency < healCost) {
            throw new Error('Not enough currency!');
        }
        
        const healAmount = 10;
        this.gameState.currentRun.health = Math.min(this.gameState.currentRun.maxHealth, this.gameState.currentRun.health + healAmount);
        this.gameState.gameData.currency -= healCost;
        
        this.gameState.saveGameData();
        return { healAmount, healCost };
    }
    
    async purchaseCardRemoval() {
        const removalCost = this.currentShopData?.cardRemovalCost || 25;
        
        if (this.gameState.gameData.currency < removalCost) {
            throw new Error('Not enough currency!');
        }
        
        if (!this.gameState.currentRun.deck || this.gameState.currentRun.deck.length === 0) {
            throw new Error('No cards in deck to remove!');
        }
        
        // Remove a random card
        const randomIndex = Math.floor(Math.random() * this.gameState.currentRun.deck.length);
        const removedCard = this.gameState.currentRun.deck.splice(randomIndex, 1)[0];
        
        this.gameState.gameData.currency -= removalCost;
        this.gameState.saveGameData();
        
        return { removedCard, removalCost };
    }
    
    async purchaseEquipment(itemIndex) {
        if (!this.currentShopItems || !this.currentShopItems[itemIndex]) {
            throw new Error('Invalid item selection!');
        }
        
        const item = this.currentShopItems[itemIndex];
        
        if (this.gameState.gameData.currency < item.cost) {
            throw new Error('Not enough currency!');
        }
        
        if (this.gameState.currentRun.equipment.length >= this.gameState.gameData.stats.craft) {
            throw new Error('Equipment inventory is full!');
        }
        
        // Purchase the item
        this.gameState.gameData.currency -= item.cost;
        this.gameState.currentRun.equipment.push(item);
        
        this.gameState.saveGameData();
        
        // Remove item from shop
        this.currentShopItems.splice(itemIndex, 1);
        
        return { item, cost: item.cost };
    }
    
    getShopInfo() {
        return {
            gold: this.gameState.gameData.currency,
            health: this.gameState.currentRun.health,
            maxHealth: this.gameState.currentRun.maxHealth,
            equipmentSlots: this.gameState.gameData.stats.craft,
            usedSlots: this.gameState.currentRun.equipment.length
        };
    }
} 