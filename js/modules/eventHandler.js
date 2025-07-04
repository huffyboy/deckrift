// Event Handler Module
export class EventHandler {
    constructor(gameState, deckManager) {
        this.gameState = gameState;
        this.deckManager = deckManager;
    }
    
    async drawBoon() {
        try {
            const cards = await this.deckManager.drawCards(1);
            const boonCard = cards[0];
            const boonEffect = this.getBoonEffect(boonCard);
            
            // Apply the boon effect
            await this.applyBoonEffect(boonEffect, boonCard);
            
        } catch (error) {
            console.error('Failed to draw boon:', error);
            // Fallback to random boon
            const fallbackBoon = this.getRandomBoonEffect();
            await this.applyBoonEffect(fallbackBoon, { value: 'ACE', suit: 'HEARTS' });
        }
    }
    
    getBoonEffect(card) {
        const value = card.value;
        const suit = card.suit;
        const isRed = suit === 'HEARTS' || suit === 'DIAMONDS';
        
        switch (value) {
            case 'ACE':
                return { type: 'gain_stat', description: 'Gain +1 to a random stat' };
            case 'JACK':
            case 'QUEEN':
            case 'KING':
                return { type: 'gain_artifact', description: 'Receive a random artifact' };
            case '9':
                if (isRed) {
                    return { type: 'remove_card', description: 'Draw cards and remove one from deck' };
                } else {
                    return { type: 'add_card', description: 'Add a random card to deck' };
                }
            case '10':
                if (isRed) {
                    return { type: 'remove_card', description: 'Draw cards and remove one from deck' };
                } else {
                    return { type: 'gain_xp', description: 'Gain XP in a random stat' };
                }
            case '8':
                return { type: 'add_card', description: 'Add a random card to deck' };
            case '5':
            case '6':
            case '7':
                return { type: 'gain_xp', description: 'Gain XP in a random stat' };
            case '2':
            case '3':
            case '4':
                return { type: 'gain_currency', description: 'Gain currency' };
            default:
                return { type: 'gain_stat', description: 'Gain +1 to a random stat' };
        }
    }
    
    getRandomBoonEffect() {
        const boonTypes = [
            { type: 'gain_stat', description: 'Gain +1 to a random stat' },
            { type: 'gain_artifact', description: 'Receive a random artifact' },
            { type: 'remove_card', description: 'Draw cards and remove one from deck' },
            { type: 'add_card', description: 'Add a random card to deck' },
            { type: 'gain_xp', description: 'Gain XP in a random stat' },
            { type: 'gain_currency', description: 'Gain currency' }
        ];
        
        return boonTypes[Math.floor(Math.random() * boonTypes.length)];
    }
    
    async applyBoonEffect(boonEffect, card) {
        let message = `Boon drawn: ${card.value} of ${card.suit}\n\n${boonEffect.description}`;
        let effectApplied = false;
        
        switch (boonEffect.type) {
            case 'gain_stat':
                const stats = ['power', 'will', 'craft', 'control'];
                const randomStat = stats[Math.floor(Math.random() * stats.length)];
                this.gameState.gainStat(randomStat, 1);
                message += `\n\nGained +1 ${randomStat}`;
                effectApplied = true;
                break;
                
            case 'gain_artifact':
                // Give a random artifact
                const { ArtifactSystem } = await import('./artifactSystem.js');
                const artifactSystem = new ArtifactSystem(this.gameState);
                const randomArtifact = await artifactSystem.getRandomArtifact();
                await artifactSystem.addArtifact(randomArtifact.id);
                message += `\n\nReceived artifact: ${randomArtifact.name}`;
                message += `\n${randomArtifact.description}`;
                effectApplied = true;
                break;
                
            case 'remove_card':
                if (this.gameState.currentRun.deck.length > 0) {
                    // Draw hand size cards for selection
                    const handSize = Math.min(this.gameState.gameData.stats.control, this.gameState.currentRun.deck.length);
                    const drawnCards = this.gameState.currentRun.deck.splice(0, handSize);
                    
                    message += `\n\nDrew ${handSize} cards. Select one to remove:`;
                    // TODO: Implement card selection UI
                    message += '\n\nCard selection UI not yet implemented';
                } else {
                    message += '\n\nDeck is empty!';
                }
                break;
                
            case 'add_card':
                try {
                    const cards = await this.deckManager.drawCards(1);
                    this.gameState.currentRun.deck = this.deckManager.addCardToDeck(this.gameState.currentRun.deck, cards[0]);
                    message += `\n\nAdded ${cards[0].value} of ${cards[0].suit} to deck`;
                    effectApplied = true;
                } catch (error) {
                    message += '\n\nFailed to add card to deck';
                }
                break;
                
            case 'gain_xp':
                const xpStats = ['power', 'will', 'craft', 'control'];
                const randomXpStat = xpStats[Math.floor(Math.random() * xpStats.length)];
                const xpAmount = this.deckManager.getCardValue(card.value);
                this.gameState.gainXP(randomXpStat, xpAmount);
                message += `\n\nGained ${xpAmount} XP in ${randomXpStat}`;
                effectApplied = true;
                break;
                
            case 'gain_currency':
                const currencyAmount = this.deckManager.getCardValue(card.value);
                const finalAmount = this.gameState.gainCurrency(currencyAmount);
                message += `\n\nGained ${finalAmount} currency`;
                effectApplied = true;
                break;
        }
        
        if (effectApplied) {
            this.gameState.saveGameData();
        }
        
        return message;
    }
    
