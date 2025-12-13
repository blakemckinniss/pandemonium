// ============================================
// PANDEMONIUM - Type Definitions
// ============================================

// Card Variants
export type CardVariant = 'player' | 'hand' | 'enemy' | 'room'
export type CardTheme = 'attack' | 'skill' | 'power' | 'curse' | 'status'

// ============================================
// ELEMENTAL SYSTEM
// ============================================

export type Element = 'physical' | 'fire' | 'ice' | 'lightning' | 'void'

// Elemental statuses that can be applied to entities
export type ElementalStatus = 'burning' | 'wet' | 'frozen' | 'charged' | 'oiled'

// Elemental combo definitions
export interface ElementalCombo {
  trigger: [ElementalStatus, Element] // Status on target + incoming element
  name: string
  effect: 'chainDamage' | 'explosion' | 'shatter' | 'conduct' | 'flashFreeze'
  damageMultiplier?: number
  bonusDamage?: number
  removeStatus?: boolean
  applyStatus?: ElementalStatus
  chainToAll?: boolean // For chain lightning
  executeThreshold?: number // For shatter (kills if below X% HP)
}

// Intent system for enemies
export type IntentType = 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown'

export interface Intent {
  type: IntentType
  value?: number
}

// ============================================
// TARGETING SYSTEM
// ============================================

export type EntityTarget =
  // Direct
  | 'self'
  | 'player'
  | 'source' // Who caused this effect (for triggers)
  // Single enemy
  | 'enemy' // Requires player selection
  | 'randomEnemy'
  | 'weakestEnemy' // Lowest current HP
  | 'strongestEnemy' // Highest current HP
  | 'frontEnemy' // First in array
  | 'backEnemy' // Last in array
  // Multiple
  | 'allEnemies'
  | 'allEntities' // Player + all enemies
  | 'otherEnemies' // All except current target

export type CardTarget =
  | 'hand'
  | 'drawPile'
  | 'discardPile'
  | 'exhaustPile'
  | 'randomHand'
  | 'randomDraw'
  | 'randomDiscard'
  | 'leftmostHand'
  | 'rightmostHand'
  | 'topDraw'
  | 'thisCard'

export interface CardFilter {
  theme?: CardTheme | CardTheme[]
  costMin?: number
  costMax?: number
  hasEffect?: AtomicEffectType
}

export interface FilteredCardTarget {
  from: CardTarget
  filter?: CardFilter
  count?: number
}

// ============================================
// VALUE SYSTEM (Range + Scaling)
// ============================================

export type ScalingSource =
  | 'energy'
  | 'maxEnergy'
  | 'cardsInHand'
  | 'cardsPlayed'
  | 'block'
  | 'missingHealth'
  | 'healthPercent'
  | 'enemyCount'
  | 'turnNumber'
  | 'powerStacks' // For power-triggered effects

export interface FixedValue {
  type: 'fixed'
  value: number
}

export interface RangeValue {
  type: 'range'
  min: number
  max: number
}

export interface ScaledValue {
  type: 'scaled'
  base: number
  perUnit: number
  source: ScalingSource
  max?: number
}

export interface GeneratedScaledValue {
  type: 'generatedScaled'
  baseRange: [number, number]
  perUnit: number
  source: ScalingSource
}

export type EffectValue = number | FixedValue | RangeValue | ScaledValue | GeneratedScaledValue

// ============================================
// CONDITION SYSTEM (Nestable)
// ============================================

export type ComparisonOp = '<' | '<=' | '=' | '>=' | '>' | '!='

export interface HealthCondition {
  type: 'health'
  target: EntityTarget
  compare: 'current' | 'max' | 'percent' | 'missing'
  op: ComparisonOp
  value: number
}

export interface HasPowerCondition {
  type: 'hasPower'
  target: EntityTarget
  powerId: string
  minStacks?: number
}

export interface ResourceCondition {
  type: 'resource'
  resource: 'energy' | 'gold' | 'block'
  target?: EntityTarget
  op: ComparisonOp
  value: number
}

export interface CardCountCondition {
  type: 'cardCount'
  pile: 'hand' | 'drawPile' | 'discardPile' | 'exhaustPile'
  op: ComparisonOp
  value: number
  filter?: CardFilter
}

export interface TurnCondition {
  type: 'turn'
  op: ComparisonOp
  value: number
}

export interface CombatCondition {
  type: 'combat'
  check: 'enemyCount' | 'isPlayerTurn' | 'isFirstTurn'
  op?: ComparisonOp
  value?: number
}

export interface AndCondition {
  type: 'and'
  conditions: Condition[]
}

export interface OrCondition {
  type: 'or'
  conditions: Condition[]
}

export interface NotCondition {
  type: 'not'
  condition: Condition
}

export type Condition =
  | HealthCondition
  | HasPowerCondition
  | ResourceCondition
  | CardCountCondition
  | TurnCondition
  | CombatCondition
  | AndCondition
  | OrCondition
  | NotCondition

// ============================================
// ATOMIC EFFECTS
// ============================================

