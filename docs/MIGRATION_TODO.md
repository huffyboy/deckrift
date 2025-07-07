# Migration to Multi-Page Application

## Overview

This document outlines the migration from the current Single-Page Application (SPA) architecture to a proper multi-page application using Express.js and EJS templates.

## Current Issues

### Problems with Current SPA Approach:

- ❌ Complex screen management with CSS transitions
- ❌ Mixed client/server state management
- ❌ Difficult debugging and navigation
- ❌ Unnecessary JavaScript complexity
- ❌ Poor separation of concerns
- ❌ Hard to maintain and extend

### Benefits of Multi-Page Approach:

- ✅ Clear page separation and navigation
- ✅ Standard browser back/forward functionality
- ✅ Easier debugging and development
- ✅ Better SEO and accessibility
- ✅ Simpler state management
- ✅ Faster initial page loads

## Page Structure (From Design Document)

### 1. **Home Page** (`/`)

- **Purpose**: Landing page, authentication, profile selection
- **Features**:
  - Welcome message
  - Login/Register forms
  - Profile selection (if saves exist)
  - Start Game button
- **Template**: `views/index.ejs` (already exists)
- **Route**: `routes/index.js` (already exists)

### 2. **Home Realm** (`/home-realm`)

- **Purpose**: Main hub for game progression
- **Features**:
  - New Run button
  - Resume Run button (if active run exists)
  - View Stats link
  - Equipment & Deck management
  - Permanent upgrades purchase
  - Realm selection for new runs
- **Template**: `views/home-realm.ejs` (needs creation)
- **Route**: `routes/home-realm.js` (needs creation)

### 3. **Game Page** (`/game`)

- **Purpose**: Main game interface with dynamic content
- **Features**:
  - Overworld map navigation
  - Battle interface
  - Event resolution
  - Shop interface
  - All game logic and state
- **Template**: `views/game.ejs` (needs creation)
- **Route**: `routes/game.js` (needs creation)

### 4. **Battle Page** (`/battle`)

- **Purpose**: Dedicated battle interface
- **Features**:
  - Card battle UI
  - Armor/weapon selection
  - Turn-based combat
  - Battle log
- **Template**: `views/battle.ejs` (needs creation)
- **Route**: `routes/battle.js` (needs creation)

### 5. **Event Page** (`/event`)

- **Purpose**: Challenge, Boon, or Bane resolution
- **Features**:
  - Stat challenges
  - Boon selection
  - Bane consequences
  - Card drawing interface
- **Template**: `views/event.ejs` (needs creation)
- **Route**: `routes/event.js` (needs creation)

### 6. **Shop Page** (`/shop`)

- **Purpose**: Healing, item purchasing, card removal
- **Features**:
  - Healing options
  - Equipment purchase
  - Card removal
  - Currency management
- **Template**: `views/shop.ejs` (needs creation)
- **Route**: `routes/shop.js` (needs creation)

### 7. **Game Over Page** (`/game-over`)

- **Purpose**: Run summary and return to home realm
- **Features**:
  - Run statistics
  - Achievements earned
  - Return to Home Realm button
  - New Run option
- **Template**: `views/game-over.ejs` (needs creation)
- **Route**: `routes/game-over.js` (needs creation)

### 8. **Profile Page** (`/profile`)

- **Purpose**: Profile management
- **Features**:
  - Name, bio, avatar URL
  - Profile creation/editing
  - Profile deletion
- **Template**: `views/profile.ejs` (already exists)
- **Route**: `routes/auth.js` (already exists)

### 9. **Stats Page** (`/stats`)

- **Purpose**: Run history and performance
- **Features**:
  - Lifetime statistics
  - Run history
  - Achievement tracking
  - Performance metrics
- **Template**: `views/stats.ejs` (needs creation)
- **Route**: `routes/stats.js` (needs creation)

## Migration Tasks

### Phase 1: Route Structure

- [x] Create new route files for each page
- [x] Update `server.js` to include new routes
- [x] Implement proper middleware for authentication
- [x] Add session management for game state

### Phase 2: Template Creation

