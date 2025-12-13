# Pandemonium - Project Instructions

Slay the Spire inspired roguelike card game with drag-and-drop combat.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Animation | GSAP + Draggable + Flip |
| State (combat) | useState + Immer |
| State (meta) | Zustand (localStorage) |
| Persistence | Dexie (IndexedDB) |
| Styling | Tailwind v4 |

## Architecture

```
src/
├── types/index.ts          # All interfaces (single source of truth)
├── game/
│   ├── actions.ts          # Immer state mutations
│   ├── cards.ts            # Card registry
│   ├── dungeon-deck.ts     # Room deck logic
│   └── new-game.ts         # Game/enemy factories
├── content/
│   └── rooms.ts            # Room definitions
├── components/
│   ├── Card/               # Unified card (4 variants)
│   ├── Hand/               # Player hand
│   ├── Field/              # Combat field
│   ├── DungeonDeck/        # Room selection
│   ├── CombatNumbers/      # Floating damage numbers
│   ├── UnlockNotification/ # Unlock popups
│   └── screens/            # GameScreen, RewardScreen
├── lib/
│   ├── animations.ts       # GSAP registered effects
│   ├── dragdrop.ts         # Draggable wrapper
│   └── utils.ts            # generateUid, randomInt, etc.
└── stores/
    ├── metaStore.ts        # Zustand (unlocks, stats)
    └── db.ts               # Dexie (run history)
```

## Key Patterns

### State Mutations
All combat state changes go through `applyAction()` in `actions.ts`:
```typescript
setState(prev => applyAction(prev, { type: 'playCard', cardUid, targetId }))
```

### Card Variants
Unified `<Card>` component with 4 variants:
- `hand` - Playable cards in player's hand
- `player` - Player entity on field
- `enemy` - Enemy entities on field
- `room` - Room selection cards

### GSAP Effects
Registered effects in `animations.ts`:
- `dealCards` - Fan cards into hand
- `playCard` - Card flies to target
- `discardHand` - Cards sweep away
- `floatNumber` - Damage numbers float up
- `shake` - Hit feedback

### Drag-Drop
`enableDragDrop()` in `dragdrop.ts` handles:
- Card dragging from hand
- `hitTest()` for valid targets
- Snap-back on invalid drop

## Game Flow

```
roomSelect → combat → reward → roomSelect → ... → gameOver
     ↓           ↓
  RoomSelect  GameScreen
              (victory/defeat overlays)
```

## Content Extension

### Adding Cards
1. Add definition to `src/game/cards.ts`:
```typescript
{
  id: 'card_id',
  name: 'Card Name',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  description: 'Deal 8 damage',
  effects: [{ type: 'damage', amount: 8 }],
}
```

### Adding Monsters
1. Add template to `MONSTERS` in `src/game/new-game.ts`
2. Reference in room definitions in `src/content/rooms.ts`

### Adding Rooms
1. Add to `ROOMS` array in `src/content/rooms.ts`
2. Specify `type`, `monsters` array, and metadata

## Conventions

- **Types**: All in `src/types/index.ts`, nowhere else
- **IDs**: Use `generateUid()` for runtime instances
- **Effects**: Card effects are declarative objects, applied in `applyCardEffects()`
- **Stats**: Track in `RunState.stats`, persist via `saveRun()` on game end
- **Unlocks**: Define conditions in `checkUnlocks()` in `metaStore.ts`

## Build & Run

```bash
npm run dev      # Development server
npm run build    # Production build (tsc + vite)
npm run preview  # Preview production build
```
