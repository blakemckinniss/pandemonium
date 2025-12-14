# Relic System

## Overview

Relics are passive items that provide effects triggered by game events. Located in `src/game/relics.ts`.

## Structure

```typescript
interface RelicDefinition {
  id: string
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'boss'
  trigger: RelicTrigger
  effects: AtomicEffect[]
}
```

## Triggers

Relics activate on specific events:
- `onCombatStart` - When combat begins
- `onTurnStart` - At start of player turn
- `onTurnEnd` - At end of player turn
- `onCardPlay` - When any card is played
- `onAttack` - When dealing damage
- `onKill` - When killing an enemy
- `onDamaged` - When player takes damage
- `onHeal` - When player heals
- `onBlock` - When player gains block
- `onDraw` - When drawing cards
- `onDiscard` - When discarding cards
- `onExhaust` - When exhausting cards

## API

```typescript
// Get relic definition by ID
getRelicDefinition(id: string): RelicDefinition | undefined

// Get all relics
getAllRelics(): RelicDefinition[]

// Get relics by rarity
getRelicsByRarity(rarity: string): RelicDefinition[]

// Register new relic
registerRelic(relic: RelicDefinition): void
```

## Registry Pattern

Relics use a Map-based registry pattern:
```typescript
const relicRegistry = new Map<string, RelicDefinition>()
```

## Adding Relics

1. Define relic object with id, name, description, rarity, trigger, effects
2. Effects use the same `AtomicEffect` system as cards
3. Relic automatically registers on module load

## Current Relics (16)

Various rarities providing effects like:
- Energy/draw bonuses
- Damage modifiers
- Block bonuses
- Healing triggers
- Conditional power application
