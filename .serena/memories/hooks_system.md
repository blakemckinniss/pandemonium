# Custom Hooks System

## Overview

Custom React hooks for separating UI logic from components. Located in `src/hooks/`.

## Hooks

### useAnimationCoordinator

Orchestrates GSAP animations for card movements.

```typescript
interface AnimationCoordinator {
  containerRef: RefObject<HTMLDivElement>   // Field container
  handRef: RefObject<HTMLDivElement>        // Hand container
  isAnimating: boolean                      // Animation in progress
  queryContainer: (selector: string) => Element | null
  queryHand: (selector: string) => Element | null
  animateDealCards: (cardUids: string[]) => Promise<void>
  animateDiscardHand: (cardUids: string[]) => Promise<void>
}
```

**Usage:**
```typescript
const { containerRef, handRef, animateDealCards } = useAnimationCoordinator()

// After drawing cards
await animateDealCards(newCardUids)
```

### useSelectionHandlers

Handles card selection UI for scry, tutor, discover, banish effects.

**Responsibilities:**
- Renders selection modal when `pendingSelection` is set
- Validates min/max selection counts
- Calls appropriate resolve action on confirm
- Handles cancel/close behavior

### useRewardHandlers

Logic for RewardScreen after combat victory.

**Responsibilities:**
- Generate reward options (cards, gold, relics)
- Handle card selection from rewards
- Handle gold collection
- Transition to next phase

### useCampfireHandlers

Logic for CampfireScreen (rest sites).

**Actions:**
- `heal` - Restore percentage of max HP
- `upgrade` - Upgrade a card in deck
- `rest` - Skip with small bonus

### useTreasureHandlers

Logic for TreasureScreen (treasure rooms).

**Responsibilities:**
- Display treasure contents
- Handle relic/gold/card acquisition
- Transition to next room selection

### useVisualEventProcessor

Processes visual events from game state and triggers appropriate animations/particles.

**Responsibilities:**
- Listen for visual events (damage, heal, card played, etc.)
- Trigger GSAP animations on DOM elements
- Emit particles via `emitParticle()`
- Handle hero ability visual feedback (`heroActivated`, `heroUltimate`)
- Coordinate screen shake for impactful effects

### useCombatActions

Provides combat action handlers to GameScreen.

**Responsibilities:**
- Handle card plays (drag-drop resolution)
- Process end turn actions
- Manage hero ability activation
- Coordinate with animation system

### useRoomHandlers

Room navigation and dungeon progression logic.

**Responsibilities:**
- Handle room selection from dungeon deck
- Trigger room-specific phases (combat, campfire, treasure)
- Track floor progression

## Pattern

All hooks follow the same pattern:
1. Accept `runState` and `setRunState` (or dispatch)
2. Return handler functions and UI state
3. Keep component code minimal (just rendering)

```typescript
// Component
function RewardScreen({ runState, setRunState }) {
  const { rewards, handleSelectCard, handleSkip } = useRewardHandlers(runState, setRunState)
  
  return (
    <div>
      {rewards.map(r => <RewardCard key={r.id} onClick={() => handleSelectCard(r)} />)}
      <button onClick={handleSkip}>Skip</button>
    </div>
  )
}
```

## Adding New Hooks

1. Create file in `src/hooks/`
2. Export hook function with `use` prefix
3. Define return type interface
4. Keep side effects minimal (prefer pure logic)
5. Use `useCallback` for stable handler references
