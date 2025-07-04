# Deckrift – Drawn to Dust: Design Document

## Game Overview

**Deckrift – Drawn to Dust** is a deck-based roguelike browser game where players explore a cursed realm through card-based encounters. The gameplay combines traditional card mechanics with persistent RPG progression and random events, encouraging replayability and strategic decision-making.

### Story
You were once an adventurer, until you vanished into a realm all your own. Immortal now, but utterly alone. No purpose. No subjects. No escape. You search, until madness paves a way.

### Core Concept
- **Deck-based roguelike gameplay** with persistent progression
- **Strategic decision-making** through card encounters
- **RPG elements** with stats, equipment, and upgrades
- **Responsive design** optimized for desktop and mobile
- **Local storage** for persistent game state and profiles

### Difficulty Scaling
- Each realm lasts 5 levels
- Every level or realm adds a difficulty/challenge modifier
- The challenge modifier makes each level harder and longer
- 5 overworld cards for each modifier
- Losing stat challenges or drawing banes give you banes/curses

## Player Attributes & Stats

| Stat | Effect |
|------|--------|
| **Power** | +1 damage per point |
| **Will** | +10 max HP per point (healing = stat gain × 10) |
| **Craft** | Determines number of equipment items player can carry |
| **Control** | Hand size (number of cards drawn per round) |

### Starting Configuration
- **Starting stats**: 4 in each attribute
- **Leveling threshold**: 
  - Level 1: 40 XP
  - +40 per level thereafter (e.g., 40, 80, 120, etc.)

## Combat System: Weapons & Armor

### Weapons

| Weapon | Condition | Avg Hit Rate | Damage Output |
|--------|-----------|--------------|---------------|
| **Sword** | J–A hit (partial below J) | ~77% | 0.5× Power |
| **Dagger** | Red cards or A hit | ~54% | 0.54× Power |
| **Bow** | A–6 hit, A = double dmg | ~46% | 0.54× Power |
| **Staff** | ♥ heals, ♦ + A deals dmg | ~54% | 0.54× Power |
| **Hammer** | Face cards + A = hit, double dmg | ~31% | 0.62× Power |
| **Needle** (special) | Only A hits – Instant kill vs non-boss | ~7.7% | ~0.08× Power (Enemy HP / Power) |

### Armor

| Armor Type | Effect | Trigger Rate | Damage Mitigation |
|------------|--------|--------------|-------------------|
| **Light** | Dodge if J–A | 30.77% | ~31% |
| **Medium** | Dodge A; half dmg on 7–K | 53.85% | ~31% |
| **Heavy** | Dodge A; quarter dmg on Q-K; half dmg on 9-J; ¾ dmg on 5-8 | 76.92% | ~31% |
| **Shield** (special) | ¾ damage reduction if card is 5–8 | 30.77% | ~23% |

## Game Events: Boons, Banes, and Artifacts

### Boons

| Cards | Card Count | Effect |
|-------|------------|--------|
| **A** | 4 | +1 to a stat (temporary) |
| **Jacks–Kings** | 12 | Receive a random artifact |
| **Red 9, 10** | 6 | Random hand from player's deck is drawn and option to remove 1 card |
| **8, Black 9** | 6 | Option to add random deck card |
| **5-7** | 12 | Gain attribute xp (value = drawn card) |
| **2-4** | 12 | Gain currency (value = drawn card) |
| **Jokers** | 0 | Nothing |

### Banes

| Cards | Card Count | Effect |
|-------|------------|--------|
| **2** | 4 | Lose a random item |
| **3** | 4 | Lose 1 stat point |
| **4** | 4 | Lose a high-number card from deck |
| **5** | 4 | Lose a face card |
| **6–8** | 12 | Add two Jokers to deck |
| **9–J** | 12 | Add one Joker |
| **Q–A** | 12 | Lose currency |
| **Joker** | 0 | Add 3 Jokers to deck |

### Artifacts

| Cards | Card Count | Effect |
|-------|------------|--------|
| **Aces** | 4 | Add an Ace to player's deck |
| **K, Q, Black J** | 10 | +2 to one stat |
| **Red J** | 2 | Gain Needle weapon |
| **10** | 4 | +1 to one stat |
| **Red 9** | 2 | Gain Shield |
| **Black 9** | 2 | XP Boost – draw bonus XP card per gain |
| **Red 8** | 2 | Currency Boost – draw bonus card for currency |
| **6, 7, Black 8** | 10 | Gain 2 black or 2 red cards between 9-K |
| **Red 4, 5** | 6 | Gain random armor |
| **2, 3, Black 4** | 10 | Gain random weapon |

## Overworld System

### Map Generation
- Cards flipped upside down on the map
- Choose adjacent cards to progress to next location (flip and move token over)
- 5 cards on level 1, +1 challenge modifier per level and realm
- 5 cards per challenge modifier
  - **Realm 1**: 5, 10, 15, 20
  - **Realm 2**: 10, 15, 20, 25
  - **Realm 3**: 15, 20, 25, 30
  - **Realm 4**: 20, 25, 30, 35

