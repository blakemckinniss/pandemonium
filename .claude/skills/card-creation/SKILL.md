---
name: card-creation
description: >
  Create new cards with proper effect syntax, validation, and balance.
  Use when adding cards, designing attacks/skills/powers, asking about
  card effects, energy costs, damage values, or balance guidelines.
  Triggers: "new card", "add card", "create attack", "card balance",
  "effect syntax", "how much damage", "energy cost".
---

# Card Creation Skill

Use this skill when creating new cards for Pandemonium.

## Card Structure

```typescript
// src/game/cards.ts - register via registerCard()
{
  id: 'card_id',           // Unique snake_case identifier
  name: 'Card Name',       // Display name
  description: 'Effect description with {damage} placeholders',
  energy: 1,               // 0-4 typically
  theme: 'attack',         // 'attack' | 'skill' | 'power' | 'curse' | 'status'
  target: 'enemy',         // 'enemy' | 'self' | 'all_enemies' | 'none'
  element: 'physical',     // 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  rarity: 'common',        // 'starter' | 'common' | 'uncommon' | 'rare'
  image: '/cards/card_id.webp',
  effects: [/* AtomicEffect[] */],
}
```

## Required Fields by Theme

| Theme | Required Fields |
|-------|-----------------|
| attack/skill/power | id, name, description, energy, theme, target, effects, image, element |
| curse/status | id, name, description, energy, theme, target, effects, element |
| hero | id, name, description, theme, image, heroStats, element |
| enemy | id, name, description, theme, image, enemyStats, element |

## Common Effect Patterns

### Damage + Block
```typescript
effects: [
  { type: 'damage', amount: 8, target: 'enemy' },
  { type: 'block', amount: 5, target: 'self' },
]
```

### Draw + Discard
```typescript
effects: [
  { type: 'draw', amount: 2 },
  { type: 'discard', amount: 1 },
]
```

### Apply Power
```typescript
effects: [
  { type: 'applyPower', powerId: 'strength', stacks: 2, target: 'self' },
]
```

### Conditional Effect
```typescript
effects: [
  {
    type: 'conditional',
    condition: { type: 'health', target: 'enemy', op: '<', threshold: 50 },
    then: [{ type: 'damage', amount: 15 }],
    else: [{ type: 'damage', amount: 8 }],
  },
]
```

### AoE Damage
```typescript
effects: [
  { type: 'damage', amount: 6, target: 'all_enemies' },
]
```

## Balance Guidelines

| Energy | Attack Damage | Block | Draw |
|--------|---------------|-------|------|
| 0 | 3-4 | 3-4 | 0 |
| 1 | 6-8 | 5-7 | 1 |
| 2 | 12-15 | 10-12 | 2 |
| 3 | 18-22 | 15-18 | 3 |

Powers (theme: 'power') should have lasting effects worth their cost.

## Image Generation

After creating a card, generate its image:
```bash
cd services/image-gen && python batch.py --cards card_id --copy-to-public
```

## Validation

Cards are validated on registration. Missing fields = rejected with warning in console.
Use `registerCardUnsafe()` only for AI-generated cards awaiting images.

## Key Files

- `src/game/cards.ts` - Card registry and registration
- `src/types/cards.ts` - CardDefinition interface
- `src/types/effects.ts` - AtomicEffect union type
- `services/image-gen/batch.py` - Image generation