- [x] Create `views/home-realm.ejs`
- [x] Create `views/game.ejs`
- [x] Create `views/battle.ejs`
- [x] Create `views/event.ejs`
- [x] Create `views/shop.ejs`
- [x] Create `views/game-over.ejs`
- [x] Create `views/stats.ejs`
- [x] Update existing templates for consistency

### Phase 3: JavaScript Refactoring

- [x] Remove complex screen management from `main.js`
- [x] Split game logic into page-specific modules
- [x] Simplify state management
- [x] Remove UIManager screen switching logic
- [x] Create page-specific JavaScript files

### Phase 4: State Management

- [x] Implement server-side session storage
- [x] Create API endpoints for game state
- [x] Simplify client-side state management
- [x] Remove localStorage dependency for game state

### Phase 5: Navigation & Links

- [x] Update all internal links to use proper routes
- [x] Implement proper form submissions
- [x] Add navigation breadcrumbs
- [x] Ensure proper back/forward functionality

## File Structure Changes

### New Files to Create:

```
src/
├── routes/
│   ├── home-realm.js
│   ├── game.js
│   ├── battle.js
│   ├── event.js
│   ├── shop.js
│   ├── game-over.js
│   └── stats.js
├── views/
│   ├── home-realm.ejs
│   ├── game.ejs
│   ├── battle.ejs
│   ├── event.ejs
│   ├── shop.ejs
│   ├── game-over.ejs
│   └── stats.ejs
└── public/js/
    ├── home-realm.js
    ├── game.js
    ├── battle.js
    ├── event.js
    ├── shop.js
    └── stats.js
```

### Files to Modify:

- [x] `src/server.js` - Add new routes
- [x] `src/routes/index.js` - Update navigation
- [x] `src/public/js/main.js` - Remove screen management
- [x] `src/public/js/modules/uiManager.js` - Simplify or remove
- [x] `src/public/index.html` - Remove or simplify

### Files to Remove:

- [x] Complex screen management logic
- [x] UIManager showScreen methods
- [x] CSS transitions for screen switching

## Implementation Priority

### High Priority (Core Functionality):

1. **Home Realm page** - Main game hub
2. **Game page** - Core game interface
3. **Battle page** - Combat system
4. **Event page** - Challenge resolution

### Medium Priority (User Experience):

1. **Shop page** - Item purchasing
2. **Stats page** - Progress tracking
3. **Game Over page** - Run completion

### Low Priority (Polish):

1. **Profile page** - Already exists
2. **Navigation improvements**
3. **Error handling**

## Technical Considerations

### Session Management:

- Use Express sessions for user authentication
- Store game state in session for active runs
- Implement proper session cleanup

### API Endpoints:

- Create RESTful API for game actions
- Separate data endpoints from page routes
- Implement proper error handling

### State Persistence:

- Keep persistent data in database
- Use sessions for temporary game state
- Implement proper state transitions

### Security:

- Validate all user inputs
- Implement CSRF protection
- Secure session management

## Testing Strategy

### Unit Tests:

- [ ] Route functionality
- [ ] Game logic modules
- [ ] State management

### Integration Tests:

- [ ] Page navigation
- [ ] Game flow
- [ ] Session management

### User Acceptance Tests:

- [ ] Complete game runs
- [ ] Profile management
- [ ] Statistics tracking

## Rollback Plan

If issues arise during migration:

1. Keep current SPA version as backup
2. Implement changes incrementally
3. Test each page independently
4. Maintain database compatibility

## Success Criteria

- [ ] All pages load independently
- [ ] Navigation works with browser back/forward
- [ ] Game state persists across page loads
- [ ] No complex screen management required
- [ ] Easier debugging and development
- [ ] Better user experience

## Timeline Estimate

- **Phase 1-2**: 2-3 days (Route and template structure)
- **Phase 3**: 3-4 days (JavaScript refactoring)
- **Phase 4**: 2-3 days (State management)
- **Phase 5**: 1-2 days (Navigation and testing)

**Total Estimated Time**: 8-12 days

---

_This migration will significantly improve the codebase maintainability and user experience while following web development best practices._
