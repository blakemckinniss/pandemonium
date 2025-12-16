# Meta Progression System

## Overview

Cross-run persistence for unlocks, statistics, and dungeon ownership. Split between Zustand (localStorage) and Dexie (IndexedDB).

## Storage Layers

### Zustand Store (`src/stores/metaStore.ts`)
Quick-access state in localStorage:
- Unlocks (cards, heroes)
- Statistics (runs, wins, floors)

### Dexie Database (`src/stores/db.ts`)
Larger data in IndexedDB:
- Dungeon deck definitions
- Owned dungeons tracking
- Run history

## MetaState Structure

```typescript
interface MetaState {
  // Statistics
  totalRuns: number
  totalWins: number
  highestFloor: number
  
  // Unlocks
  unlockedCards: string[]    // Card IDs
  unlockedHeroes: string[]   // Hero IDs
  
  // Actions
  recordRun: (result: RunResult) => void
  unlockCard: (cardId: string) => void
  unlockHero: (heroId: string) => void
  isCardUnlocked: (cardId: string) => boolean
  isHeroUnlocked: (heroId: string) => boolean
}
```

## Dexie Tables

```typescript
// src/stores/db.ts
class PandemoniumDB extends Dexie {
  dungeonDecks!: Table<DungeonDeckDefinition>
  ownedDungeons!: Table<OwnedDungeonDeck>
  runHistory!: Table<RunRecord>
}
```

### OwnedDungeonDeck
Tracks player's dungeon ownership:
```typescript
interface OwnedDungeonDeck {
  deckId: string
  status: 'available' | 'in_progress' | 'completed'
  attemptsCount: number
  bestFloor: number
  acquiredAt: number
  completedAt?: number
}
```

## Content Seeding

First-run initialization via `src/game/seed-content.ts`:
```typescript
await seedBaseContent()  // Creates base enemies + dungeons in IndexedDB
```

Called from MenuScreen on first load.

## Dungeon Ownership Flow

```
1. seedBaseContent() creates default dungeons in db.dungeonDecks
2. Player sees dungeons in MenuScreen
3. Selecting dungeon creates OwnedDungeonDeck with status: 'available'
4. Starting run sets status: 'in_progress'
5. Completing dungeon sets status: 'completed', records completedAt
```

## Persistence Configuration

### Zustand
```typescript
const useMetaStore = create<MetaState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'pandemonium-meta',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
```

### Dexie
```typescript
const db = new PandemoniumDB()
// Auto-persists to IndexedDB
```

## Usage

```typescript
// Zustand store
const meta = useMetaStore()
meta.recordRun({ won: true, floor: 15 })

// Dexie operations
const dungeons = await db.dungeonDecks.toArray()
await db.ownedDungeons.put({ deckId: 'dungeon_1', status: 'completed', ... })
```

## Default Content

```typescript
// Default unlocked
const DEFAULT_CARDS = ['strike', 'defend', ...]
const DEFAULT_HEROES = ['hero_ironclad']

// Base dungeons (seeded)
// - "Ember Depths" (fire theme, difficulty 1)
// - "Frozen Wastes" (ice theme, difficulty 2)
// - "Heart of Chaos" (void theme, difficulty 3, boss)
```

## Integration Points

- `MenuScreen` - Shows owned dungeons, triggers seeding
- `GameScreen` - Updates dungeon progress on room completion
- `dungeonComplete` phase - Marks dungeon as completed
- `RewardScreen` - Shows newly unlocked content
