# Pandemonium - Project Instructions

> **First Action:** Activate Serena MCP for this project:
> ```
> mcp__serena__activate_project("pandemonium")
> ```
> This enables symbolic code tools and project-specific memories.

Slay the Spire inspired roguelike card game with drag-and-drop combat.

## MVP Policy: Scorched Earth

**NO backwards compatibility.** This is MVP - move fast, break things:
- Breaking schema changes? Wipe the database, don't migrate
- Breaking game logic? Delete old code, don't support both paths
- No version detection, no graceful degradation, no legacy support
- If IndexedDB needs reset: `indexedDB.deleteDatabase('PandemoniumDB')`

This policy applies until explicit transition to stable release.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5.9 |
| Bundler | Vite 7 |
| Animation | GSAP + Draggable + Flip |
| State (combat) | useState + Immer |
| State (meta) | Zustand (localStorage) |
| Persistence | Dexie (IndexedDB) |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + jsdom + fake-indexeddb |
| 3D | Three.js (ambient effects) |
| AI | Groq SDK (card generation) |

## Architecture

```
src/
├── types/index.ts              # ALL interfaces (100+ types, single source of truth)
├── game/
│   ├── actions.ts              # Immer state mutations (applyAction)
│   ├── cards.ts                # Card registry (CARDS array)
│   ├── card-generator.ts       # AI card generation via Groq
│   ├── dungeon-deck.ts         # Room deck logic
│   ├── elements.ts             # Elemental system & combos
│   ├── new-game.ts             # Game/enemy factories (MONSTERS)
│   ├── powers.ts               # Power/buff definitions & registry
│   ├── relics.ts               # Relic definitions & registry
│   ├── selection-effects.ts    # Player choice effects (scry, tutor, discover)
│   ├── effects/                # Modular effect execution
│   │   ├── index.ts            # Exports all handlers
│   │   ├── engine.ts           # Core dispatcher + power triggers
│   │   ├── card-effects.ts     # damage, block, draw, discard
│   │   ├── combat-effects.ts   # heal, energy, add cards
│   │   ├── control-effects.ts  # conditional, repeat, sequence
│   │   └── power-effects.ts    # apply/remove/transfer powers
│   ├── handlers/               # Action handlers by domain
│   │   ├── index.ts            # Combined export
│   │   ├── shared.ts           # Utilities (getEntity, canPlayCard)
│   │   ├── combat.ts           # start/end combat
│   │   ├── cards.ts            # play/draw/discard/exhaust
│   │   ├── turns.ts            # start/end turn
│   │   ├── enemy.ts            # AI & intents
│   │   ├── damage.ts           # damage calculation
│   │   ├── energy.ts           # energy management
│   │   └── rooms.ts            # room transitions
│   └── __tests__/              # Game logic tests
├── content/
│   └── rooms.ts                # Room definitions (ROOMS array)
├── components/
│   ├── Card/                   # Unified card (4 variants)
│   ├── Hand/                   # Player hand + CardAnimationOverlay
│   ├── Field/                  # Combat field
│   ├── DungeonDeck/            # RoomSelect component
│   ├── CombatNumbers/          # Floating damage numbers
│   ├── UnlockNotification/     # Unlock popups
│   ├── Modal/                  # Modal, CardSelectionModal, CardPileModal
│   ├── PowerTooltip/           # Power/buff tooltips
│   ├── ParticleEffects/        # Canvas particles + emitParticle
│   ├── AmbientBackground/      # Three.js background
│   ├── RelicBar/               # Relic display bar
│   └── screens/
│       ├── GameScreen.tsx      # Main combat screen
│       ├── RewardScreen.tsx    # Post-combat rewards
│       ├── CampfireScreen.tsx  # Rest site (heal/upgrade)
│       ├── TreasureScreen.tsx  # Treasure rooms
│       ├── MenuScreen.tsx      # Main menu
│       └── DeckBuilderScreen.tsx
├── hooks/
│   ├── useAnimationCoordinator.ts  # GSAP animation orchestration
│   ├── useSelectionHandlers.ts     # Card selection UI logic
│   ├── useRewardHandlers.ts        # Reward screen logic
│   ├── useCampfireHandlers.ts      # Campfire actions
│   └── useTreasureHandlers.ts      # Treasure room logic
├── lib/
│   ├── animations.ts           # GSAP registered effects
│   ├── dragdrop.ts             # Draggable wrapper
│   ├── effects.ts              # Target resolution, condition evaluation
│   ├── groq.ts                 # Groq SDK wrapper
│   └── utils.ts                # generateUid, randomInt, etc.
└── stores/
    ├── metaStore.ts            # Zustand (unlocks, stats, localStorage)
    └── db.ts                   # Dexie (run history, IndexedDB)
```

## Key Systems

### Action System
All combat state changes via `applyAction()` in `actions.ts`:
```typescript
setState(prev => applyAction(prev, { type: 'playCard', cardUid, targetId }))
```

Action types: `playCard`, `endTurn`, `startCombat`, `drawCards`, `takeDamage`, etc.

### Effects Engine (`game/effects/`)
Modular effect execution with category handlers:
- **card-effects**: damage, block, draw, discard, exhaust
- **combat-effects**: heal, energy, add cards to piles
- **control-effects**: conditional, repeat, sequence, random, forEach
- **power-effects**: apply/remove/modify/transfer powers