// --- COMBAT EFFECTS ---

export interface DamageEffect {
  type: 'damage'
  amount: EffectValue
  target?: EntityTarget
  element?: Element // Elemental damage type (defaults to 'physical')
  piercing?: boolean
  triggerOnHit?: AtomicEffect[]
}

export interface BlockEffect {
  type: 'block'
  amount: EffectValue
  target?: EntityTarget
  persistent?: boolean // Barrier - doesn't decay at turn start
}

export interface HealEffect {
  type: 'heal'
  amount: EffectValue
  target?: EntityTarget
  canOverheal?: boolean
}

export interface LifestealEffect {
  type: 'lifesteal'
  amount: EffectValue
  target: EntityTarget
  healTarget?: EntityTarget
  ratio?: number
}

// --- RESOURCE EFFECTS ---

export interface EnergyEffect {
  type: 'energy'
  amount: EffectValue
  operation: 'gain' | 'spend' | 'set'
}

// --- CARD EFFECTS ---

export interface DrawEffect {
  type: 'draw'
  amount: EffectValue
}

export interface DiscardEffect {
  type: 'discard'
  target: CardTarget | FilteredCardTarget
  amount?: EffectValue
}

export interface ExhaustEffect {
  type: 'exhaust'
  target: CardTarget | FilteredCardTarget
  amount?: EffectValue
}

export interface AddCardEffect {
  type: 'addCard'
  cardId: string
  destination: 'hand' | 'drawPile' | 'discardPile'
  position?: 'top' | 'bottom' | 'random'
  upgraded?: boolean
  count?: EffectValue
}

export interface ShuffleEffect {
  type: 'shuffle'
  pile: 'drawPile' | 'discardPile'
  into?: 'drawPile'
}

export interface UpgradeEffect {
  type: 'upgrade'
  target: CardTarget | FilteredCardTarget
}

export interface RetainEffect {
  type: 'retain'
  target: CardTarget | FilteredCardTarget
}

export interface TransformEffect {
  type: 'transform'
  target: CardTarget | FilteredCardTarget
  toCardId?: string // Specific card to transform into
  toRandom?: {
    filter?: CardFilter // Filter for random card selection
    pool?: 'all' | 'common' | 'uncommon' | 'rare' // Card pool to pick from
  }
  upgraded?: boolean // Whether the new card should be upgraded
}

export interface ScryEffect {
  type: 'scry'
  amount: EffectValue // How many cards to look at from top of draw pile
}

export interface TutorEffect {
  type: 'tutor'
  from: 'drawPile' | 'discardPile'
  filter?: CardFilter
  amount?: EffectValue // How many to select (default 1)
  destination: 'hand' | 'drawPile'
  position?: 'top' | 'bottom' | 'random' // For drawPile destination
  shuffle?: boolean // Shuffle draw pile after?
}

// --- POWER EFFECTS ---

export interface ApplyPowerEffect {
  type: 'applyPower'
  powerId: string
  amount: EffectValue
  target?: EntityTarget
  duration?: number
}

export interface RemovePowerEffect {
  type: 'removePower'
  powerId: string
  target?: EntityTarget
  amount?: EffectValue
}

export interface TransferPowerEffect {
  type: 'transferPower'
  powerId: string
  from: EntityTarget
  to: EntityTarget
  amount?: EffectValue
}

// --- META EFFECTS (Composition) ---

export interface ConditionalEffect {
  type: 'conditional'
  condition: Condition
  then: AtomicEffect[]
  else?: AtomicEffect[]
}

export interface RepeatEffect {
  type: 'repeat'
  times: EffectValue
  effects: AtomicEffect[]
}

export interface RandomEffect {
  type: 'random'
  choices: AtomicEffect[][]
  weights?: number[]
}

export interface SequenceEffect {
  type: 'sequence'
  effects: AtomicEffect[]
}

export interface ForEachEffect {
  type: 'forEach'
  target: EntityTarget | CardTarget
  effects: AtomicEffect[]
}

// --- UNION TYPE ---

export type AtomicEffect =
  // Combat
  | DamageEffect
  | BlockEffect
  | HealEffect
  | LifestealEffect
  // Resource
  | EnergyEffect
  // Card
  | DrawEffect
  | DiscardEffect
  | ExhaustEffect
  | AddCardEffect
  | ShuffleEffect
  | UpgradeEffect
  | RetainEffect
  | TransformEffect
  | ScryEffect
  | TutorEffect
  // Power
  | ApplyPowerEffect
  | RemovePowerEffect
  | TransferPowerEffect
  // Meta
  | ConditionalEffect
  | RepeatEffect
  | RandomEffect
  | SequenceEffect
  | ForEachEffect

export type AtomicEffectType = AtomicEffect['type']

// ============================================
// POWER SYSTEM
// ============================================

export type StackBehavior = 'intensity' | 'duration' | 'both'

export type PowerTrigger =
  | 'onTurnStart'
  | 'onTurnEnd'
  | 'onAttack'
  | 'onAttacked'
  | 'onDamaged'
  | 'onBlock'
  | 'onCardPlayed'
  | 'onDeath'
  | 'onKill'

