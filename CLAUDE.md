# Pandemonium - Project Instructions

> **First Action:** Activate Serena MCP for this project:
> ```
> mcp__serena__activate_project("pandemonium")
> ```
> This enables symbolic code tools and project-specific memories.

Slay the Spire inspired roguelike card game with drag-and-drop combat.

## Frontend Design Plugin (CRITICAL)

**The `frontend-design` plugin by Anthropic is active and essential for this project.**

This is a highly visual game - every UI element matters. The plugin automatically activates for frontend work and enforces:

- **Bold aesthetic choices** - No generic "AI slop" aesthetics
- **Distinctive typography** - Avoid Inter/Roboto/Arial; use characterful fonts
- **High-impact animations** - GSAP effects, staggered reveals, scroll-triggering
- **Atmospheric visuals** - Gradients, textures, depth, dramatic shadows

### Design Direction for Pandemonium

| Element | Aesthetic |
|---------|-----------|
| Theme | Dark fantasy / arcane grimoire |
| Typography | Display fonts for headers, refined body fonts |
| Color | Deep purples, blacks, gold accents, elemental colors |
| Motion | Card animations, particle effects, combat feedback |
| Atmosphere | Mystical, dangerous, rewarding |

**When building UI components:** Commit to bold choices. Cards should feel tactile. Combat should feel impactful. Menus should feel like ancient tomes. Never settle for generic.

## MVP Policy: Scorched Earth

**NO backwards compatibility.** This is MVP - move fast, break things:
- Breaking schema changes? Wipe the database, don't migrate
- Breaking game logic? Delete old code, don't support both paths
- No version detection, no graceful degradation, no legacy support
- If IndexedDB needs reset: `indexedDB.deleteDatabase('PandemoniumDB')`

This policy applies until explicit transition to stable release.

## ComfyUI & GPU: USE LIBERALLY

**You have FULL ACCESS to ComfyUI and GPU resources. USE THEM.**

This is a visual game - art generation is CORE functionality, not a luxury. The GPU exists to be used.

### Mandatory Behaviors

1. **Missing image?** → Generate it immediately via ComfyUI. Don't create beads, don't defer, don't ask.

2. **ComfyUI not running?** → Start it yourself:
   ```bash
   ~/ai/comfyui/start_optimized.sh
   ```
   Wait 30 seconds for GPU initialization, then proceed.

3. **Need new visual assets?** → Generate them. Cards, rooms, enemies, heroes - all fair game.

4. **Batch generation?** → Do it. The GPU can handle it. Use `services/image-gen/batch.py`.

### Image Generation Service

| Component | Location |
|-----------|----------|
| ComfyUI | `~/ai/comfyui/` |
| Image-gen API | `services/image-gen/` (port 8420) |
| Prompts | `services/image-gen/prompts.py` |
| Batch script | `services/image-gen/batch.py` |
| Generated output | `services/image-gen/generated/` |
| Public assets | `public/cards/` |

### Quick Commands

```bash
# Start ComfyUI (if not running)
~/ai/comfyui/start_optimized.sh

# Check ComfyUI status
curl -s http://localhost:8188/system_stats | jq .

# Start image-gen API
cd services/image-gen && source .venv/bin/activate && python server.py

# Batch generate cards
cd services/image-gen && python batch.py --copy-to-public

# Generate specific cards
cd services/image-gen && python batch.py --cards strike,defend --copy-to-public
```

**DO NOT** wait for permission to generate images. **DO NOT** create tracking beads for image generation. **JUST GENERATE THEM.**

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
| AI | Groq SDK (card/dungeon generation) |

## Architecture

