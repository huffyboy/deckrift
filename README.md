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

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS templating engine with vanilla JavaScript
- **Styling**: CSS3 with Flexbox/Grid
- **Session Management**: Express-session with MongoDB store
- **Authentication**: bcryptjs for password hashing
- **External API**: [Deck of Cards API](https://deckofcardsapi.com)
- **Typography**: Cinzel, Cardo (Google Fonts)
- **Icons**: Custom CSS + free online icons
- **Development**: Nodemon for hot reloading, ESLint for code quality

## 📁 Project Structure

```
deckrift/
├── src/
│   ├── server.js                 # Main server entry point
│   ├── config/
│   │   ├── database.js           # MongoDB connection
│   │   └── logger.js             # Winston logging setup
│   ├── controllers/
│   │   ├── apiController.js      # API endpoints
│   │   ├── authController.js     # Authentication logic
│   │   └── gameController.js     # Game state management
│   ├── middlewares/
│   │   ├── auth.js               # Authentication middleware
│   │   ├── errorHandler.js       # Error handling
│   │   └── simpleLogger.js       # Request logging
│   ├── models/
│   │   ├── GameSave.js           # Game save data model
│   │   ├── Profile.js            # User profile model
│   │   ├── Statistics.js         # Game statistics model
│   │   └── User.js               # User account model
│   ├── public/
│   │   ├── css/                  # Stylesheets
│   │   ├── js/                   # Client-side JavaScript
│   │   │   ├── modules/          # Modular game logic
│   │   │   ├── main.js           # Main game controller
│   │   │   ├── game.js           # Game interface
│   │   │   ├── battle.js         # Battle system
│   │   │   └── event.js          # Event system
│   │   └── assets/               # Game assets
│   ├── routes/
│   │   ├── index.js              # Main routes
│   │   ├── auth.js               # Authentication routes
│   │   ├── game.js               # Game routes
│   │   ├── battle.js             # Battle routes
│   │   ├── event.js              # Event routes
│   │   ├── shop.js               # Shop routes
│   │   └── stats.js              # Statistics routes
│   ├── services/
│   │   └── gameUtils.js          # Game utility functions
│   └── views/
│       ├── layouts/
│       │   └── main.ejs          # Main layout template
│       ├── partials/
│       │   ├── header.ejs        # Header component
│       │   └── footer.ejs        # Footer component
│       ├── auth/
│       │   ├── login.ejs         # Login page
│       │   └── register.ejs      # Registration page
│       ├── game.ejs              # Main game interface
│       ├── battle.ejs            # Battle interface
│       ├── event.ejs             # Event interface
│       ├── shop.ejs              # Shop interface
│       └── errors/
│           ├── 404.ejs           # 404 error page
│           └── error.ejs         # Error page
├── docs/
│   └── DESIGN_DOCUMENT.md        # Complete game design specifications
├── tests/
│   └── basic-test.js             # Basic test suite
├── package.json                   # Dependencies and scripts
└── README.md                     # This file
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

- Node.js (>=18.0.0)
- MongoDB (local or cloud instance)
- Modern web browser

## 🎯 Core Features

### Game Modes

- **Profile System**: User accounts with persistent stats
- **Runs**: Individual game sessions with progression
- **Home Realm**: Persistent upgrades and meta-progression

### Core Systems

1. **Authentication System**: User registration, login, and session management
2. **Profile Management**: Complete profile creation, editing, deletion, and statistics tracking
3. **Deck Management**: Integration with Deck of Cards API and player deck tracking
4. **Combat System**: Turn-based battles with strategic card play and boss encounters
5. **Event System**: Random encounters, stat challenges, and boon/bane system
6. **Shop System**: Economy and upgrade mechanics with dynamic pricing
7. **Artifact System**: Special items that modify gameplay with rarity system
8. **Boss System**: 4 unique bosses with realm progression and game completion
9. **Storage System**: Persistent data across sessions with MongoDB
10. **Error Recovery**: Comprehensive error handling with retry logic and performance monitoring
11. **Message System**: Professional message UI with multiple types (success, error, warning, info)

### Game Flow

1. **Authentication** → Register or login
2. **Profile Selection** → Choose or create a profile
3. **Home Realm** → View stats, upgrades, start new run
4. **Overworld** → Navigate map, encounter events
5. **Combat/Events** → Battle enemies or face challenges
6. **Shop** → Purchase items, heal, or modify deck
7. **Boss Battles** → Defeat realm bosses to progress
8. **Game Completion** → Complete all 4 realms for victory

## 📊 Data Management

### External APIs

- **Deck of Cards API**: `https://deckofcardsapi.com`
  - Used for: Drawing cards, shuffling decks, overworld navigation
  - Endpoints: `/api/deck/new/`, `/api/deck/{deck_id}/draw/`

### Database Schema

- **Users**: Account information and authentication
- **Profiles**: Player profiles with persistent stats
- **GameSaves**: Active game sessions and state
- **Statistics**: Lifetime achievements and performance tracking

### Data Files

- **JSON modules**: Game data, item definitions, enemy stats
- **Hardcoded objects**: Boons, banes, equipment rules

## 🎮 Game Mechanics

### Core Gameplay Loop

1. **Authentication** → Register or login
2. **Profile Selection** → Choose or create a profile
3. **Home Realm** → View stats, upgrades, start new run
4. **Overworld** → Navigate map, encounter events
5. **Combat/Events** → Battle enemies or face challenges
6. **Shop** → Purchase items, heal, or modify deck
7. **Boss Battles** → Defeat realm bosses to progress
8. **Game Completion** → Complete all 4 realms for victory

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

- **Modular Design**: Specialized modules with clear separation of concerns
- **Error Handling**: Comprehensive error recovery with retry logic and performance monitoring
- **Performance**: Memory usage tracking and load time optimization
- **User Experience**: Professional message system with multiple types (success, error, warning, info)
- **Maintainability**: Clean, well-organized code with single responsibility principle

### Technical Features

- **MongoDB Integration**: Persistent game state and profile management
- **Session Management**: Secure user sessions with MongoDB store
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

- ✅ **Foundation & Core Systems**: Authentication, profile management, home realm, game state
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

The project has been built as a full-stack Node.js application with:

- **Express.js**: Web framework for routing and middleware
- **MongoDB**: Database for persistent data storage
- **EJS**: Templating engine for server-side rendering
- **Session Management**: Secure user sessions with MongoDB store
- **Modular Design**: Clean separation of concerns across routes, controllers, and models

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

- **Complete gameplay loop** from authentication to game completion
- **Strategic depth** through equipment selection and deck management
- **Progressive difficulty** with 4 unique realms and bosses
- **Persistent progression** with permanent upgrades and stats
- **Polished UI/UX** with responsive design and smooth animations
- **Robust technical architecture** with modular, maintainable code
- **Professional-grade features** including error handling, performance monitoring, and enhanced user experience

The game is ready for playtesting and can serve as a solid foundation for future enhancements and expansions.

---

**Deckrift – Drawn to Dust** - Where every card tells a story, and every run is a new adventure. 🃏✨
