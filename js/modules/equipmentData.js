// Equipment Data Module - Contains all equipment definitions
export function getWeapons() {
    return [
        {
            id: 'sword',
            name: 'Sword',
            description: 'Hits on 5-10, J-A',
            damage: 10,
            hitConditions: ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
            type: 'weapon'
        },
        {
            id: 'dagger',
            name: 'Dagger',
            description: 'Hits on Red cards, A',
            damage: 8,
            hitConditions: ['red', 'A'],
            type: 'weapon'
        },
        {
            id: 'bow',
            name: 'Bow',
            description: 'Hits on A-6, A double damage',
            damage: 12,
            hitConditions: ['A', '2', '3', '4', '5', '6'],
            special: 'A double damage',
            type: 'weapon'
        },
        {
            id: 'staff',
            name: 'Staff',
            description: '♥ heal, ♦+A damage',
            damage: 6,
            hitConditions: ['♥', '♦', 'A'],
            special: '♥ heal, ♦+A damage',
            type: 'weapon'
        },
        {
            id: 'hammer',
            name: 'Hammer',
            description: 'Face cards, A, double damage',
            damage: 15,
            hitConditions: ['J', 'Q', 'K', 'A'],
            special: 'double damage',
            type: 'weapon'
        },
        {
            id: 'needle',
            name: 'Needle',
            description: 'A only, instant kill',
            damage: 1,
            hitConditions: ['A'],
            special: 'instant kill',
            type: 'weapon'
        }
    ];
}

export function getArmors() {
    return [
        {
            id: 'light',
            name: 'Light Armor',
            description: 'Dodge J-A',
            cost: 25,
            dodgeConditions: ['J', 'Q', 'K', 'A'],
            type: 'armor'
        },
        {
            id: 'medium',
            name: 'Medium Armor',
            description: 'Dodge A; half dmg on 7–K',
            cost: 30,
            dodgeConditions: ['A'],
            halfDamageConditions: ['7', '8', '9', '10', 'J', 'Q', 'K'],
            type: 'armor'
        },
        {
            id: 'heavy',
            name: 'Heavy Armor',
            description: 'Dodge A; quarter dmg on Q-K; half dmg on 9-J; ¾ dmg on 5-8',
            cost: 35,
            dodgeConditions: ['A'],
            quarterDamageConditions: ['Q', 'K'],
            halfDamageConditions: ['9', '10', 'J'],
            threeQuarterDamageConditions: ['5', '6', '7', '8'],
            type: 'armor'
        },
        {
            id: 'shield',
            name: 'Shield',
            description: '¾ damage reduction if card is 5–8',
            cost: 25,
            threeQuarterDamageConditions: ['5', '6', '7', '8'],
            type: 'armor'
        }
    ];
}

export function getArtifacts() {
    return [
        {
            id: 'ace_adder',
            name: 'Ace Collector',
            description: 'Add an Ace to your deck',
            effect: 'add_ace_to_deck',
            rarity: 'rare'
        },
        {
            id: 'stat_booster',
            name: 'Stat Booster',
            description: '+2 to one stat',
            effect: 'stat_boost',
            value: 2,
            rarity: 'uncommon'
        },
        {
            id: 'needle_weapon',
            name: 'Needle of Fate',
            description: 'Gain Needle weapon',
            effect: 'gain_weapon',
            weapon: 'needle',
            rarity: 'rare'
        },
        {
            id: 'shield_armor',
            name: 'Shield of Protection',
            description: 'Gain Shield armor',
            effect: 'gain_armor',
            armor: 'shield',
            rarity: 'rare'
        },
        {
            id: 'xp_boost',
            name: 'XP Amplifier',
            description: 'Draw bonus XP card per gain',
            effect: 'xp_boost',
            rarity: 'uncommon'
        },
        {
            id: 'currency_boost',
            name: 'Currency Magnet',
            description: 'Draw bonus card for currency',
            effect: 'currency_boost',
            rarity: 'uncommon'
        },
        {
            id: 'black_cards',
            name: 'Shadow Cards',
            description: 'Gain 2 black cards between 9-K',
            effect: 'add_black_cards',
            rarity: 'common'
        },
        {
            id: 'red_cards',
            name: 'Flame Cards',
            description: 'Gain 2 red cards between 9-K',
            effect: 'add_red_cards',
            rarity: 'common'
        },
        {
            id: 'random_armor',
            name: 'Armor Cache',
            description: 'Gain random armor',
            effect: 'random_armor',
            rarity: 'common'
        },
        {
            id: 'random_weapon',
            name: 'Weapon Cache',
            description: 'Gain random weapon',
            effect: 'random_weapon',
            rarity: 'common'
        }
    ];
}

export function getRealms() {
    return [
        {
            id: 1,
            name: 'Realm of Dust',
            description: 'The beginning realm. Low difficulty.',
            difficultyModifier: 0
        },
        {
            id: 2,
            name: 'Realm of Ash',
            description: 'A more challenging realm.',
            difficultyModifier: 2
        },
        {
            id: 3,
            name: 'Realm of Embers',
            description: 'A dangerous realm for experienced players.',
            difficultyModifier: 4
        },
        {
            id: 4,
            name: 'Realm of Flame',
            description: 'The most challenging realm.',
            difficultyModifier: 6
        }
    ];
} 