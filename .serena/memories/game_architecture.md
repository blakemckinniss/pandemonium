# Game Architecture

## State Architecture

### Combat State (`CombatState`)
Managed via `useState` + Immer. All mutations through `applyAction()`.

```typescript
interface CombatState {
  player: PlayerEntity
  enemies: EnemyEntity[]
  hand: CardInstance[]
  deck: CardInstance[]
  discard: CardInstance[]
  exhaust: CardInstance[]
  energy: number
  turn: number
  phase: TurnPhase
  // ... more
}
```

### Run State (`RunState`)
Persistent run data (deck, gold, rooms completed).

### Meta State (`MetaState`)
Cross-run persistence via Zustand + localStorage:
- Unlocks
- Statistics
- Settings

## Action System

All combat state changes via `applyAction()`:

```typescript
type GameAction =
  | { type: 'playCard'; cardUid: string; targetId?: string }
  | { type: 'endTurn' }
  | { type: 'startCombat'; enemies: EnemyEntity[] }
  | { type: 'drawCards'; count: number }
  | { type: 'takeDamage'; entityId: string; amount: number }
  // ... more
```

## Effects System

Cards use declarative effects:

```typescript
interface CardDefinition {
  id: string
  name: string
  energy: number
  theme: CardTheme      // 'attack' | 'skill' | 'power'
  target: CardTarget    // 'enemy' | 'self' | 'all_enemies' | 'none'
  effects: AtomicEffect[]
}
```

Effect types (100+ defined in types/index.ts):
- `DamageEffect`, `BlockEffect`, `HealEffect`
- `DrawEffect`, `DiscardEffect`, `ExhaustEffect`
- `ApplyPowerEffect`, `RemovePowerEffect`
- `ConditionalEffect`, `RepeatEffect`, `SequenceEffect`

## Entity System

```typescript
interface Entity {
  uid: string
  name: string
  hp: number
  maxHp: number
  block: number
  powers: Power[]
}

interface PlayerEntity extends Entity {
  type: 'player'
}

interface EnemyEntity extends Entity {
  type: 'enemy'
  intent: Intent
  definitionId: string
}
```

## Power/Buff System

Powers modify entity behavior:

```typescript
interface Power {
  id: string
  amount: number
  duration?: number
}
```

With triggers: `onTurnStart`, `onTurnEnd`, `onAttack`, `onDefend`, etc.

## Room System

```typescript
interface RoomDefinition {
  id: string
  name: string
  type: RoomType        // 'combat' | 'elite' | 'boss' | 'rest' | 'event'
  monsters: string[]    // Monster definition IDs
  tier: number
}
```

## Animation Integration

GSAP effects triggered after state changes:
1. State mutation in `applyAction()`
2. Component re-renders
3. `useEffect` triggers GSAP animation
4. Animation plays using registered effects