Effects are declarative objects executed by `executeEffect()`.

### Power System (`game/powers.ts`)
Powers (buffs/debuffs) with:
- **Stack behaviors**: `intensity` | `duration` | `replace`
- **Modifiers**: Passive stat changes (damage, block multipliers)
- **Triggers**: Active effects on events (`onTurnStart`, `onAttack`, etc.)
- **Decay**: Automatic reduction on specified events

29 powers across offensive, defensive, utility, debuff, and elemental categories.

### Elemental System (`game/elements.ts`)
Five elements: `fire`, `ice`, `lightning`, `physical`, `void`
- Elemental status powers (burning, frozen, charged, wet, oiled)
- Combo system (Fire + Ice = Steam Burst, Lightning + Wet = Electrocute)
- Entity affinities (resistances, weaknesses, immunities)

### Selection Effects (`game/selection-effects.ts`)
Player choice effects that pause combat:
- `scry` - Look at top N cards, reorder/discard
- `tutor` - Search deck/discard for cards
- `discover` - Choose 1 of N random options
- `transform` - Change card into another
- `upgrade` - Improve selected cards
- `banish` - Remove cards permanently

### Relic System (`game/relics.ts`)
16 passive items with trigger-based effects:
- Triggers: `onCombatStart`, `onTurnStart`, `onCardPlay`, `onKill`, etc.
- Use same `AtomicEffect` system as cards

## Component Architecture

```
App
├── AmbientBackground (Three.js)
├── MenuScreen
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
├── RoomSelect
│   └── Card (variant="room") × N
├── RewardScreen
├── CampfireScreen
├── TreasureScreen
└── DeckBuilderScreen
```

### Card Variants
Unified `<Card>` component with 4 variants:
- `hand` - Playable cards in player's hand
- `player` - Player entity on field
- `enemy` - Enemy entities on field
- `room` - Room selection cards

## Game Flow

```
menu → roomSelect → [room type] → reward/next phase

Room type routing:
- combat/elite/boss → GameScreen → RewardScreen
- campfire → CampfireScreen → roomSelect
- treasure → TreasureScreen → roomSelect

GamePhase: 'menu' | 'roomSelect' | 'combat' | 'reward' | 'campfire' | 'treasure' | 'gameOver'
```

## Visual System

### GSAP Effects (`lib/animations.ts`)
Card: `dealCards`, `playCard`, `discardHand`, `exhaustCard`, `cardGlow`, `snapBack`
Entity: `shake`, `enemyHit`, `pulse`, `statusPulse`
UI: `floatNumber`, `shuffleDeck`, `powerIcon`, `energyPulse`

### Particle System (`components/ParticleEffects/`)
Canvas-based particles via `emitParticle(type, x, y, count)`:
Types: `attack`, `skill`, `power`, `block`, `heal`, `poison`, `energy`, `combo`, etc.

### Combat Numbers (`components/CombatNumbers/`)
Floating damage/heal numbers with variants: `piercing`, `combo`, `chain`, `execute`, `poison`
Element-colored based on damage type.

## Content Extension

### Adding Cards
Add to `src/game/cards.ts`:
```typescript
{
  id: 'card_id',
  name: 'Card Name',
  energy: 1,
  theme: 'attack',      // 'attack' | 'skill' | 'power'
  target: 'enemy',      // 'enemy' | 'self' | 'all_enemies' | 'none'
  effects: [{ type: 'damage', amount: 8 }],
}
```

### Adding Powers
Add to `src/game/powers.ts`:
```typescript
registerPower({
  id: 'power_id',
  name: 'Power Name',
  description: 'Effect description',
  stackBehavior: 'intensity',
  modifiers: { outgoingDamage: (base, stacks) => base + stacks },
  triggers: [{ event: 'onTurnEnd', effects: [...] }]
})
```

### Adding Monsters
1. Add template to `MONSTERS` in `src/game/new-game.ts`
2. Reference in room definitions in `src/content/rooms.ts`

### Adding Relics
Add to `src/game/relics.ts`:
```typescript
registerRelic({
  id: 'relic_id',
  name: 'Relic Name',
  description: 'Effect',
  rarity: 'common',
  trigger: 'onCombatStart',
  effects: [{ type: 'draw', amount: 1 }]
})
```

### Adding Effects
1. Add effect type to `AtomicEffect` union in `types/index.ts`
2. Add handler case to appropriate category file in `game/effects/`

## Conventions

- **Types**: ALL in `src/types/index.ts`, nowhere else
- **IDs**: Definition IDs are strings (`'strike'`), runtime UIDs via `generateUid()`
- **Effects**: Declarative objects, applied via effects engine
- **State**: Combat via `applyAction()`, meta via Zustand store
- **Constants**: `UPPER_SNAKE_CASE` (CARDS, MONSTERS, ROOMS)
- **Components**: PascalCase, one per directory with `index.tsx`

## Build & Run

```bash
npm run dev      # Development server (Vite HMR)
npm run build    # Production build (tsc + vite)
npm run test     # Run tests (Vitest)
npm run preview  # Preview production build
```
