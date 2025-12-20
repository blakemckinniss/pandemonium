---
name: power-creation
description: >
  Create new powers (buffs/debuffs) with stack behaviors and triggers.
  Use when adding buffs, debuffs, status effects, or asking about power
  mechanics. Triggers: "new power", "add buff", "create debuff", "strength",
  "vulnerable", "stack behavior", "power trigger", "onTurnStart", "modifier".
---

# Power Creation Skill

Use this skill when creating new powers (buffs/debuffs) for Pandemonium.

## Architecture

```
src/game/powers/
├── index.ts       # Main exports, auto-registration
├── registry.ts    # registerPower, getPowerDefinition
├── modifiers.ts   # Damage/block modifier calculations
├── application.ts # applyPowerToEntity, decayPowers
├── debuffs.ts     # Weak, Vulnerable, Frail, etc.
├── offensive.ts   # Strength, Rage, etc.
├── defensive.ts   # Dexterity, Thorns, etc.
├── utility.ts     # Draw powers, energy powers
└── turn-based.ts  # Per-turn effects
```

## Power Definition Structure

```typescript
registerPower({
  id: 'power_id',
  name: 'Power Name',
  description: 'Effect description. Stacks: {stacks}',
  icon: '⚔️',
  category: 'offensive',  // 'offensive' | 'defensive' | 'utility' | 'debuff' | 'elemental'
  stackBehavior: 'intensity',  // How stacks combine
  decayOn: 'turnEnd',     // When stacks reduce (optional)
  decayAmount: 1,         // How much to reduce (optional)
  modifiers: {},          // Passive stat changes
  triggers: [],           // Active effects on events
})
```

## Stack Behaviors

| Behavior | Description | Use Case |
|----------|-------------|----------|
| `intensity` | Stacks add together, effect scales | Strength (+N damage) |
| `duration` | Stacks = turns remaining | Vulnerable (2 turns) |
| `replace` | New application replaces old | One-shot buffs |

## Modifiers (Passive Effects)

```typescript
modifiers: {
  // Damage modifiers
  outgoingDamage: (base, stacks) => base + stacks,      // Strength
  outgoingDamageMultiplier: (mult, stacks) => mult * 1.5,  // Rage

  // Defense modifiers
  incomingDamage: (base, stacks) => base * 1.5,         // Vulnerable
  outgoingBlock: (base, stacks) => base + stacks,       // Dexterity

  // Other
  drawPerTurn: (base, stacks) => base + stacks,         // Extra draw
}
```

## Triggers (Active Effects)

```typescript
triggers: [
  {
    event: 'onTurnStart',
    effects: [{ type: 'draw', amount: 1 }],
  },
  {
    event: 'onTurnEnd',
    effects: [{ type: 'damage', amount: 3, target: 'self' }],  // Poison
  },
  {
    event: 'onAttack',
    effects: [{ type: 'heal', amount: 2 }],  // Lifesteal
  },
]
```

## Available Trigger Events

| Event | When It Fires |
|-------|---------------|
| `onTurnStart` | Start of entity's turn |
| `onTurnEnd` | End of entity's turn |
| `onAttack` | When entity deals damage |
| `onDamageTaken` | When entity receives damage |
| `onKill` | When entity kills another |
| `onCardPlay` | When a card is played |
| `onBlock` | When block is gained |

## Example: Complete Power

```typescript
// src/game/powers/offensive.ts
export const OFFENSIVE_POWERS: PowerDefinition[] = [
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Deal +{stacks} damage. Take +1 damage per stack.',
    icon: '🔥',
    category: 'offensive',
    stackBehavior: 'intensity',
    modifiers: {
      outgoingDamage: (base, stacks) => base + stacks,
      incomingDamage: (base, stacks) => base + stacks,
    },
  },
]
```

## Elemental Status Powers

Located in `src/game/elements.ts` as `ELEMENTAL_STATUS_POWERS`:
- `burning` (fire) - Damage over time
- `frozen` (ice) - Skip turn at high stacks
- `charged` (lightning) - Bonus damage on next attack
- `wet` (water) - Combo enabler
- `oiled` (void) - Increased fire damage

## Adding a New Power

1. Choose the appropriate file based on category
2. Add to the category's array (e.g., `OFFENSIVE_POWERS`)
3. Powers auto-register on import via `src/game/powers/index.ts`
4. Test with: `npm test -- --run powers`

## Key Files

- `src/game/powers/*.ts` - Power definitions by category
- `src/types/powers.ts` - PowerDefinition interface
- `src/game/effects/power-effects.ts` - applyPower, removePower executors