```
src/
├── types/index.ts              # ALL interfaces (120+ types, single source of truth)
├── game/
│   ├── actions.ts              # Immer state mutations (applyAction)
│   ├── cards.ts                # Card registry (CARDS array)
│   ├── elements.ts             # Elemental system & combos
│   ├── new-game.ts             # Game/enemy factories (MONSTERS)
│   ├── relics.ts               # Relic definitions & registry
│   ├── modifiers.ts            # Run modifier definitions
│   ├── modifier-resolver.ts    # Modifier effect application
│   ├── selection-effects.ts    # Player choice effects (scry, tutor, discover)
│   ├── dungeon-deck.ts         # Room deck logic
│   ├── dungeon-generator.ts    # AI dungeon generation via Groq
│   ├── seed-content.ts         # Base content seeding
│   ├── rewards.ts              # Reward generation
│   ├── run-lock.ts             # Run state persistence
│   ├── heat.ts                 # Heat/difficulty system
│   ├── streak.ts               # Win streak tracking
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
│   │   ├── rooms.ts            # room transitions
│   │   ├── hero.ts             # Hero ability handlers
│   │   └── dungeon-flow.ts     # Dungeon progression
│   ├── powers/                 # Power system (modular)
│   ├── card-generator/         # AI card generation via Groq
│   ├── modifier-generator/     # AI modifier generation
│   └── __tests__/              # Game logic tests (652 tests)
├── content/
│   └── rooms.ts                # Room definitions (ROOMS array)
├── components/
│   ├── Card/                   # Unified card (4 variants) + RarityShader
│   ├── Hand/                   # Player hand + CardAnimationOverlay
│   ├── Field/                  # Combat field
│   ├── DungeonDeck/            # RoomSelect component
│   ├── CombatNumbers/          # Floating damage numbers
│   ├── UnlockNotification/     # Unlock popups
│   ├── Modal/                  # Modal, CardSelectionModal, CardPileModal
│   ├── PowerTooltip/           # Power/buff tooltips
│   ├── ParticleEffects/        # Visual effects + emitParticle
│   ├── AmbientBackground/      # Three.js background
│   ├── RelicBar/               # Relic display bar
│   ├── ModifierSelection/      # Pre-run modifier picking
│   ├── ModifierCard/           # Modifier display
│   ├── ModifierShop/           # Modifier purchase UI
│   ├── ScreenTransition/       # Screen change animations
│   ├── StatusSidebar/          # Combat status display
│   ├── StreakDisplay/          # Win streak UI
│   ├── RunLockIndicator/       # Active run indicator
│   ├── DeckAnalytics/          # Deck statistics
│   ├── CardFilters/            # Card filtering UI
│   ├── CollectionStats/        # Collection progress
│   ├── PackOpening/            # Card pack animations
│   ├── CardDetailModal/        # Card inspection
│   ├── StatusChip/             # Status indicators
│   └── screens/                # All game screens
│       ├── GameScreen.tsx      # Main combat screen
│       ├── RewardScreen.tsx    # Post-combat rewards
│       ├── CampfireScreen.tsx  # Rest site (heal/upgrade)
│       ├── TreasureScreen.tsx  # Treasure rooms
│       ├── MenuScreen.tsx      # Main menu + dungeon selection
│       └── DeckBuilderScreen.tsx # Deck viewing/building
├── hooks/                      # Custom React hooks
│   ├── useAnimationCoordinator.ts  # GSAP animation orchestration
│   ├── useCombatActions.ts         # Combat action handlers
│   ├── useRoomHandlers.ts          # Room navigation logic
│   ├── useSelectionHandlers.ts     # Card selection UI logic
│   ├── useVisualEventProcessor.ts  # Visual event processing
│   ├── useRewardHandlers.ts        # Reward screen logic
│   ├── useCampfireHandlers.ts      # Campfire actions
│   ├── useTreasureHandlers.ts      # Treasure room logic
│   ├── useRunRecovery.ts           # Run state recovery
│   └── visualEventHandlers/        # Modular visual handlers
├── config/
│   └── themes.ts               # Card theme configs for image generation
├── lib/
│   ├── animations.ts           # GSAP registered effects
│   ├── dragdrop.ts             # Draggable wrapper
│   ├── effects.ts              # Target resolution, condition evaluation
│   ├── groq.ts                 # Groq SDK wrapper
│   ├── image-gen.ts            # ComfyUI image generation client
│   └── utils.ts                # generateUid, randomInt, etc.
└── stores/
    ├── metaStore.ts            # Zustand (unlocks, stats, localStorage)
    └── db.ts                   # Dexie (run history, dungeons, IndexedDB)
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

### Power System (`game/powers/`)
Powers (buffs/debuffs) with:
- **Stack behaviors**: `intensity` | `duration` | `replace`
- **Modifiers**: Passive stat changes (damage, block multipliers)
- **Triggers**: Active effects on events (`onTurnStart`, `onAttack`, etc.)
- **Decay**: Automatic reduction on specified events

29+ powers across offensive, defensive, utility, debuff, and elemental categories.

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

### Modifier System (`game/modifiers.ts`)
Pre-run modifiers that alter gameplay:
- Gold multipliers, starting bonuses, enemy scaling
- Applied via `modifier-resolver.ts`
- Persisted across run via `run-lock.ts`

### Run Lock System (`game/run-lock.ts`)
Persistent run state for browser recovery:
- Saves run state to IndexedDB on phase changes
- Recovers interrupted runs on app load
- Uses `useRunRecovery` hook for UI integration

### Relic System (`game/relics.ts`)
16+ passive items with trigger-based effects:
- Triggers: `onCombatStart`, `onTurnStart`, `onCardPlay`, `onKill`, etc.
- Use same `AtomicEffect` system as cards

## Component Architecture

```
App
├── AmbientBackground (Three.js)
├── MenuScreen (main menu + dungeon selection)
│   └── ModifierSelection (pre-run modifiers)
├── GameScreen (combat phase)
│   ├── Field
│   │   ├── Card (variant="player")
│   │   └── Card (variant="enemy") × N
│   ├── Hand
│   │   ├── Card (variant="hand") × N
│   │   └── CardAnimationOverlay
│   ├── StatusSidebar
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

