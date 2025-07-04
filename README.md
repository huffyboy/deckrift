# Deckrift – Drawn to Dust

A deck-based roguelike browser game where players explore a cursed realm through card-based encounters. The gameplay combines traditional card mechanics with persistent RPG progression and random events, encouraging replayability and strategic decision-making.

## 🎮 Game Overview

**Deckrift – Drawn to Dust** is a fully functional deck-based roguelike browser game that features:
- **Complete gameplay loop** from profile creation to game completion
- **Strategic depth** through equipment selection and deck management
- **Progressive difficulty** with 4 unique realms and bosses
- **Persistent progression** with permanent upgrades and stats
- **Polished UI/UX** with responsive design and smooth animations
- **Robust technical architecture** with modular, maintainable code

## 🎯 Target Audience

Strategy/card game enthusiasts who enjoy:
- Roguelike progression systems
- Deck-building challenges
- Replayable, medium-complexity web games
- Progressive mechanics and persistent upgrades

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with Flexbox/Grid
- **Storage**: localStorage & sessionStorage
- **External API**: [Deck of Cards API](https://deckofcardsapi.com)
- **Typography**: Cinzel, Cardo (Google Fonts)
- **Icons**: Custom CSS + free online icons

## 📁 Project Structure

```
deckrift/
├── index.html                 # Main entry point
├── css/
│   ├── main.css              # Main stylesheet
│   ├── components.css        # UI component styles
│   └── animations.css        # CSS animations
├── js/
│   ├── main.js               # Main game controller
│   └── modules/              # Game logic modules
│       ├── gameState.js      # Game state management
│       ├── profileManager.js # Profile management
│       ├── deckManager.js    # Card operations & API
│       ├── battleLogic.js    # Combat mechanics
│       ├── eventHandler.js   # Boons, banes, events
│       ├── uiManager.js      # UI updates & screens
│       ├── equipmentData.js  # Equipment definitions
│       ├── shopSystem.js     # Shop functionality
│       ├── artifactSystem.js # Artifact management
│       └── bossSystem.js     # Boss encounters & progression
├── assets/                   # Game assets
├── DESIGN_DOCUMENT.md        # Game design specifications
├── TODO.md                   # Development tracking
├── PROJECT_COMPLETE.md       # Project completion summary
├── MODULAR_STRUCTURE.md      # Code architecture documentation
└── REFACTORING_COMPLETE.md   # Refactoring summary
```

## 🎨 Design System

### Color Palette
- **Primary**: Muted purples (#2D1B69, #4A2C8F)
- **Secondary**: Blacks (#0A0A0A, #1A1A1A)
- **Accent**: Rusty gold (#D4AF37, #B8860B)
- **Background**: Dark grays (#121212, #1E1E1E)

### Typography
- **Headings**: Cinzel (serif)
- **Body**: Cardo (serif)
- **UI Elements**: System fonts for readability

### Animations
- Card flips and draws
- Damage flashes
- Level transitions
- UI element fades

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for development)

### Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd deckrift
   ```

2. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

## 🎯 Core Features

### Game Modes
- **Profile System**: Up to 10 user profiles with persistent stats
- **Runs**: Individual game sessions with progression
- **Home Realm**: Persistent upgrades and meta-progression

### Core Systems
1. **Profile Management**: Complete profile creation, editing, deletion, and statistics tracking
2. **Deck Management**: Integration with Deck of Cards API and player deck tracking
3. **Combat System**: Turn-based battles with strategic card play and boss encounters
4. **Event System**: Random encounters, stat challenges, and boon/bane system
5. **Shop System**: Economy and upgrade mechanics with dynamic pricing
6. **Artifact System**: Special items that modify gameplay with rarity system
7. **Boss System**: 4 unique bosses with realm progression and game completion
8. **Storage System**: Persistent data across sessions with error handling
9. **Error Recovery**: Comprehensive error handling with retry logic and performance monitoring
10. **Message System**: Professional message UI with multiple types (success, error, warning, info)

### Game Flow
1. **Profile Selection** → Choose or create a profile
2. **Home Realm** → View stats, upgrades, start new run
3. **Overworld** → Navigate map, encounter events
4. **Combat/Events** → Battle enemies or face challenges
5. **Shop** → Purchase items, heal, or modify deck
6. **Boss Battles** → Defeat realm bosses to progress
7. **Game Completion** → Complete all 4 realms for victory

## 📊 Data Management

### External APIs
- **Deck of Cards API**: `https://deckofcardsapi.com`
  - Used for: Drawing cards, shuffling decks, overworld navigation
  - Endpoints: `/api/deck/new/`, `/api/deck/{deck_id}/draw/`

### Local Storage
- **localStorage**: User profiles, persistent stats, upgrades
- **sessionStorage**: Current run state, temporary data

### Data Files
- **JSON modules**: Game data, item definitions, enemy stats
- **Hardcoded objects**: Boons, banes, equipment rules

## 🎮 Game Mechanics

### Core Gameplay Loop
1. **Profile Selection** → Choose or create a profile
2. **Home Realm** → View stats, upgrades, start new run
3. **Overworld** → Navigate map, encounter events
4. **Combat/Events** → Battle enemies or face challenges
5. **Shop** → Purchase items, heal, or modify deck
6. **Boss Battles** → Defeat realm bosses to progress
7. **Game Completion** → Complete all 4 realms for victory

### Card System
- Standard 52-card deck integration via Deck of Cards API
- Card-based combat and events with strategic depth
- Deck modification through shop and artifacts
- Player deck tracking with card addition/removal

### Progression Systems
- **Run-based**: Individual game sessions with persistent upgrades
- **Meta-progression**: Permanent upgrades across runs (XP bonus, extra draws, currency boost)
- **Stats tracking**: Lifetime achievements and statistics
- **Realm progression**: 4 unique realms with increasing difficulty

### Combat System
- **Turn-based**: Strategic card-based combat
- **Weapon variety**: 6 unique weapons with different hit conditions
- **Armor system**: Damage mitigation based on card values
- **Enemy AI**: Smart card selection and craft mechanics
- **Boss encounters**: Unique boss mechanics and rewards

### Equipment & Artifacts
- **6 Weapons**: Sword, Dagger, Bow, Staff, Hammer, Needle (each with unique mechanics)
- **4 Armor Types**: Light, Medium, Heavy, Shield (different damage mitigation)
- **Artifact System**: Special items with rarity and effects
- **Equipment Selection**: Strategic starting equipment choice

## 🧪 Development

### Code Quality & Architecture
- **Modular Design**: 10 specialized modules with clear separation of concerns
- **Error Handling**: Comprehensive error recovery with retry logic and performance monitoring
- **Performance**: Memory usage tracking and load time optimization
- **User Experience**: Professional message system with multiple types (success, error, warning, info)
- **Maintainability**: Clean, well-organized code with single responsibility principle

### Technical Features
- **Local Storage**: Persistent game state and profile management
- **API Integration**: Deck of Cards API for dynamic card generation
- **Async/Await**: Proper handling of asynchronous operations
- **Error Recovery**: Graceful fallbacks for API failures
- **Responsive Design**: Mobile-friendly UI with CSS Grid and Flexbox

### Testing & Quality Assurance
- **Cross-browser Testing**: Verified across modern browsers
- **Mobile Responsive**: Optimized for mobile devices
- **Error Handling**: Comprehensive error messages and recovery
- **Performance Monitoring**: Real-time tracking of game performance
- **User Experience**: Intuitive navigation and feedback systems

## 📅 Development Status

### ✅ **Project Complete!**
All major features have been implemented and the game is fully functional:

- ✅ **Foundation & Core Systems**: Profile management, home realm, game state
- ✅ **Overworld & Navigation**: Map generation, navigation, card type system
- ✅ **Core Game Events**: Bane system, boon system, rest & shop events
- ✅ **Combat System**: Enemy generation, turn-based combat, enemy craft mechanics
- ✅ **Equipment & Artifacts**: Weapon system, armor system, artifact system
- ✅ **Advanced Features**: Stat challenges, boss system, deck management
- ✅ **Polish & Optimization**: UI/UX improvements, performance optimization, bug fixes
- ✅ **Code Quality**: Modular architecture, error handling, performance monitoring

### 🎮 **Ready to Play**
The game is now complete and ready for playtesting. All features from the original design document have been implemented with a clean, modular architecture.

### 🏗️ **Technical Architecture**
The project has been refactored into a clean, modular architecture with 10 specialized modules:

1. **main.js** - Game controller and orchestration (835 lines)
2. **gameState.js** - Persistent game data management (185 lines)
3. **profileManager.js** - Profile creation and management (80 lines)
4. **deckManager.js** - Card operations and deck management (160 lines)
5. **battleLogic.js** - Combat mechanics and enemy AI (234 lines)
6. **eventHandler.js** - Boon/bane system and event processing (315 lines)
7. **uiManager.js** - Screen management and UI updates (549 lines)
8. **shopSystem.js** - Shop mechanics and transactions (132 lines)
9. **artifactSystem.js** - Artifact inventory and effects (133 lines)
10. **bossSystem.js** - Boss encounters and progression (120 lines)
11. **equipmentData.js** - Equipment definitions and data (205 lines)

### 📚 **Documentation**
- **DESIGN_DOCUMENT.md**: Complete game design specifications
- **IMPROVEMENTS_SUMMARY.md**: Detailed summary of code improvements and enhancements

## 🤝 Contributing

This is a solo project for educational purposes, but suggestions and feedback are welcome!

## 📝 License

This project is created for educational purposes.

## 🐛 Known Issues

- None currently documented

## 🔮 Future Enhancement Opportunities

### Potential Additions
- **Sound Effects & Music**: Audio feedback for actions and atmospheric background music
- **Achievement System**: Unlockable achievements and milestones
- **Leaderboards**: Competitive scoring system
- **Additional Content**: More artifacts, equipment, and events
- **Multiplayer**: Cooperative or competitive multiplayer modes
- **Progressive Web App**: Offline capabilities and app-like features

### Performance Optimizations
- **Advanced Caching**: Intelligent caching for better performance
- **Service Worker**: Add offline capabilities and caching
- **Web Workers**: Move heavy computations to background threads
- **Asset Optimization**: Compress and optimize game assets

### Accessibility & Internationalization
- **Enhanced Accessibility**: Features for broader user base
- **Multi-language Support**: Internationalization for global audience
- **Analytics Integration**: Track user behavior and game performance

## 🎉 Project Summary

**Deckrift – Drawn to Dust** is a complete, polished, and fully functional deck-based roguelike game that successfully combines traditional card mechanics with persistent RPG progression and random events. The game offers:

- **Complete gameplay loop** from profile creation to game completion
- **Strategic depth** through equipment selection and deck management
- **Progressive difficulty** with 4 unique realms and bosses
- **Persistent progression** with permanent upgrades and stats
- **Polished UI/UX** with responsive design and smooth animations
- **Robust technical architecture** with modular, maintainable code
- **Professional-grade features** including error handling, performance monitoring, and enhanced user experience

The game is ready for playtesting and can serve as a solid foundation for future enhancements and expansions.

---

**Deckrift – Drawn to Dust** - Where every card tells a story, and every run is a new adventure. 🃏✨ 