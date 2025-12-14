# Elemental System

## Overview

Element-based damage types with combo interactions. Located in `src/game/elements.ts`.

## Elements

Five elements with distinct colors and icons:
- `fire` - 🔥 Orange/red
- `ice` - ❄️ Blue/cyan
- `lightning` - ⚡ Yellow/purple
- `physical` - 💪 Gray
- `void` - 🌀 Purple/dark

## Constants

```typescript
ELEMENT_COLORS: Record<Element, string>
ELEMENT_ICONS: Record<Element, string>
```

## Elemental Status Powers

Elements can apply status effects to targets:
```typescript
ELEMENTAL_STATUS_POWERS = {
  burning: 'fire',
  frozen: 'ice',
  charged: 'lightning',
  wet: 'water/ice',
  oiled: 'fire prep'
}
```

## Elemental Combos

When elements interact, combos trigger:

```typescript
interface ElementalCombo {
  trigger: [Element, Element]  // Element pair that triggers
  name: string                 // Combo name (e.g., "Meltdown")
  effect: string               // Effect description
  damageMultiplier?: number    // Damage boost
  bonusDamage?: number         // Flat damage addition
  applyStatus?: string         // Status to apply
  removeStatus?: string[]      // Statuses to remove
  chainToAll?: boolean         // Spread to all enemies
  executeThreshold?: number    // Kill threshold %
}
```

### Example Combos
- Fire + Ice → "Steam Burst" (AoE damage, remove frozen)
- Lightning + Wet → "Electrocute" (chain damage, stun)
- Fire + Oiled → "Ignite" (massive damage multiplier)

## Functions

```typescript
// Check if elements trigger a combo
checkElementalCombo(element1: Element, element2: Element): ElementalCombo | undefined

// Get damage multiplier based on resistances/weaknesses
getElementalDamageMultiplier(element: Element, affinity: ElementalAffinity): number

// Convert status ↔ element
getElementStatus(element: Element): string | undefined
getStatusElement(status: string): Element | undefined
```

## Elemental Affinity

Entities can have elemental affinities:
```typescript
interface ElementalAffinity {
  resistances: Element[]   // 50% damage reduction
  weaknesses: Element[]    // 150% damage
  immunities: Element[]    // 0% damage
}
```
