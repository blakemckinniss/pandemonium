# Screens & Game Phases

## Overview

Game screens mapped to `GamePhase` values. Located in `src/components/screens/`.

## Game Phases

```typescript
type GamePhase = 
  | 'menu'        // Main menu
  | 'roomSelect'  // Choose next room
  | 'combat'      // Active combat
  | 'reward'      // Post-combat rewards
  | 'campfire'    // Rest site
  | 'treasure'    // Treasure room
  | 'gameOver'    // Run ended (win/loss)
```

## Screen Components

### MenuScreen (`menu`)

Main menu with options:
- New Game (starts run)
- Continue (if saved run exists)
- Settings
- Stats (view meta-progression)

### RoomSelect (`roomSelect`)

Choose next room from dungeon deck.

**Location:** `src/components/DungeonDeck/RoomSelect.tsx`

**Shows:**
- 3 room cards to choose from
- Room type icons (combat/elite/boss/rest/treasure)
- Floor counter

### GameScreen (`combat`)

Main combat interface.

**Sub-components:**
- `Field` - Player and enemy entities
- `Hand` - Player's cards
- `CombatNumbers` - Floating damage/heal numbers
- `RelicBar` - Active relics
- `ParticleEffects` - Visual effects
- `CardAnimationOverlay` - Card movement animations

**Overlays:**
- Victory overlay (when all enemies dead)
- Defeat overlay (when player HP ≤ 0)
- Selection modal (for scry/tutor/discover)

### RewardScreen (`reward`)

Post-combat rewards.

**Reward types:**
- Gold (always)
- Card choice (3 options)
- Relic (sometimes, based on room type)
- Potion (sometimes)

**Hook:** `useRewardHandlers`

### CampfireScreen (`campfire`)

Rest site options.

**Actions:**
- Rest - Heal 30% max HP
- Upgrade - Upgrade one card
- Recall - Retrieve exhausted card (if relic)

**Hook:** `useCampfireHandlers`

### TreasureScreen (`treasure`)

Treasure room rewards.

**Contents:**
- Guaranteed relic
- Gold
- Optional card

**Hook:** `useTreasureHandlers`

### DeckBuilderScreen

View/manage deck (accessible from pause menu).

**Features:**
- View all cards
- Sort by cost/type/name
- Card preview on hover

## Phase Transitions

```
menu → roomSelect → [room type] → reward/next phase

Room type routing:
- combat/elite/boss → GameScreen → RewardScreen
- campfire → CampfireScreen → roomSelect
- treasure → TreasureScreen → roomSelect

Win condition: Defeat final boss
Loss condition: Player HP reaches 0
```

## State Management

Phase stored in `runState.gamePhase`.

Transition via:
```typescript
setRunState(prev => ({ ...prev, gamePhase: 'reward' }))
```

Or through actions in handlers that update phase as side effect.

## Adding New Screens

1. Create component in `src/components/screens/`
2. Add phase to `GamePhase` type in `src/types/index.ts`
3. Add route in `App.tsx` switch statement
4. Create handler hook if logic is complex
5. Define transitions to/from new phase