### Card Distribution
- Draw (card_count - 1) from 52 card deck (not player's deck)
- Shuffle, add joker to bottom, lay down on map with joker being last

### Card Representation
- **(4)[2]**: Bane - draw a bane card
- **(12)[3,4,5,6]**: Fight - enemy encounter
  - **3**: Power-focused enemy (sword)
  - **4**: Will-focused enemy (staff) 
  - **5**: Craft-focused enemy (random weapon: sword/staff/hammer)
  - **6**: Control-focused enemy (hammer)
- **(12)[7,8,9,10]**: Stat challenge
  - You must hit number via stat + card drawn or draw A
  - Standard challenge is to get 12 + 1 per challenge modifier
  - Gain card worth of XP in that stat per success
  - On success gain a boon, on failure gain a bane
- **(4)[J]**: Nothing - no effect
- **(4)[Q]**: Rest - player heals 50% of their max HP
- **(4)[K]**: Shop
  - Costs all +1 per challenge modifier
  - 10 currency to heal 10
  - 3 random equipment cards drawn at 25, 30, and 35 currency
  - 25 currency to remove a card from deck (draw hand size and pick one to remove or not)
- **(4)[A]**: Boon - draw a boon card
- **[Joker]**: Boss or exit

## Enemies & Bosses

### Regular Enemies
- **Base stats**: 2 of each stat + 1 core stat + randomly distributed challenge modifier values
- **Craft Mechanic**: Instead of artifacts, enemies can discard their weakest card in their hand up to their craft level
- Can only discard once per turn
- Will only discard if lowest card is under 8
- Enemies always play the highest card in their hand

#### Enemy Types by Card:
| Card | Enemy Type | Core Stat | Weapon |
|------|------------|-----------|--------|
| **3** | Power-focused | Power | Sword |
| **4** | Will-focused | Will | Staff |
| **5** | Craft-focused | Craft | Random (sword/staff/hammer) |
| **6** | Control-focused | Control | Hammer |

**Reward**: When you defeat an enemy you get a boon

### Bosses

| Realm | Boss Name | Weapon | Base Stats |
|-------|-----------|--------|------------|
| **1** | Jack of Steel | Sword | 8 |
| **2** | Queen of Blood | Staff | 10 |
| **3** | King of Ash | Hammer | 12 |
| **4** | Ace of Speed | Bow + Sword | 14 |

**Boss stats**: 2 × Challenge Modifier in all stats

#### Defeating Bosses Rewards:
- One XP card per stat
- One card's worth of currency

## Currency & Progression

### Currency System
- **No cap** on currency
- **Currency persists** between runs
- **Used in**:
  - Shops (healing, gear, card removal)
  - Home Realm upgrades

## Battle System

### Turn Structure
- Player always goes first
- Both players draw to hand limit
- Switch weapon if you want to use a different weapon (a weapon is always chosen by default)
- Select the card you would like to attack with
- If weapon dictates it's a hit, deal damage according to power
- Enemy discards their worst card if they have enough craft and a bad enough card
- Enemy selects their best card and check if it is a success
- If success and an attack, player selects a card and their best armor effect is applied to the damage
- Both players draw to their hand limit
- Repeat until player wins or loses

## Permanent Progression & Home Realm

### Persistent Elements Between Runs:
- Player currency
- Stats and XP
- Home Realm upgrades

### Home Realm Features:
- Start new or resume run
- View stats and runs
- Buy upgrades:
  - **50 currency**: +XP bonus per stat (one for each stat)
  - **100 currency**: draw 1 extra card when gaining XP for that stat (one for each stat)
  - **100 currency**: draw 1 extra card when gaining currency

### Initiating Run
- Abandons old run if one is ongoing
- Choose your starting equipment: 1 weapon, 1 armor
- Choose from unlocked realms to visit

## Game Structure & UI Pages

### Page Flow:
1. **Home Page**
   - Start Game
   - Switch Profile (if saves exist)

2. **Home Realm**
   - New Run
   - Resume Run
   - View Stats
   - Equipment & Deck

3. **Battle Page**
   - Card battle UI
   - Armor/weapon selection

4. **Event Page**
   - Challenge, Boon, or Bane resolution

5. **Shop Page**
   - Healing, item purchasing, card removal

6. **Game Over Page**
   - Run Summary
   - Return to Home Realm

7. **Profile Page**
   - Name, bio, avatar URL

8. **Stats Page**
   - Run history and performance

## Technical Specifications

### Data Sources
- **External API**: https://deckofcardsapi.com
  - For drawing/shuffling a 52-card deck
  - Used in overworld maps, combat draws, and stat challenges
- **Local JSON/Objects**: Game data such as item definitions, boons/banes, equipment stats, and enemy rules
- **Storage**:
  - `localStorage`: User profiles, game state, persistent stats, and upgrades
  - `sessionStorage`: In-run temporary state (current deck, health, etc.)

### Design System

#### Color Palette
- **Primary**: Muted purples (#2D1B69, #4A2C8F)
- **Secondary**: Blacks (#0A0A0A, #1A1A1A)
- **Accent**: Rusty gold (#D4AF37, #B8860B)
- **Background**: Dark grays (#121212, #1E1E1E)

#### Typography
- **Headings**: Cinzel (serif)
- **Body**: Cardo (serif)
- **UI Elements**: System fonts for readability

#### Animations
- Card flips and draws
- Damage flashes
- Level transitions
- UI element fades

## Game Mechanics Summary

### Core Loop
1. **Profile Selection** → Choose or create a profile
2. **Home Realm** → View stats, upgrades, start new run
3. **Overworld** → Navigate map, encounter events
4. **Combat/Events** → Battle enemies or face challenges
5. **Shop** → Purchase items, heal, or modify deck
6. **Game Over** → View results, return to realm

### Progression Systems
- **Run-based**: Individual game sessions
- **Meta-progression**: Persistent upgrades across runs
- **Stats tracking**: Lifetime achievements and statistics

### Combat System
- **Turn-based system**
- **Card-based actions**
- **Strategic decision making**
- **Health and resource management**

### Card System
- **Standard 52-card deck** integration
- **Card-based combat** and events
- **Deck modification** through shop and artifacts

---

**Deckrift – Drawn to Dust** - Where every card tells a story, and every run is a new adventure. 