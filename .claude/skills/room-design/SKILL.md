---
name: room-design
description: >
  Create dungeon rooms with monster spawns, room types, and deck composition.
  Use when adding rooms, designing encounters, or working with the dungeon
  system. Triggers: "new room", "add encounter", "dungeon deck", "monster spawn",
  "elite room", "boss room", "campfire", "treasure room", "room type".
---

# Room Design Skill

Use this skill when creating new dungeon rooms for Pandemonium.

## Room Definition Structure

```typescript
// src/content/rooms.ts
export const ROOMS: Record<string, RoomDefinition> = {
  room_id: {
    id: 'room_id',
    type: 'combat',           // Room type
    name: 'Room Name',
    description: 'Flavor text.',
    icon: '⚔️',               // Emoji for deck display
    image: '/cards/room_room_id.webp',  // Optional
    monsters: ['monster_id', 'monster_id'],  // For combat rooms
  },
}
```

## Room Types

| Type | Purpose | Required Fields |
|------|---------|-----------------|
| `combat` | Standard fight | monsters[] |
| `elite` | Harder fight, better rewards | monsters[] |
| `boss` | Floor boss | monsters[] |
| `campfire` | Rest site (heal/upgrade) | - |
| `treasure` | Relic/gold reward | - |
| `shop` | Buy cards/relics | - |
| `event` | Random event | eventId (optional) |

## Monster References

Monsters are defined in `src/game/new-game.ts` as `MONSTERS`:

```typescript
// Available monsters
slime, cultist, jaw_worm,           // Basic
fire_imp, frost_elemental,          // Elemental
storm_sprite, void_cultist,         // Advanced
shadow_acolyte, void_weaver,        // Shadow Crypt
lich_apprentice                     // Elite
```

## Room Examples

### Combat Room
```typescript
infernal_pit: {
  id: 'infernal_pit',
  type: 'combat',
  name: 'Infernal Pit',
  description: 'Flames dance in the darkness.',
  icon: '🔥',
  image: '/cards/room_infernal_pit.webp',
  monsters: ['fire_imp', 'fire_imp'],
},
```

### Elite Room
```typescript
lich_sanctum: {
  id: 'lich_sanctum',
  type: 'elite',
  name: 'Lich Sanctum',
  description: 'Dark magic permeates the air.',
  icon: '💀',
  image: '/cards/room_lich_sanctum.webp',
  monsters: ['lich_apprentice'],
},
```

### Non-Combat Room
```typescript
ancient_campfire: {
  id: 'ancient_campfire',
  type: 'campfire',
  name: 'Ancient Campfire',
  description: 'Mystical flames offer respite.',
  icon: '🔥',
  image: '/cards/room_campfire.webp',
},
```

## Dungeon Deck System

Rooms are shuffled into a deck via `src/game/dungeon-deck.ts`:

```typescript
// Deck composition per floor
const FLOOR_COMPOSITION = {
  1: { combat: 3, elite: 1, campfire: 1, treasure: 1 },
  2: { combat: 4, elite: 1, campfire: 1, treasure: 1, boss: 1 },
  // ...
}
```

## Element Theming

Group rooms by element for consistent atmosphere:

| Element | Room Theme | Example Monsters |
|---------|------------|------------------|
| physical | Standard dungeon | slime, jaw_worm |
| fire | Infernal, volcanic | fire_imp |
| ice | Frozen, crystalline | frost_elemental |
| lightning | Storm, electric | storm_sprite |
| void | Shadow, corrupted | void_cultist, shadow_acolyte |

## Image Generation

After creating a room, generate its image:

```bash
cd services/image-gen && python batch.py --rooms room_id --copy-to-public
```

Room images use environment-focused prompts (not character portraits).

## Adding New Monsters

If you need a new monster for a room:

1. Add to `MONSTERS` in `src/game/new-game.ts`:
```typescript
export const MONSTERS: Record<string, MonsterDefinition> = {
  new_monster: {
    id: 'new_monster',
    name: 'New Monster',
    hp: 40,
    element: 'void',
    intentPattern: ['attack', 'defend', 'buff'],
    abilities: [...],
  },
}
```

2. Reference in room definition
3. Generate monster card image

## Key Files

- `src/content/rooms.ts` - Room definitions (ROOMS)
- `src/game/new-game.ts` - Monster definitions (MONSTERS)
- `src/game/dungeon-deck.ts` - Deck building logic
- `src/types/rooms.ts` - RoomDefinition, RoomType