export interface PowerModifiers {
  outgoingDamage?: number // Multiplier or flat add
  incomingDamage?: number // Multiplier
  outgoingBlock?: number // Flat add
}

export interface PowerTriggerDef {
  event: PowerTrigger
  effects: AtomicEffect[]
}

export interface PowerDefinition {
  id: string
  name: string
  description: string
  stackBehavior: StackBehavior
  modifiers?: PowerModifiers
  triggers?: PowerTriggerDef[]
  decayOn?: 'turnStart' | 'turnEnd'
  removeAtZero?: boolean
  isDebuff?: boolean
  icon?: string
}

// Runtime power instance on entity
export interface Power {
  id: string
  amount: number
  duration?: number
}

export type Powers = Record<string, Power>

// ============================================
// CARDS
// ============================================

export interface CardDefinition {
  id: string
  name: string
  description: string
  energy: number | EffectValue
  theme: CardTheme
  element?: Element // Card's elemental affinity (for deck-building synergies)
  target: EntityTarget
  effects: AtomicEffect[]
  tags?: string[]
  rarity?: 'starter' | 'common' | 'uncommon' | 'rare'
  image?: string
  upgraded?: boolean
  upgradesTo?: Partial<CardDefinition>
  generatedFrom?: {
    template: string
    seed: number
    parameters: Record<string, number>
  }
}

export interface CardInstance {
  uid: string
  definitionId: string
  upgraded: boolean
  retained?: boolean // Card stays in hand at end of turn
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
  barrier: number // Persistent block that doesn't decay
  powers: Powers
  image?: string
}

export interface PlayerEntity extends Entity {
  energy: number
  maxEnergy: number
}

export interface EnemyEntity extends Entity {
  intent: Intent
  patternIndex: number
}

// ============================================
// MONSTER DEFINITIONS
// ============================================

export interface MonsterDefinition {
  id: string
  name: string
  health: [number, number]
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
  starterDeck: string[]
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
  monsters?: string[]
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
export type AppScreen = 'menu' | 'deckBuilder' | 'game'

// Pending player selections (for scry, tutor, etc.)
export interface PendingScry {
  type: 'scry'
  cards: CardInstance[] // Cards being viewed (removed from draw pile temporarily)
}

export interface PendingTutor {
  type: 'tutor'
  cards: CardInstance[] // Cards matching filter
  sourceIndices: number[] // Original indices in source pile for removal
  from: 'drawPile' | 'discardPile'
  maxSelect: number
  destination: 'hand' | 'drawPile'
  position?: 'top' | 'bottom' | 'random'
  shuffle?: boolean
}

export type PendingSelection = PendingScry | PendingTutor

export interface CombatState {
  phase: TurnPhase
  turn: number
  player: PlayerEntity
  enemies: EnemyEntity[]
  hand: CardInstance[]
  drawPile: CardInstance[]
  discardPile: CardInstance[]
  exhaustPile: CardInstance[]
  cardsPlayedThisTurn: number
  visualQueue: VisualEvent[]
  pendingSelection?: PendingSelection
}

export interface RunState {
  gamePhase: GamePhase
  floor: number
  hero: HeroDefinition
  deck: CardInstance[]
  combat: CombatState | null
  dungeonDeck: RoomCard[]
  roomChoices: RoomCard[]
  gold: number
  stats: RunStats
}

export interface RunStats {
  enemiesKilled: number
  cardsPlayed: number
  damageDealt: number
  damageTaken: number
}

// ============================================
// EFFECT CONTEXT (for execution)
// ============================================

export interface EffectContext {
  source: 'player' | string
  cardTarget?: string
  currentTarget?: string
  powerId?: string
  powerStacks?: number
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
  | { type: 'clearVisualQueue' }
  | { type: 'resolveScry'; keptUids: string[]; discardedUids: string[] }
  | { type: 'resolveTutor'; selectedUids: string[] }

// ============================================
// VISUAL EVENTS (Animation Queue)
// ============================================

export type VisualEvent =
  | { type: 'damage'; targetId: string; amount: number; variant?: 'poison' | 'piercing' | 'combo' | 'chain' | 'execute'; element?: Element; comboName?: string }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'block'; targetId: string; amount: number; variant?: 'barrier' }
  | { type: 'draw'; count: number }
  | { type: 'discard'; cardUids: string[] }
  | { type: 'exhaust'; cardUids: string[] }
  | { type: 'addCard'; cardId: string; destination: 'hand' | 'drawPile' | 'discardPile'; count: number }
  | { type: 'powerApply'; targetId: string; powerId: string; amount: number }
  | { type: 'powerRemove'; targetId: string; powerId: string }
  | { type: 'energy'; delta: number }
  | { type: 'shuffle' }
  | { type: 'costModify'; cardUids: string[]; delta: number }
  | { type: 'conditionalTrigger'; branch: 'then' | 'else' }
  | { type: 'repeatEffect'; times: number; current: number }

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
