# Selection Effects System

## Overview

Card effects that require player selection from options. Located in `src/game/selection-effects.ts`.

These pause combat and present UI for player choice.

## Selection Types

### Scry
Look at top N cards of deck, optionally reorder or discard:
```typescript
executeScry(state, { count: number }): PendingSelection
handleResolveScry(state, selectedCards): CombatState
```

### Tutor
Search deck/discard for cards matching filter:
```typescript
executeTutor(state, {
  from: 'deck' | 'discard' | 'exhaust',
  destination: 'hand' | 'deck' | 'discard',
  position?: 'top' | 'bottom' | 'shuffle',
  filter?: CardFilter,
  maxSelect: number
}): PendingSelection

handleResolveTutor(state, selectedCardUids): CombatState
```

### Transform
Change one card into another:
```typescript
executeTransform(state, {
  fromCardId?: string,   // Optional filter
  toCardId?: string      // Target card (random if not specified)
}): SelectionResult
```

### Upgrade
Upgrade selected cards (reduce cost, improve effects):
```typescript
executeUpgrade(state, { count: number }): PendingSelection
// Returns selection, player picks cards to upgrade
```

### Discover
Choose 1 of N randomly generated options:
```typescript
handleResolveDiscover(state, {
  count: number,        // Options to show (typically 3)
  filter?: CardFilter,
  destination: 'hand' | 'deck' | 'discard'
}): PendingSelection
```

### Banish
Remove cards from run permanently:
```typescript
handleResolveBanish(state, { cardUids: string[] }): CombatState
```

## Card Filter

```typescript
interface CardFilter {
  theme?: CardTheme
  element?: Element
  rarity?: Rarity
  cost?: number | { min?: number; max?: number }
}
```

## Helper

```typescript
// Check if card matches filter criteria
matchesFilter(card: CardInstance, filter: CardFilter): boolean

// Pick random card from pool matching optional filter
pickRandomCard(pool: CardDefinition[], filter?: CardFilter): CardDefinition
```

## State Integration

Selection effects set `combatState.pendingSelection`:
```typescript
interface PendingSelection {
  type: 'scry' | 'tutor' | 'upgrade' | 'discover' | 'banish'
  cards: CardInstance[]
  maxSelect: number
  minSelect?: number
  metadata?: Record<string, unknown>
}
```

UI renders selection modal, player chooses, then appropriate `handleResolve*` is called.
