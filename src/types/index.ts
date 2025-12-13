// ============================================
// PANDEMONIUM - Type Definitions
// ============================================

// Card Variants
export type CardVariant = 'player' | 'hand' | 'enemy' | 'room'
export type CardTheme = 'attack' | 'skill' | 'power' | 'curse' | 'status'
export type TargetType = 'enemy' | 'player' | 'allEnemies' | 'self' | 'none'

// Intent system for enemies
export type IntentType =
  | 'attack'
  | 'defend'
  | 'buff'
  | 'debuff'
  | 'unknown'

export interface Intent {
  type: IntentType
  value?: number // damage amount for attack, block for defend
}

// Powers (buffs/debuffs)
export interface Power {
  id: string
  name: string
  amount: number
  duration?: number // turns remaining, undefined = permanent
}

export type Powers = Record<string, Power>

// ============================================
// CARDS
// ============================================

// Base card definition (content/registry)
export interface CardDefinition {
  id: string
  name: string
  description: string
  energy: number
  theme: CardTheme
  target: TargetType
  image?: string
  effects: CardEffect[]
  upgraded?: boolean
}

// Card effect types
export type CardEffect =
  | { type: 'damage'; amount: number }
  | { type: 'block'; amount: number }
  | { type: 'draw'; amount: number }
  | { type: 'energy'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'applyPower'; powerId: string; amount: number; target: TargetType }

// Card instance in game (has unique ID)
export interface CardInstance {
  uid: string // unique instance ID
  definitionId: string
  upgraded: boolean
}

// ============================================
// ENTITIES (Player, Enemy)
// ============================================

export interface Entity {
  id: string
  name: string
  currentHealth: number
  maxHealth: number
  block: number
  powers: Powers
  image?: string
}

export interface PlayerEntity extends Entity {
  energy: number
  maxEnergy: number
}

export interface EnemyEntity extends Entity {
  intent: Intent
  // AI pattern for determining next intent
  patternIndex: number
}

// ============================================
// MONSTER DEFINITIONS
// ============================================

export interface MonsterDefinition {
  id: string
  name: string
  health: [number, number] // [min, max] for variance
  image?: string
  pattern: IntentPattern[]
}

export type IntentPattern =
  | { type: 'attack'; damage: number }
  | { type: 'defend'; block: number }
  | { type: 'buff'; powerId: string; amount: number }
  | { type: 'debuff'; powerId: string; amount: number }

// ============================================
// HERO DEFINITIONS
// ============================================

export interface HeroDefinition {
  id: string
  name: string
  health: number
  energy: number
  image?: string
  starterDeck: string[] // card definition IDs
}

// ============================================
// ROOM / DUNGEON
// ============================================

export type RoomType = 'combat' | 'elite' | 'boss' | 'campfire' | 'event' | 'shop'

export interface RoomDefinition {
  id: string
  type: RoomType
  name: string
  description: string
  icon?: string
  // For combat rooms
  monsters?: string[] // monster IDs to spawn
}

export interface RoomCard {
  uid: string
  definitionId: string
  revealed: boolean
}

// ============================================
// GAME STATE
// ============================================

export type TurnPhase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat'
export type GamePhase = 'menu' | 'roomSelect' | 'combat' | 'reward' | 'campfire' | 'gameOver'

export interface CombatState {
  phase: TurnPhase
  turn: number
  player: PlayerEntity
  enemies: EnemyEntity[]
  hand: CardInstance[]
  drawPile: CardInstance[]
  discardPile: CardInstance[]
  exhaustPile: CardInstance[]
}

export interface RunState {
  gamePhase: GamePhase
  floor: number
  hero: HeroDefinition

  // Deck (master list for run)
  deck: CardInstance[]

  // Combat (null when not in combat)
  combat: CombatState | null

  // Dungeon deck
  dungeonDeck: RoomCard[]
  roomChoices: RoomCard[] // current 3 choices

  // Resources
  gold: number

  // Run statistics
  stats: RunStats
}

export interface RunStats {
  enemiesKilled: number
  cardsPlayed: number
  damageDealt: number
  damageTaken: number
}

// ============================================
// ACTIONS
// ============================================

export type GameAction =
  | { type: 'startCombat'; enemies: EnemyEntity[] }
  | { type: 'endCombat'; victory: boolean }
  | { type: 'startTurn' }
  | { type: 'endTurn' }
  | { type: 'drawCards'; amount: number }
  | { type: 'playCard'; cardUid: string; targetId?: string }
  | { type: 'discardCard'; cardUid: string }
  | { type: 'discardHand' }
  | { type: 'damage'; targetId: string; amount: number }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'addBlock'; targetId: string; amount: number }
  | { type: 'spendEnergy'; amount: number }
  | { type: 'gainEnergy'; amount: number }
  | { type: 'applyPower'; targetId: string; powerId: string; amount: number }
  | { type: 'enemyAction'; enemyId: string }
  | { type: 'selectRoom'; roomUid: string }
  | { type: 'dealRoomChoices' }

// ============================================
// COMBAT NUMBERS (FCT)
// ============================================

export interface CombatNumber {
  id: string
  value: number
  type: 'damage' | 'heal' | 'block'
  targetId: string
  x: number
  y: number
}

// ============================================
// META STATE (persisted across runs)
// ============================================

export interface MetaState {
  unlockedCards: string[]
  unlockedHeroes: string[]
  totalRuns: number
  totalWins: number
  highestFloor: number
}
