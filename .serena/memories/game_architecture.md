# Game Architecture

## State Architecture

### Combat State (`CombatState`)
Managed via `useState` + Immer. All mutations through `applyAction()`.

```typescript
interface CombatState {
  player: PlayerEntity
  enemies: EnemyEntity[]
  hand: CardInstance[]
  drawPile: CardInstance[]
  discardPile: CardInstance[]
  exhaustPile: CardInstance[]
  turn: number
  phase: TurnPhase
  cardsPlayedThisTurn: number
  lastPlayedCard?: string
  pendingSelection?: PendingSelection
  visualQueue: VisualEvent[]
}
```

### Run State (`RunState`)
Persistent run data:
```typescript
interface RunState {
  hero: HeroState
  deck: CardInstance[]
  gold: number
  floor: number
  relics: RelicInstance[]
  dungeonDeckId: string           // Current dungeon being played
  dungeonDeck: DungeonRoom[]      // Rooms in current dungeon
  roomChoices: RoomCard[]         // Available room choices
  currentRoomId?: string
  combat?: CombatState
  gamePhase: GamePhase
  stats: RunStats
}
```

### Meta State (`MetaState`)
Cross-run persistence via Zustand + localStorage:
- `unlockedCards`, `unlockedHeroes`
- `totalRuns`, `totalWins`, `highestFloor`

## Action System

All combat state changes via `applyAction()`:

```typescript
type GameAction =
  | { type: 'playCard'; cardUid: string; targetId?: string }
  | { type: 'endTurn' }
  | { type: 'startCombat'; enemies: EnemyEntity[] }
  | { type: 'drawCards'; count: number }
  | { type: 'takeDamage'; entityId: string; amount: number; element?: Element }
  | { type: 'useActivatedAbility' }
  | { type: 'useUltimateAbility' }
  // ... more
```

## Entity System

### Base Entity
```typescript
interface Entity {
  id: string
  name: string
  currentHealth: number
  maxHealth: number
  block: number
  barrier?: number
  powers: Power[]
  image?: string
}
```

### PlayerEntity
```typescript
interface PlayerEntity extends Entity {
  heroCardId: string
  energy: number
  maxEnergy: number
  ultimateCharges: number
  ultimateReady: boolean
  activatedUsedThisTurn: boolean
}
```

### EnemyEntity
```typescript
interface EnemyEntity extends Entity {
  cardId: string
  intent: Intent
  patternIndex: number
  energy?: number
  maxEnergy?: number
  abilityCooldown?: number
  ultimateTriggered?: boolean
  element?: Element
  resistances?: Element[]
  vulnerabilities?: Element[]
  innateStatus?: { powerId: string; amount: number }
}
```

## Effects System

Cards use declarative effects:
```typescript
interface CardDefinition {
  id: string
  name: string
  energy: number
  theme: CardTheme      // 'attack' | 'skill' | 'power' | 'hero'
  target: CardTarget    // 'enemy' | 'self' | 'all_enemies' | 'none'
  effects: AtomicEffect[]
  // Hero-specific
  heroStats?: HeroStats
  passive?: AtomicEffect[]
  activated?: HeroActivated
  ultimate?: HeroUltimate
  // Enemy-specific
  enemyStats?: EnemyStats
  enemyAbility?: EnemyAbility
  enemyUltimate?: EnemyUltimate
}
```

### Effect Categories
- **Card Effects**: damage, block, draw, discard, exhaust
- **Combat Effects**: heal, energy, addCard, gold, maxHealth
- **Control Effects**: conditional, repeat, sequence, random, forEach
- **Power Effects**: applyPower, removePower, transferPower
- **Selection Effects**: scry, tutor, discover, banish, transform

## Power/Buff System

```typescript
interface Power {
  id: string
  amount: number
  duration?: number
}

interface PowerDefinition {
  id: string
  name: string
  description: string
  stackBehavior: 'intensity' | 'duration' | 'replace'
  isDebuff?: boolean
  modifiers?: PowerModifiers
  triggers?: PowerTriggerDef[]
  decayOn?: PowerTrigger
}
```

## Room System

```typescript
interface DungeonRoom {
  id: string
  type: RoomType        // 'combat' | 'elite' | 'boss' | 'campfire' | 'treasure'
  enemyCardIds: string[]
  modifiers?: RoomModifier[]
}
```

## Game Phases

```typescript
type GamePhase = 
  | 'menu'           // Main menu, dungeon selection
  | 'roomSelect'     // Choose next room
  | 'combat'         // Active combat
  | 'reward'         // Post-combat rewards
  | 'campfire'       // Rest site
  | 'treasure'       // Treasure room
  | 'dungeonComplete' // Beat the boss
  | 'gameOver'       // Run ended
```

## Animation Integration

GSAP effects triggered after state changes:
1. State mutation in `applyAction()`
2. Visual event added to `visualQueue`
3. `useVisualEventProcessor` processes queue
4. GSAP animations play using registered effects
