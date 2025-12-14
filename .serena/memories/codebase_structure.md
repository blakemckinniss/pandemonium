# Codebase Structure

## Directory Layout

```
src/
├── types/index.ts          # ALL interfaces (single source of truth)
├── game/
│   ├── actions.ts          # Immer state mutations (applyAction)
│   ├── cards.ts            # Card registry (CARDS array)
│   ├── dungeon-deck.ts     # Room deck logic
│   ├── new-game.ts         # Game/enemy factories (MONSTERS)
│   └── powers.ts           # Power/buff definitions
├── content/
│   └── rooms.ts            # Room definitions (ROOMS array)
├── components/
│   ├── Card/               # Unified card (4 variants)
│   ├── Hand/               # Player hand
│   ├── Field/              # Combat field
│   ├── DungeonDeck/        # Room selection
│   ├── CombatNumbers/      # Floating damage numbers
│   ├── UnlockNotification/ # Unlock popups
│   ├── Modal/              # Modal dialogs
│   ├── PowerTooltip/       # Power/buff tooltips
│   ├── ParticleEffects/    # Visual effects
│   ├── AmbientBackground/  # Three.js background
│   └── screens/            # GameScreen, RewardScreen, etc.
├── lib/
│   ├── animations.ts       # GSAP registered effects
│   ├── dragdrop.ts         # Draggable wrapper
│   └── utils.ts            # generateUid, randomInt, etc.
├── stores/
│   ├── metaStore.ts        # Zustand (unlocks, stats, localStorage)
│   └── db.ts               # Dexie (run history, IndexedDB)
├── App.tsx                 # Root component
├── main.tsx                # Entry point
└── index.css               # Global styles (Tailwind)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript interfaces (100+ types) |
| `src/game/actions.ts` | `applyAction()` - all combat state mutations |
| `src/game/cards.ts` | Card definitions registry |
| `src/game/new-game.ts` | `MONSTERS` definitions, game factories |
| `src/content/rooms.ts` | Room/encounter definitions |
| `src/stores/metaStore.ts` | Zustand store for meta-progression |
| `src/lib/animations.ts` | GSAP effect definitions |

## Component Architecture

```
App
├── AmbientBackground (Three.js)
├── GameScreen (combat phase)
│   ├── Field
│   │   ├── Card (variant="player")
│   │   └── Card (variant="enemy") × N
│   ├── Hand
│   │   └── Card (variant="hand") × N
│   └── CombatNumbers
├── RoomSelect (room selection phase)
│   └── DungeonDeck
│       └── Card (variant="room") × N
└── RewardScreen (reward phase)
```