    async drawBane() {
        try {
            const cards = await this.deckManager.drawCards(1);
            const baneCard = cards[0];
            const baneEffect = this.getBaneEffect(baneCard);
            
            // Apply the bane effect
            await this.applyBaneEffect(baneEffect, baneCard);
            
        } catch (error) {
            console.error('Failed to draw bane:', error);
            // Fallback to random bane
            const fallbackBane = this.getRandomBaneEffect();
            await this.applyBaneEffect(fallbackBane, { value: '2', suit: 'SPADES' });
        }
    }
    
    getBaneEffect(card) {
        const value = card.value;
        
        switch (value) {
            case '2':
                return { type: 'lose_equipment', description: 'Lose a random piece of equipment' };
            case '3':
                return { type: 'lose_stat', description: 'Lose 1 stat point' };
            case '4':
                return { type: 'lose_high_card', description: 'Lose a high-number card from deck' };
            case '5':
                return { type: 'lose_face_card', description: 'Lose a face card from deck' };
            case '6':
            case '7':
            case '8':
                return { type: 'add_jokers', count: 2, description: 'Add 2 Jokers to your deck' };
            case '9':
            case '10':
            case 'JACK':
                return { type: 'add_jokers', count: 1, description: 'Add 1 Joker to your deck' };
            case 'QUEEN':
            case 'KING':
            case 'ACE':
                return { type: 'lose_currency', description: 'Lose currency' };
            default:
                return { type: 'add_jokers', count: 3, description: 'Add 3 Jokers to your deck' };
        }
    }
    
    getRandomBaneEffect() {
        const baneTypes = [
            { type: 'lose_equipment', description: 'Lose a random piece of equipment' },
            { type: 'lose_stat', description: 'Lose 1 stat point' },
            { type: 'lose_high_card', description: 'Lose a high-number card from deck' },
            { type: 'lose_face_card', description: 'Lose a face card from deck' },
            { type: 'add_jokers', count: 2, description: 'Add 2 Jokers to your deck' },
            { type: 'add_jokers', count: 1, description: 'Add 1 Joker to your deck' },
            { type: 'lose_currency', description: 'Lose currency' }
        ];
        
        return baneTypes[Math.floor(Math.random() * baneTypes.length)];
    }
    
