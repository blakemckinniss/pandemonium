# Codebase Structure

## Directory Layout

```
src/
├── types/index.ts          # ALL interfaces (single source of truth)
├── game/
│   ├── actions.ts          # Immer state mutations (applyAction)
│   ├── cards.ts            # Card registry (CARDS array)
│   ├── card-generator.ts   # AI card generation via Groq
│   ├── dungeon-deck.ts     # Room deck logic
│   ├── elements.ts         # Elemental system & combos
│   ├── new-game.ts         # Game/enemy factories (MONSTERS)
│   ├── powers.ts           # Power/buff definitions
│   ├── relics.ts           # Relic definitions
│   ├── selection-effects.ts # Player choice effects (scry, tutor, discover)
│   ├── effects/            # Modular effect execution
│   │   ├── index.ts        # Exports all handlers
│   │   ├── engine.ts       # Core dispatcher
│   │   ├── card-effects.ts # damage, block, draw, discard
│   │   ├── combat-effects.ts # heal, energy, add cards
│   │   ├── control-effects.ts # conditional, repeat, sequence
│   │   └── power-effects.ts # apply/remove/transfer powers
│   ├── handlers/           # Action handlers by domain
│   │   ├── index.ts        # Combined export
│   │   ├── shared.ts       # Utilities (getEntity, canPlayCard)
│   │   ├── combat.ts       # start/end combat
│   │   ├── cards.ts        # play/draw/discard/exhaust
│   │   ├── turns.ts        # start/end turn
│   │   ├── enemy.ts        # AI & intents
│   │   ├── damage.ts       # damage calculation
│   │   ├── energy.ts       # energy management
│   │   ├── rooms.ts        # room transitions
│   │   └── hero.ts         # Hero ability handlers
│   └── __tests__/          # Game logic tests
├── content/
│   └── rooms.ts            # Room definitions (ROOMS array)
├── components/
│   ├── Card/               # Unified card (4 variants)
│   ├── Hand/               # Player hand + CardAnimationOverlay
│   ├── Field/              # Combat field
│   ├── DungeonDeck/        # RoomSelect component
│   ├── CombatNumbers/      # Floating damage numbers
│   ├── UnlockNotification/ # Unlock popups
│   ├── Modal/              # Modal, CardSelectionModal, CardPileModal, CardPreviewModal
│   ├── PowerTooltip/       # Power/buff tooltips
│   ├── ParticleEffects/    # Visual effects + emitParticle
│   ├── AmbientBackground/  # Three.js background
│   ├── RelicBar/           # Relic display bar
│   └── screens/            # All game screens
│       ├── GameScreen.tsx      # Main combat screen
│       ├── RewardScreen.tsx    # Post-combat rewards
│       ├── CampfireScreen.tsx  # Rest site (heal/upgrade)
│       ├── TreasureScreen.tsx  # Treasure rooms
│       ├── MenuScreen.tsx      # Main menu
│       └── DeckBuilderScreen.tsx # Deck viewing/building
├── hooks/                  # Custom React hooks (8 files)
│   ├── useAnimationCoordinator.ts # GSAP animation orchestration
│   ├── useCombatActions.ts        # Combat action handlers
│   ├── useRoomHandlers.ts         # Room navigation logic
│   ├── useSelectionHandlers.ts    # Card selection UI logic
│   ├── useVisualEventProcessor.ts # Visual event processing
│   ├── useRewardHandlers.ts       # Reward screen logic
│   ├── useCampfireHandlers.ts     # Campfire actions
│   └── useTreasureHandlers.ts     # Treasure room logic
├── config/
│   └── themes.ts           # Card theme configs for image generation
├── lib/
│   ├── animations.ts       # GSAP registered effects
│   ├── dragdrop.ts         # Draggable wrapper
│   ├── effects.ts          # Target resolution, condition evaluation
│   ├── groq.ts             # Groq SDK wrapper
│   ├── image-gen.ts        # ComfyUI image generation client
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
| `src/game/powers.ts` | Power/buff definitions & registry |
| `src/game/relics.ts` | Relic definitions & registry |
| `src/game/elements.ts` | Elemental system, combos, affinities |
| `src/game/effects/engine.ts` | Effect dispatcher & power triggers |
| `src/content/rooms.ts` | Room/encounter definitions |
| `src/stores/metaStore.ts` | Zustand store for meta-progression |
| `src/lib/animations.ts` | GSAP effect definitions |
| `src/lib/effects.ts` | Target resolution, condition evaluation |
| `src/hooks/useAnimationCoordinator.ts` | Animation orchestration |
| `src/lib/image-gen.ts` | ComfyUI image generation client |
| `src/game/handlers/hero.ts` | Hero ability handlers |
| `src/config/themes.ts` | Card theme configs for generation |

## Component Architecture

```
App
├── AmbientBackground (Three.js)
├── MenuScreen (main menu)
├── GameScreen (combat phase)
│   ├── Field
│   │   ├── Card (variant="player")
│   │   └── Card (variant="enemy") × N
│   ├── Hand
│   │   ├── Card (variant="hand") × N
│   │   └── CardAnimationOverlay
│   ├── CombatNumbers
│   ├── RelicBar
│   └── ParticleEffects
├── RoomSelect (room selection phase)
│   └── Card (variant="room") × N
├── RewardScreen (post-combat rewards)
├── CampfireScreen (rest sites)
├── TreasureScreen (treasure rooms)
└── DeckBuilderScreen (deck viewing)
```
