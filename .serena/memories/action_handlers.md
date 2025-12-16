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
├── enemy.ts     # Enemy AI/intents/abilities
├── damage.ts    # Damage calculation
├── energy.ts    # Energy management
├── rooms.ts     # Room transitions
└── hero.ts      # Hero ability handlers
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

// hero.ts
export function handleUseActivatedAbility(state) { ... }
export function handleUseUltimateAbility(state) { ... }
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
      case 'useActivatedAbility': return handleUseActivatedAbility(draft)
      case 'useUltimateAbility': return handleUseUltimateAbility(draft)
      // ...
    }
  })
}
```

## Handler Domains

### Combat (`combat.ts`)
- `startCombat` - Initialize combat, apply hero passive, enemy innate status
- `endCombat` - Cleanup, trigger rewards

### Cards (`cards.ts`)
- `playCard` - Validate, pay cost, execute effects
- `drawCards` - Move from deck to hand
- `discardCard` - Move to discard
- `exhaustCard` - Remove from combat

### Turns (`turns.ts`)
- `startTurn` - Draw cards, refresh energy, trigger powers, charge ultimate
- `endTurn` - Discard hand, enemy turns, decay powers

### Enemy (`enemy.ts`)
- `enemyTurn` - Execute enemy intent
- `selectIntent` - Choose next intent based on pattern
- `executeEnemyAbility` - Run enemy ability if conditions met
- `checkEnemyUltimate` - Trigger ultimate if threshold reached

### Damage (`damage.ts`)
- `takeDamage` - Apply damage with modifiers (element, resist, vuln)
- `dealDamage` - Calculate and apply damage
- Block absorption, piercing, elemental combos

### Energy (`energy.ts`)
- `spendEnergy` - Reduce energy
- `gainEnergy` - Add energy
- `refreshEnergy` - Reset to max

### Rooms (`rooms.ts`)
- `enterRoom` - Room setup based on type
- `completeRoom` - Trigger rewards/transitions

### Hero (`hero.ts`)
- `canUseActivatedAbility` - Check energy + once-per-turn
- `handleUseActivatedAbility` - Spend energy, execute effects
- `canUseUltimateAbility` - Check if charged
- `handleUseUltimateAbility` - Reset charges, execute effects

## Shared Utilities (`shared.ts`)

```typescript
// Find entity by ID
getEntity(state, entityId): Entity | undefined

// Check if action is valid
canPlayCard(state, cardUid): boolean

// Get valid targets for card
getValidTargets(state, card): Entity[]

// Get card definition from instance
getCardDef(cardInstance): CardDefinition
```

## Enemy AI System

Enemies have:
1. **Intent Pattern** - Sequence of basic intents (attack/defend/buff)
2. **Ability** - Special move with cooldown and conditions
3. **Ultimate** - Powerful move triggered by health/turn threshold

```typescript
// Intent selection
const intent = getNextIntent(enemy, pattern)

// Ability check
if (canUseAbility(enemy, ability)) {
  executeAbility(state, enemy, ability)
}

// Ultimate check
if (shouldTriggerUltimate(enemy, ultimate)) {
  executeUltimate(state, enemy, ultimate)
}
```
