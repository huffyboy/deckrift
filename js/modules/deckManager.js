// Deck Management Module
export class DeckManager {
    constructor() {
        this.cardValues = {
            'ACE': 14, 'KING': 13, 'QUEEN': 12, 'JACK': 11,
            '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
        };
    }
    
    async generateStartingDeck() {
        try {
            const response = await fetch('https://deckofcardsapi.com/api/deck/new/draw/?count=52');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Failed to draw starting deck');
            }
            
            return data.cards;
        } catch (error) {
            console.error('Failed to generate starting deck:', error);
            return this.generateLocalStartingDeck();
        }
    }
    
    generateLocalStartingDeck() {
        const deck = [];
        const suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'JACK', 'QUEEN', 'KING', 'ACE'];
        
        suits.forEach(suit => {
            values.forEach(value => {
                deck.push({
                    value: value,
                    suit: suit,
                    code: value + suit.charAt(0)
                });
            });
        });
        
        // Shuffle the deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        return deck;
    }
    
    async generateMapCards(cardCount) {
        try {
            const response = await fetch(`https://deckofcardsapi.com/api/deck/new/draw/?count=${cardCount}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Failed to draw map cards');
            }
            
            return data.cards.map(card => ({
                card: card,
                type: this.getCardGameType(card),
                revealed: false
            }));
        } catch (error) {
            console.error('Failed to generate map cards:', error);
            return this.generateLocalMapCards(cardCount);
        }
    }
    
    generateLocalMapCards(cardCount) {
        const cards = [];
        for (let i = 0; i < cardCount; i++) {
            cards.push({
                card: {
                    value: this.getRandomCardValue(),
                    suit: this.getRandomSuit(),
                    code: this.getRandomCardValue() + this.getRandomSuit().charAt(0)
                },
                type: this.getRandomCardType(),
                revealed: false
            });
        }
        return cards;
    }
    
    getCardGameType(card) {
        const value = card.value;
        
        if (value === '2') return 'bane';
        if (['3', '4', '5', '6'].includes(value)) return 'enemy';
        if (['7', '8', '9', '10'].includes(value)) return 'challenge';
        if (value === 'JACK') return 'nothing';
        if (value === 'QUEEN') return 'rest';
        if (value === 'KING') return 'shop';
        if (value === 'ACE') return 'boon';
        if (value === 'JOKER') return 'joker';
        
        return 'nothing';
    }
    
    getCardValue(value) {
        return this.cardValues[value] || parseInt(value) || 1;
    }
    
    getSuitSymbol(suit) {
        switch (suit) {
            case 'HEARTS': return '♥';
            case 'DIAMONDS': return '♦';
            case 'CLUBS': return '♣';
            case 'SPADES': return '♠';
            default: return suit;
        }
    }
    
    getRandomCardValue() {
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'JACK', 'QUEEN', 'KING', 'ACE'];
        return values[Math.floor(Math.random() * values.length)];
    }
    
    getRandomSuit() {
        const suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
        return suits[Math.floor(Math.random() * suits.length)];
    }
    
    getRandomCardType() {
        const types = ['bane', 'enemy', 'challenge', 'nothing', 'rest', 'shop', 'boon'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    async drawCards(count) {
        try {
            const response = await fetch(`https://deckofcardsapi.com/api/deck/new/draw/?count=${count}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Failed to draw cards');
            }
            
            return data.cards.map(card => ({
                ...card,
                value: this.getCardValue(card.value)
            }));
        } catch (error) {
            console.error('Failed to draw cards:', error);
            return this.generateLocalHand(count);
        }
    }
    
    generateLocalHand(size) {
        const hand = [];
        for (let i = 0; i < size; i++) {
            hand.push({
                value: Math.floor(Math.random() * 13) + 1,
                suit: ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'][Math.floor(Math.random() * 4)],
                code: `${Math.floor(Math.random() * 13) + 1}${['H', 'D', 'C', 'S'][Math.floor(Math.random() * 4)]}`
            });
        }
        return hand;
    }
    
    // Player deck management methods
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    drawFromPlayerDeck(deck, count) {
        if (!deck || deck.length === 0) {
            return [];
        }
        
        const drawn = deck.slice(0, count);
        const remaining = deck.slice(count);
        
        return {
            drawn: drawn,
            remaining: remaining
        };
    }
    
    addCardToDeck(deck, card) {
        if (!deck) deck = [];
        return [...deck, card];
    }
    
    removeCardFromDeck(deck, cardIndex) {
        if (!deck || cardIndex < 0 || cardIndex >= deck.length) {
            return deck;
        }
        
        const removed = deck[cardIndex];
        const remaining = deck.filter((_, index) => index !== cardIndex);
        
        return {
            removed: removed,
            remaining: remaining
        };
    }
    
    findHighCards(deck) {
        if (!deck) return [];
        
        const highCards = ['10', 'JACK', 'QUEEN', 'KING', 'ACE'];
        return deck.filter(card => highCards.includes(card.value));
    }
    
    findFaceCards(deck) {
        if (!deck) return [];
        
        const faceCards = ['JACK', 'QUEEN', 'KING'];
        return deck.filter(card => faceCards.includes(card.value));
    }
    
    addJokersToDeck(deck, count) {
        if (!deck) deck = [];
        
        const jokers = [];
        for (let i = 0; i < count; i++) {
            jokers.push({
                value: 'JOKER',
                suit: 'JOKER',
                code: 'JOKER'
            });
        }
        
        return [...deck, ...jokers];
    }
    
    getDeckSize(deck) {
        return deck ? deck.length : 0;
    }
    
    getDeckStats(deck) {
        if (!deck) return { total: 0, suits: {}, values: {} };
        
        const stats = {
            total: deck.length,
            suits: { HEARTS: 0, DIAMONDS: 0, CLUBS: 0, SPADES: 0 },
            values: {}
        };
        
        deck.forEach(card => {
            if (card.suit !== 'JOKER') {
                stats.suits[card.suit] = (stats.suits[card.suit] || 0) + 1;
            }
            stats.values[card.value] = (stats.values[card.value] || 0) + 1;
        });
        
        return stats;
    }
} 