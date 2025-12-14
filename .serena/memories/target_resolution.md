# Target Resolution & Conditions

## Overview

Utilities for resolving effect targets and evaluating conditions. Located in `src/lib/effects.ts`.

## Target Resolution

### resolveEntityTarget

Resolves a single entity from an `EntityTarget`.

```typescript
function resolveEntityTarget(
  combat: CombatState,
  target: EntityTarget,
  context: EffectContext
): Entity | undefined

// EntityTarget options:
// - 'self' → player
// - 'target' → context.currentTarget (card's target)
// - 'player' → player
// - 'random_enemy' → random living enemy
// - 'lowest_hp_enemy' → enemy with lowest HP
// - 'highest_hp_enemy' → enemy with highest HP
// - string (uid) → specific entity by ID
```

### resolveEntityTargets

Resolves multiple entities (for AoE effects).

```typescript
function resolveEntityTargets(
  combat: CombatState,
  target: EntityTarget,
  context: EffectContext
): Entity[]

// Additional targets for multi-target:
// - 'all_enemies' → all living enemies
// - 'all' → player + all enemies
```

### resolveCardTarget

Resolves cards from a `FilteredCardTarget`.

```typescript
function resolveCardTarget(
  combat: CombatState,
  target: FilteredCardTarget
): CardInstance[]

// FilteredCardTarget:
// { from: 'hand' | 'drawPile' | 'discardPile' | 'exhaustPile',
//   filter?: CardFilter,
//   count?: number }
```

## Value Resolution

### resolveValue

Resolves dynamic `EffectValue` to concrete number.

```typescript
function resolveValue(
  value: EffectValue,
  combat: CombatState,
  context: EffectContext
): number

// EffectValue types:
// - number → literal value
// - { type: 'fixed', value: number } → literal
// - { type: 'range', min, max } → random in range
// - { type: 'scaled', source, base, perUnit, max? } → scaling value
// - { type: 'powerAmount' } → context.powerStacks
```

### getScalingSourceValue

Gets value for scaling calculations.

```typescript
function getScalingSourceValue(
  source: ScalingSource,
  combat: CombatState,
  context: EffectContext
): number

// ScalingSource options:
// - 'cardsPlayedThisTurn'
// - 'cardsInHand'
// - 'cardsInDiscard'
// - 'cardsInDraw'
// - 'enemyCount'
// - 'missingHealth'
// - 'currentBlock'
// - 'powerStacks' (uses context.powerId)
```

## Condition Evaluation

### evaluateCondition

Evaluates a `Condition` for conditional effects.

```typescript
function evaluateCondition(
  condition: Condition,
  combat: CombatState,
  context: EffectContext
): boolean
```

**Condition types:**

| Type | Description |
|------|-------------|
| `health` | Check entity HP (`{ target, compare: 'current'|'percent', op, value }`) |
| `resource` | Check resource (`{ target, resource: 'block'|'energy', op, value }`) |
| `hasPower` | Check for power (`{ target, powerId, minStacks? }`) |
| `combat` | Combat state (`{ check: 'turn'|'enemyCount', op, value }`) |
| `cardsPlayed` | Cards played this turn (`{ op, value }`) |
| `cardCount` | Cards in pile (`{ pile, filter?, op, value }`) |
| `turn` | Turn number (`{ op, value }`) |
| `and` | All conditions true |
| `or` | Any condition true |
| `not` | Negate condition |

### compareValues

Comparison helper for conditions.

```typescript
function compareValues(a: number, op: ComparisonOp, b: number): boolean
// ComparisonOp: '==' | '!=' | '<' | '<=' | '>' | '>='
```

## Energy Cost Utilities

```typescript
// Get card's base energy cost
getEnergyCost(card: CardDefinition): number | 'X'
getEnergyCostNumber(card: CardDefinition): number

// Get instance's effective cost (with modifiers)
getEffectiveEnergyCost(instance: CardInstance, definition: CardDefinition): number | 'X'
getEffectiveEnergyCostNumber(instance: CardInstance, definition: CardDefinition): number
```

## Usage in Effects

```typescript
// In effect handler
function handleDamageEffect(state: CombatState, effect: DamageEffect, ctx: EffectContext) {
  const amount = resolveValue(effect.amount, state, ctx)
  const targets = resolveEntityTargets(state, effect.target, ctx)
  
  for (const target of targets) {
    // Apply damage to each target
  }
}
```