### Card Variants
Unified `<Card>` component with 4 variants:
- `hand` - Playable cards in player's hand
- `player` - Player entity on field
- `enemy` - Enemy entities on field
- `room` - Room selection cards

## Custom Hooks Pattern

All hooks in `src/hooks/` follow this pattern:
```typescript
function useXxxHandlers(runState: RunState, setRunState: SetState) {
  const handleAction = useCallback(() => {
    // Logic here
  }, [dependencies])

  return { handleAction, uiState }
}
```

Key hooks:
| Hook | Purpose |
|------|---------|
| `useAnimationCoordinator` | GSAP orchestration for card animations |
| `useCombatActions` | Card play, end turn, hero abilities |
| `useRoomHandlers` | Room selection and navigation |
| `useVisualEventProcessor` | Visual events → animations/particles |
| `useSelectionHandlers` | Scry/tutor/discover modal logic |
| `useRunRecovery` | Interrupted run detection and recovery |

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
Add to `src/game/powers/`:
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

### Adding Modifiers
Add to `src/game/modifiers.ts`:
```typescript
{
  id: 'modifier_id',
  name: 'Modifier Name',
  description: 'What it does',
  effects: { goldMultiplier: 1.5 }
}
```

## Conventions

- **Types**: ALL in `src/types/index.ts`, nowhere else
- **IDs**: Definition IDs are strings (`'strike'`), runtime UIDs via `generateUid()`
- **Effects**: Declarative objects, applied via effects engine
- **State**: Combat via `applyAction()`, meta via Zustand store
- **Constants**: `UPPER_SNAKE_CASE` (CARDS, MONSTERS, ROOMS)
- **Components**: PascalCase, one per directory with `index.tsx`
- **Hooks**: `useXxx` prefix, return handlers + UI state

## Testing

652 tests across 17 test files. Run with:
```bash
npm run test        # Watch mode
npm run test -- --run  # Single run
```

Test patterns:
- Game logic tests in `src/game/__tests__/`
- Use `fake-indexeddb` for Dexie tests
- Mock GSAP for animation tests

## Build & Run

```bash
npm run dev      # Development server (Vite HMR + ComfyUI + image-gen)
npm run dev:vite # Vite only (no image services)
npm run build    # Production build (tsc + vite)
npm run test     # Run tests (Vitest)
npm run preview  # Preview production build
npm run lint     # ESLint check
```

## Serena Memories

This project has 56+ Serena memories documenting:
- `project_overview` - High-level architecture
- `codebase_structure` - Directory layout
- `effects_engine` - Effect system details
- `power_system_detailed` - Power mechanics
- `hooks_system` - Custom React hooks
- `visual_system` - Animation/particle system
- `elemental_system` - Element combos
- `hero_system` - Hero abilities
- `relic_system` - Relic mechanics
- `selection_effects` - Scry/tutor/discover
- `dungeon_system` - Dungeon deck logic

Use `mcp__serena__list_memories` and `mcp__serena__read_memory` to access.

## Local Claude Extensions

Project-specific skills, agents, and hooks in `.claude/`.

### Skills (`.claude/skills/`)

Skills provide focused context for specific tasks. Claude invokes them automatically based on semantic matching.

| Skill | Purpose | Triggers |
|-------|---------|----------|
| `card-creation` | Card syntax, effects, balance guidelines | "create card", "add card", "card doesn't work" |
| `effect-authoring` | Extend effects engine, AtomicEffect types | "add effect", "new effect type", "effect not working" |
| `power-creation` | Power definitions, stack behaviors, triggers | "create power", "add buff", "debuff system" |
| `image-gen` | ComfyUI integration, prompt engineering | "generate image", "card art", "missing image" |
| `room-design` | Dungeon rooms, monster spawns, rewards | "create room", "dungeon design", "add encounter" |

### Agents (`.claude/agents/`)

Specialized subagents for complex tasks. Invoke via Task tool or let Claude delegate automatically.

| Agent | Purpose | Model |
|-------|---------|-------|
| `game-reviewer` | Review game logic changes, state mutations, balance | haiku |
| `effect-debugger` | Debug effect execution, wrong targets, incorrect amounts | sonnet |
| `test-writer` | Write Vitest tests for game mechanics | sonnet |
| `balance-analyzer` | Analyze card/power balance, damage efficiency | haiku |

### Hooks (`.claude/hooks/`)

Automatic context injection and validation on tool use.

| Hook | Type | Purpose |
|------|------|---------|
| `context_injector.py` | PostToolUse | Suggests relevant Serena memories, skills, agents based on file patterns |
| `effect_validator.py` | PreToolUse | Validates effect patterns, warns about Immer anti-patterns |
| `test_reminder.py` | PostToolUse | Reminds to run tests after N game logic edits |
| `serena_activate.sh` | SessionStart | Activates Serena MCP for this project |

## Known Issues

1. **Bundle size**: Main chunk is 760KB - consider code splitting
2. **Mixed imports**: `db.ts` has both static and dynamic imports (Vite warning)
