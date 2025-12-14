# Effects Engine

## Overview

Modular effect execution system. Located in `src/game/effects/`.

## Architecture

```
src/game/effects/
├── index.ts          # Exports all effect handlers
├── engine.ts         # Core executeEffect dispatcher
├── card-effects.ts   # Basic card effects (damage, block, draw)
├── combat-effects.ts # Combat flow (heal, energy, status)
├── control-effects.ts # Flow control (conditional, repeat, sequence)
├── power-effects.ts  # Power/buff manipulation
```

## Core Engine (`engine.ts`)

```typescript
// Main dispatcher - routes effect to appropriate handler
executeEffect(state: CombatState, effect: AtomicEffect, context: EffectContext): CombatState

// Execute power triggers on game events
executePowerTriggers(state: CombatState, event: TriggerEvent): CombatState
```

## Effect Categories

### Card Effects (`card-effects.ts`)
- `damage` - Deal damage to target
- `block` - Gain block
- `draw` - Draw cards
- `discard` - Discard cards
- `exhaust` - Exhaust cards (remove for combat)

### Combat Effects (`combat-effects.ts`)
- `heal` - Restore HP
- `gainEnergy` - Add energy
- `loseEnergy` - Remove energy
- `addCardToHand` - Create card in hand
- `addCardToDeck` - Add to deck
- `addCardToDiscard` - Add to discard

### Control Effects (`control-effects.ts`)
- `conditional` - If/then/else logic
- `repeat` - Execute effect N times
- `sequence` - Execute effects in order
- `random` - Pick random effect from list
- `forEach` - Apply to each target

### Power Effects (`power-effects.ts`)
- `applyPower` - Add/stack power on entity
- `removePower` - Remove power from entity
- `modifyPower` - Change power amount
- `transferPower` - Move power between entities

## Effect Context

```typescript
interface EffectContext {
  sourceId: string      // Who initiated (player/card)
  targetId?: string     // Primary target
  cardInstance?: CardInstance
  triggerEvent?: TriggerEvent
}
```

## Execution Flow

1. Card played → `applyAction({ type: 'playCard', ... })`
2. Action handler calls `executeEffect()` for each card effect
3. `executeEffect()` dispatches to category handler
4. Handler mutates state via Immer draft
5. Power triggers checked after each effect
6. Returns final state

## Adding Effects

1. Add effect type to `AtomicEffect` union in `types/index.ts`
2. Add handler case to appropriate category file
3. Effect automatically available in cards/powers
