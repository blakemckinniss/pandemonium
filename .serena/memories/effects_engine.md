# Effects Engine

## Overview

Modular effect execution system. Located in `src/game/effects/`.

## Architecture

```
src/game/effects/
├── index.ts          # Exports all effect handlers
├── engine.ts         # Core executeEffect dispatcher + power triggers
├── card-effects.ts   # Basic card effects (damage, block, draw)
├── combat-effects.ts # Combat flow (heal, energy, cards, gold)
├── control-effects.ts # Flow control (conditional, repeat, sequence)
└── power-effects.ts  # Power/buff manipulation
```

## Core Engine (`engine.ts`)

```typescript
// Main dispatcher - routes effect to appropriate handler
executeEffect(state: CombatState, effect: AtomicEffect, context: EffectContext): CombatState

// Execute power triggers on game events
executePowerTriggers(state: CombatState, event: PowerTrigger, entityId: string): CombatState
```

## Effect Context

```typescript
interface EffectContext {
  source: string           // Entity ID that caused effect
  cardUid?: string         // Card instance UID if from card
  cardTarget?: string      // Selected target for card
  currentTarget?: string   // Current target in forEach loops
  powerId?: string         // Power ID if from power trigger
  powerStacks?: number     // Power stacks for scaling
}
```

## Effect Categories

### Card Effects (`card-effects.ts`)
| Effect | Description |
|--------|-------------|
| `damage` | Deal damage to target (supports element, piercing) |
| `block` | Gain block (supports persistent) |
| `draw` | Draw cards from deck |
| `discard` | Discard cards from hand |
| `exhaust` | Exhaust cards (remove for combat) |
| `destroyBlock` | Remove block from target |

### Combat Effects (`combat-effects.ts`)
| Effect | Description |
|--------|-------------|
| `heal` | Restore HP (supports canOverheal) |
| `energy` | Add/set energy |
| `gold` | Gain/lose gold |
| `maxHealth` | Modify max HP |
| `setHealth` | Set HP to specific value |
| `addCard` | Create card in hand/deck/discard |
| `copyCard` | Duplicate a card |
| `putOnDeck` | Move card to top/bottom of deck |
| `shuffle` | Shuffle pile into deck |
| `lifesteal` | Damage + heal ratio |
| `playTopCard` | Auto-play from pile |
| `replayCard` | Play card again |

### Control Effects (`control-effects.ts`)
| Effect | Description |
|--------|-------------|
| `conditional` | If/then/else based on Condition |
| `repeat` | Execute effect N times |
| `sequence` | Execute effects in order |
| `random` | Pick random effect (supports weights) |
| `forEach` | Apply to each matching target |

### Power Effects (`power-effects.ts`)
| Effect | Description |
|--------|-------------|
| `applyPower` | Add/stack power on entity |
| `removePower` | Remove power stacks |
| `transferPower` | Move power between entities |

### Selection Effects (handled in `selection-effects.ts`)
| Effect | Description |
|--------|-------------|
| `scry` | Look at top N, reorder/discard |
| `tutor` | Search pile for cards |
| `discover` | Choose from random options |
| `banish` | Remove cards permanently |
| `transform` | Change card to another |
| `upgrade` | Upgrade selected cards |
| `modifyCost` | Change card energy cost |
| `retain` | Keep card in hand at turn end |

## Dynamic Values

Effects support dynamic value calculation:

```typescript
type EffectValue = 
  | number                    // Fixed value
  | { type: 'fixed'; value: number }
  | { type: 'scaled'; source: ScalingSource; base: number; perUnit: number; max?: number }
  | { type: 'range'; min: number; max: number }
  | { type: 'powerAmount' }   // Use current power stacks
```

### Scaling Sources
```typescript
type ScalingSource = 
  | 'cardsInHand' | 'cardsInDeck' | 'cardsInDiscard' | 'cardsExhausted'
  | 'enemyCount' | 'turn' | 'energySpent' | 'block' | 'missingHealth'
  | 'powerStacks'
```

## Execution Flow

1. Card played → `applyAction({ type: 'playCard', ... })`
2. Handler in `cards.ts` calls `executeEffect()` for each card effect
3. `executeEffect()` dispatches to category handler based on `effect.type`
4. Handler mutates state via Immer draft
5. Power triggers checked after damage/heal/etc.
6. Returns final state

## Power Triggers

```typescript
type PowerTrigger = 
  | 'onTurnStart' | 'onTurnEnd'
  | 'onAttack' | 'onAttacked'
  | 'onBlock' | 'onBlocked'
  | 'onCardPlayed' | 'onDeath'
  | 'onHeal' | 'onKill'
```

## Adding New Effects

1. Add effect interface to `types/index.ts`
2. Add to `AtomicEffect` union type
3. Add handler case to appropriate category file in `effects/`
4. Effect automatically available in cards/powers/relics
