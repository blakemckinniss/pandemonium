# Meta Progression System

## Overview

Cross-run persistence for unlocks and statistics. Located in `src/stores/metaStore.ts`.

## State Structure

```typescript
interface MetaState {
  // Statistics
  totalRuns: number
  totalWins: number
  totalDeaths: number
  totalEnemiesKilled: number
  totalGoldEarned: number
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
  reset: () => void
}
```

## Run Result

```typescript
interface RunResult {
  won: boolean
  floor: number
  enemiesKilled: number
  gold: number
  heroId: string
}
```

## Persistence

Uses Zustand with persist middleware:
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

## Default Unlocks

```typescript
const DEFAULT_CARDS = ['strike', 'defend', 'bash', ...]
const DEFAULT_HEROES = ['warrior']
```

## Unlock System

`checkUnlocks(result: RunResult)` evaluates conditions:

Potential unlock triggers:
- Win with specific hero
- Reach floor N
- Kill X enemies in a run
- Earn X gold total
- Complete N runs
- Win N times

## Usage

```typescript
// In game end screen
const meta = useMetaStore()

// Record completed run
meta.recordRun({
  won: true,
  floor: 15,
  enemiesKilled: 42,
  gold: 350,
  heroId: 'warrior'
})

// Check for new unlocks
const newUnlocks = checkUnlocks(runResult)
newUnlocks.forEach(cardId => meta.unlockCard(cardId))

// Check unlock status
if (meta.isCardUnlocked('fireball')) {
  // Add to card pool
}
```

## Integration Points

- `GameScreen` calls `recordRun()` on game over
- `RewardScreen` shows newly unlocked content
- `DeckBuilder` filters by `isCardUnlocked()`
- `HeroSelect` filters by `isHeroUnlocked()`
