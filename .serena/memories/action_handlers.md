# Action Handlers

## Overview

Modular action processing split by domain. Located in `src/game/handlers/`.

## Architecture

```
src/game/handlers/
├── index.ts     # Exports combined handler
├── shared.ts    # Shared utilities
├── combat.ts    # Combat lifecycle
├── cards.ts     # Card play/manipulation
├── turns.ts     # Turn flow
├── enemy.ts     # Enemy AI/intents
├── damage.ts    # Damage calculation
├── energy.ts    # Energy management
├── rooms.ts     # Room transitions
├── hero.ts      # Hero ability handlers
```

## Handler Pattern

Each file exports functions handling related actions:

```typescript
// combat.ts
export function handleStartCombat(state, action) { ... }
export function handleEndCombat(state, action) { ... }

// turns.ts
export function handleStartTurn(state, action) { ... }
export function handleEndTurn(state, action) { ... }

// cards.ts
export function handlePlayCard(state, action) { ... }
export function handleDrawCards(state, action) { ... }
export function handleDiscardCard(state, action) { ... }
```

## Main Dispatcher

`actions.ts` imports handlers and routes:

```typescript
export function applyAction(state: CombatState, action: GameAction): CombatState {
  return produce(state, draft => {
    switch (action.type) {
      case 'startCombat': return handleStartCombat(draft, action)
      case 'playCard': return handlePlayCard(draft, action)
      case 'endTurn': return handleEndTurn(draft, action)
      // ...
    }
  })
}
```

## Handler Domains

### Combat (`combat.ts`)
- `startCombat` - Initialize combat state
- `endCombat` - Cleanup, trigger rewards

### Cards (`cards.ts`)
- `playCard` - Validate, pay cost, execute effects
- `drawCards` - Move from deck to hand
- `discardCard` - Move to discard
- `exhaustCard` - Remove from combat

### Turns (`turns.ts`)
- `startTurn` - Draw cards, refresh energy, trigger powers
- `endTurn` - Discard hand, enemy turns, decay powers

### Enemy (`enemy.ts`)
- `enemyTurn` - Execute enemy intent
- `selectIntent` - Choose next intent based on AI

### Damage (`damage.ts`)
- `takeDamage` - Apply damage with modifiers
- `dealDamage` - Calculate and apply damage

### Energy (`energy.ts`)
- `spendEnergy` - Reduce energy
- `gainEnergy` - Add energy
- `refreshEnergy` - Reset to max

### Rooms (`rooms.ts`)
- `enterRoom` - Room setup
- `completeRoom` - Trigger rewards/transitions

## Shared Utilities (`shared.ts`)

```typescript
// Find entity by ID
getEntity(state, entityId): Entity | undefined

// Check if action is valid
canPlayCard(state, cardUid): boolean

// Get valid targets for card
getValidTargets(state, card): Entity[]
```
