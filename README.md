# Deckrift – Drawn to Dust

A deck-based roguelike browser game built with Node.js, Express, MongoDB, and vanilla JavaScript. Players explore realms through card-based encounters with persistent RPG progression.

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Frontend**: EJS templating, vanilla JavaScript, CSS3
- **Authentication**: bcryptjs, express-session with MongoDB store
- **External API**: Deck of Cards API for card generation
- **Development**: ESLint, Prettier, Nodemon

## Project Structure

```
deckrift/
├── src/
│   ├── server.js                 # Main server entry point
│   ├── config/                   # Database and logging configuration
│   ├── controllers/              # Business logic (auth, game state)
│   ├── middlewares/              # Authentication, error handling, logging
│   ├── models/                   # MongoDB schemas (User, Save)
│   ├── public/                   # Static assets (CSS, JS, images)
│   ├── routes/                   # Express route handlers
│   ├── services/                 # Database operations, game utilities
│   ├── shared/                   # Shared constants and utilities
│   └── views/                    # EJS templates
├── docs/                         # Design documentation
└── package.json
```

## Installation & Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**
   Create `.env` file:

   ```env
   MONGODB_URI=mongodb://localhost:27017/deckrift
   SESSION_SECRET=your-secret-key
   PORT=3000
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Core Features Implemented

### Game Systems

- **Authentication**: User registration/login with session management
- **Profile Management**: Create, edit, delete profiles with persistent stats
- **Deck Management**: Integration with Deck of Cards API
- **Combat System**: Turn-based battles with 6 weapon types and 4 armor types
- **Event System**: Random encounters, stat challenges, boons/banes
- **Shop System**: Economy with dynamic pricing and upgrades
- **Artifact System**: Special items with rarity and effects
- **Boss System**: 4 unique bosses with realm progression
- **Save System**: Persistent game state with MongoDB

### Technical Implementation

- **Modular Architecture**: Clean separation of concerns across routes, controllers, models
- **Error Handling**: Comprehensive error recovery with retry logic
- **Session Management**: Secure user sessions with MongoDB store
- **API Integration**: External card API with graceful fallbacks
- **Responsive Design**: Mobile-friendly UI with CSS Grid/Flexbox
- **Performance Monitoring**: Real-time tracking and optimization

## Game Mechanics

### Player Attributes

- **Power**: +1 damage per point
- **Will**: +10 max HP per point
- **Craft**: Equipment/artifact capacity
- **Focus**: Hand size (cards per round)

### Combat System

- Turn-based card combat
- 6 unique weapons with different hit conditions
- 4 armor types with varying damage mitigation
- Enemy AI with strategic card selection

### Progression

- Run-based sessions with persistent upgrades
- Meta-progression across runs (XP bonus, extra draws, currency boost)
- 4 realms with increasing difficulty
- Lifetime statistics tracking

## Development Commands

- `npm start` - Production server
- `npm run dev` - Development with hot reload
- `npm run lint` - Code quality check
- `npm run test` - Run test suite
- `npm run clean` - Format and lint code

## Database Schema

- **Users**: Account authentication data
- **Profiles**: Player profiles with persistent stats
- **GameSaves**: Active game sessions and state
- **Sessions**: User session management

## External Dependencies

- **Deck of Cards API**: Card generation and deck management
- **MongoDB**: Persistent data storage
- **Express-session**: Session management
- **bcryptjs**: Password hashing

## Project Status

✅ **Complete** - All features from design document implemented

- Full authentication and profile system
- Complete game loop with combat, events, shop
- Boss system with 4 unique encounters
- Persistent progression and save system
- Responsive UI with error handling
- Modular, maintainable codebase

## License

Educational project - created for class assignment.
