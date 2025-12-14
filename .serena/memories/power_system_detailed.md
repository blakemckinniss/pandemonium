# Power System (Detailed)

## Overview

Powers (buffs/debuffs) modify entity behavior. Located in `src/game/powers.ts`.

## Power Definition

```typescript
interface PowerDefinition {
  id: string
  name: string
  description: string
  isDebuff?: boolean          // Visual indicator
  stackBehavior: 'intensity' | 'duration' | 'replace'
  removeAtZero?: boolean      // Remove when amount hits 0
  decayOn?: TriggerEvent      // When to reduce amount
  modifiers?: PowerModifiers  // Passive stat modifications
  triggers?: PowerTrigger[]   // Active effects on events
}
```

## Stack Behaviors

- `intensity` - Amount increases effect strength (e.g., Strength +X damage)
- `duration` - Amount is turn counter, decreases each trigger
- `replace` - New application replaces old

## Modifiers (Passive)

Powers can passively modify stats:
```typescript
interface PowerModifiers {
  outgoingDamage?: (base: number, stacks: number) => number
  incomingDamage?: (base: number, stacks: number) => number
  outgoingBlock?: (base: number, stacks: number) => number
}
```

Applied via:
- `applyOutgoingDamageModifiers(entity, baseDamage)`
- `applyIncomingDamageModifiers(entity, baseDamage)`
- `applyOutgoingBlockModifiers(entity, baseBlock)`

## Triggers (Active)

Powers can trigger effects on game events:
```typescript
interface PowerTrigger {
  event: TriggerEvent
  effects: AtomicEffect[]
}
```

Trigger events:
- `onTurnStart`, `onTurnEnd`
- `onAttack`, `onAttacked`
- `onKill`, `onDeath`
- `onCardPlay`, `onCardDraw`
- `onBlock`, `onHeal`

## Decay System

Powers can decay (reduce amount) on specific events:
```typescript
decayOn: 'onTurnEnd'  // Reduce by 1 at end of turn
```

## API

```typescript
// Apply power to entity (handles stacking)
applyPowerToEntity(entity: Entity, powerId: string, amount: number): Entity

// Remove power from entity
removePowerFromEntity(entity: Entity, powerId: string): Entity

// Get power definition
getPowerDefinition(id: string): PowerDefinition | undefined

// Get all registered powers
getAllPowers(): PowerDefinition[]

// Get triggers for specific event
getPowerTriggers(entity: Entity, event: TriggerEvent): TriggeredEffect[]

// Process decay for all powers on entity
decayPowers(entity: Entity, event: TriggerEvent): Entity
```

## Registry

```typescript
const powerRegistry = new Map<string, PowerDefinition>()
registerPower(power: PowerDefinition): void
```

## Current Powers (29)

Categories:
- **Offensive**: Strength, Rage, Berserk
- **Defensive**: Block, Thorns, Plated Armor
- **Utility**: Draw, Energy, Retain
- **Debuffs**: Weak, Vulnerable, Poison, Burning
- **Elemental**: Frozen, Charged, Wet, Oiled
