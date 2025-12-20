---
name: effect-authoring
description: >
  Extend the effects engine with new AtomicEffect types and handlers.
  Use when adding new effect types, modifying effect execution, fixing
  effect bugs, or asking how effects work. Triggers: "new effect",
  "add effect type", "effect not working", "executeEffect", "AtomicEffect",
  "effect handler", "how do effects work".
---

# Effect Authoring Skill

Use this skill when adding new effect types to the Pandemonium effects engine.

## Architecture Overview

```
src/game/effects/
├── engine.ts          # Central dispatcher (executeEffect)
├── card-effects.ts    # draw, discard, exhaust, banish, addCard, etc.
├── combat-effects.ts  # damage, block, heal, lifesteal, execute, chain
├── control-effects.ts # conditional, repeat, random, sequence, forEach
└── power-effects.ts   # applyPower, removePower, transferPower, stealPower
```

## Adding a New Effect Type

### Step 1: Define the Type (src/types/effects.ts)

```typescript
export interface MyNewEffect {
  type: 'myNew'
  amount: EffectValue
  target?: EntityTarget
  // ... other fields
}
```

### Step 2: Add to AtomicEffect Union (src/types/effects.ts)

```typescript
export type AtomicEffect =
  | DamageEffect
  | BlockEffect
  // ... existing effects
  | MyNewEffect  // Add here
```

### Step 3: Implement Handler (src/game/effects/<category>-effects.ts)

```typescript
export function executeMyNew(
  state: RunState,
  effect: MyNewEffect,
  ctx: EffectContext
): RunState {
  const { source, target } = ctx
  const amount = resolveValue(effect.amount, ctx)

  // Implement the effect logic using Immer patterns
  return produce(state, draft => {
    // Modify draft state
  })
}
```

### Step 4: Register in Engine (src/game/effects/engine.ts)

```typescript
// Import the executor
import { executeMyNew } from './combat-effects'

// Add case in executeEffect switch
case 'myNew':
  return executeMyNew(state, effect as MyNewEffect, ctx)
```

## Effect Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| card-effects | Card manipulation | draw, discard, exhaust, mill, addCard |
| combat-effects | Combat math | damage, block, heal, lifesteal, execute |
| control-effects | Flow control | conditional, repeat, random, forEach |
| power-effects | Power manipulation | applyPower, removePower, transferPower |

## EffectContext

```typescript
interface EffectContext {
  source: Entity       // Who triggered the effect
  target?: Entity      // Primary target (if applicable)
  card?: CardInstance  // Card being played (if applicable)
}
```

## Value Resolution

Effects use `EffectValue` for dynamic amounts:

```typescript
type EffectValue =
  | number                    // Fixed: 8
  | { type: 'scaled', base: number, scaling: ScalingSource }
  | { type: 'powerAmount', powerId: string }
  | { type: 'range', min: number, max: number }
```

Use `resolveValue(effect.amount, ctx)` to get the final number.

## Power Triggers

Effects can trigger power callbacks:

```typescript
// In combat-effects.ts, damage triggers powers
const triggers = getPowerTriggers(target, 'onDamageTaken')
for (const trigger of triggers) {
  state = executeEffect(state, trigger.effect, { source: target, target: source })
}
```

## Testing

Add tests in `src/game/__tests__/effects.test.ts`:

```typescript
describe('myNew effect', () => {
  it('should do the expected thing', () => {
    const state = createTestState()
    const result = applyAction(state, {
      type: 'playCard',
      cardUid: 'test_card',
      targetId: 'enemy_1',
    })
    expect(result.something).toBe(expected)
  })
})
```

## Key Files

- `src/types/effects.ts` - Effect type definitions
- `src/game/effects/engine.ts` - Central dispatcher
- `src/game/effects/*-effects.ts` - Category handlers
- `src/lib/effects.ts` - resolveValue, evaluateCondition