    async applyBaneEffect(baneEffect, card) {
        let message = `Bane drawn: ${card.value} of ${card.suit}\n\n${baneEffect.description}`;
        let effectApplied = false;
        
        switch (baneEffect.type) {
            case 'lose_equipment':
                if (this.gameState.currentRun.equipment.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.gameState.currentRun.equipment.length);
                    const lostEquipment = this.gameState.currentRun.equipment.splice(randomIndex, 1)[0];
                    message += `\n\nLost ${lostEquipment.name}`;
                    effectApplied = true;
                } else {
                    message += '\n\nNo equipment to lose!';
                }
                break;
                
            case 'lose_stat':
                const stats = ['power', 'will', 'craft', 'control'];
                const randomStat = stats[Math.floor(Math.random() * stats.length)];
                this.gameState.gameData.stats[randomStat] = Math.max(1, this.gameState.gameData.stats[randomStat] - 1);
                message += `\n\nLost 1 ${randomStat}`;
                effectApplied = true;
                break;
                
            case 'lose_high_card':
                if (this.gameState.currentRun.deck.length > 0) {
                    // Find and remove highest card using deck manager
                    const highCards = this.deckManager.findHighCards(this.gameState.currentRun.deck);
                    if (highCards.length > 0) {
                        // Find the highest card
                        let highestCard = highCards[0];
                        let highestValue = this.deckManager.getCardValue(highestCard.value);
                        
                        highCards.forEach(card => {
                            const value = this.deckManager.getCardValue(card.value);
                            if (value > highestValue) {
                                highestValue = value;
                                highestCard = card;
                            }
                        });
                        
                        // Remove the highest card
                        const cardIndex = this.gameState.currentRun.deck.findIndex(card => 
                            card.value === highestCard.value && card.suit === highestCard.suit
                        );
                        
                        if (cardIndex !== -1) {
                            const result = this.deckManager.removeCardFromDeck(this.gameState.currentRun.deck, cardIndex);
                            this.gameState.currentRun.deck = result.remaining;
                            message += `\n\nLost ${result.removed.value} of ${result.removed.suit}`;
                            effectApplied = true;
                        }
                    } else {
                        message += '\n\nNo high cards in deck!';
                    }
                } else {
                    message += '\n\nDeck is empty!';
                }
                break;
                
            case 'lose_face_card':
                if (this.gameState.currentRun.deck.length > 0) {
                    // Find and remove a face card using deck manager
                    const faceCards = this.deckManager.findFaceCards(this.gameState.currentRun.deck);
                    if (faceCards.length > 0) {
                        const randomFaceCard = faceCards[Math.floor(Math.random() * faceCards.length)];
                        const cardIndex = this.gameState.currentRun.deck.findIndex(card => 
                            card.value === randomFaceCard.value && card.suit === randomFaceCard.suit
                        );
                        
                        if (cardIndex !== -1) {
                            const result = this.deckManager.removeCardFromDeck(this.gameState.currentRun.deck, cardIndex);
                            this.gameState.currentRun.deck = result.remaining;
                            message += `\n\nLost ${result.removed.value} of ${result.removed.suit}`;
                            effectApplied = true;
                        }
                    } else {
                        message += '\n\nNo face cards in deck!';
                    }
                } else {
                    message += '\n\nDeck is empty!';
                }
                break;
                
            case 'add_jokers':
                this.gameState.currentRun.deck = this.deckManager.addJokersToDeck(this.gameState.currentRun.deck, baneEffect.count);
                message += `\n\nAdded ${baneEffect.count} Joker(s) to deck`;
                effectApplied = true;
                break;
                
            case 'lose_currency':
                const lostAmount = Math.floor(this.gameState.gameData.currency * 0.25); // Lose 25%
                this.gameState.gameData.currency = Math.max(0, this.gameState.gameData.currency - lostAmount);
                message += `\n\nLost ${lostAmount} currency`;
                effectApplied = true;
                break;
        }
        
        if (effectApplied) {
            this.gameState.saveGameData();
        }
        
        return message;
    }
    
    rest() {
        if (!this.gameState.currentRun) return 'No active run';
        
        const healAmount = Math.floor(this.gameState.currentRun.maxHealth * 0.5);
        this.gameState.currentRun.health = Math.min(this.gameState.currentRun.maxHealth, this.gameState.currentRun.health + healAmount);
        
        this.gameState.saveGameData();
        return `Rested and recovered ${healAmount} health!`;
    }
    
    // Artifact methods moved to artifactSystem.js
    
    // Equipment methods moved to equipmentData.js
} 