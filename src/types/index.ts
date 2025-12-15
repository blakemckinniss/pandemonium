// ============================================
// PANDEMONIUM - Type Definitions
// ============================================

// Card Variants
export type CardVariant = 'player' | 'hand' | 'enemy' | 'room'
export type CardTheme = 'attack' | 'skill' | 'power' | 'curse' | 'status' | 'hero' | 'enemy'

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
  | 'none' // No target (for hero cards and other non-targeted effects)
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
  | 'lastPlayed'

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

// For effects that use the power's stack amount as the value
export interface PowerAmountValue {
  type: 'powerAmount'
}

export type EffectValue = number | FixedValue | RangeValue | ScaledValue | GeneratedScaledValue | PowerAmountValue

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

export interface CardsPlayedCondition {
  type: 'cardsPlayed'
  op: ComparisonOp
  value: number
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
  | CardsPlayedCondition
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

export interface BanishEffect {
  type: 'banish'
  target: CardTarget | FilteredCardTarget
  amount?: EffectValue
  playerChoice?: boolean // If true, show selection UI instead of auto-banishing
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

export interface CopyCardEffect {
  type: 'copyCard'
  target: CardTarget | FilteredCardTarget
  destination: 'hand' | 'drawPile' | 'discardPile'
  position?: 'top' | 'bottom' | 'random'
  count?: EffectValue
}

export interface PutOnDeckEffect {
  type: 'putOnDeck'
  target: CardTarget | FilteredCardTarget
  position?: 'top' | 'bottom' | 'random'
}

export interface ModifyCostEffect {
  type: 'modifyCost'
  target: CardTarget | FilteredCardTarget
  amount: EffectValue // Negative = reduce, positive = increase
  duration?: 'turn' | 'combat' | 'permanent'
}

// --- HEALTH EFFECTS ---

export interface MaxHealthEffect {
  type: 'maxHealth'
  amount: EffectValue
  target?: EntityTarget
  operation: 'gain' | 'lose' | 'set'
}

export interface SetHealthEffect {
  type: 'setHealth'
  amount: EffectValue
  target?: EntityTarget
}

// --- BLOCK EFFECTS ---

export interface DestroyBlockEffect {
  type: 'destroyBlock'
  target: EntityTarget
  amount?: EffectValue // If omitted, destroys all block
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

// --- CARD REPLAY EFFECTS ---

export interface ReplayCardEffect {
  type: 'replayCard'
  target: CardTarget | FilteredCardTarget
  times?: EffectValue // Number of times to replay (default 1)
  free?: boolean // If true, don't pay energy cost
  exhaustAfter?: boolean // If true, exhaust the card after playing
}

export interface PlayTopCardEffect {
  type: 'playTopCard'
  pile: 'drawPile' | 'discardPile'
  count?: EffectValue // Number of cards to play (default 1)
  exhaust?: boolean // If true, exhaust instead of discard
}

// --- RESOURCE EFFECTS ---

export interface GoldEffect {
  type: 'gold'
  amount: EffectValue
  operation: 'gain' | 'lose' | 'set'
}

// --- DISCOVERY EFFECTS ---

export interface DiscoverEffect {
  type: 'discover'
  count: number // How many cards to show (usually 3)
  filter?: CardFilter // Filter for card pool
  pool?: 'all' | 'common' | 'uncommon' | 'rare' | 'attack' | 'skill' | 'power'
  destination?: 'hand' | 'drawPile' | 'discardPile' // Where chosen card goes (default hand)
  copies?: number // How many to add (default 1)
  exhaust?: boolean // If true, the added card exhausts when played
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
  | DestroyBlockEffect
  | MaxHealthEffect
  | SetHealthEffect
  // Resource
  | EnergyEffect
  | GoldEffect
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
  | CopyCardEffect
  | PutOnDeckEffect
  | ModifyCostEffect
  | DiscoverEffect
  | BanishEffect
  // Power
  | ApplyPowerEffect
  | RemovePowerEffect
  | TransferPowerEffect
  // Replay
  | ReplayCardEffect
  | PlayTopCardEffect
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
  | 'onAttackPlayed'
  | 'onSkillPlayed'
  | 'onPowerPlayed'
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

// Hero-specific stats (only for theme: 'hero')
export interface HeroStats {
  health: number // Starting/max health
  energy: number // Energy per turn
  drawPerTurn: number // Cards drawn per turn (default: 5)
}

// Hero activated ability (usable once per turn)
export interface HeroActivated {
  effects: AtomicEffect[]
  energyCost: number
  description?: string
}

// Hero ultimate ability (charges over turns)
export interface HeroUltimate {
  effects: AtomicEffect[]
  chargesRequired: number // Turns to fully charge
  chargeOn: 'turnStart' | 'turnEnd' | 'cardPlayed' | 'damage'
  description?: string
}

// ============================================
// ENEMY CARD SYSTEM (parallel to Hero cards)
// ============================================

// Enemy-specific stats (only for theme: 'enemy')
export interface EnemyStats {
  healthRange: [number, number] // Min/max HP (randomized at spawn)
  baseDamage: number // Default attack damage
  energy: number // Energy pool per turn (like heroes)

  // Elemental properties
  element?: Element
  vulnerabilities?: Element[]
  resistances?: Element[]
  innateStatus?: ElementalStatus

  // Intent pattern (cycle through these)
  intentPattern?: IntentType[]
}

// Enemy ability (activated on their turn based on AI/energy)
export interface EnemyAbility {
  id: string
  name: string
  description: string
  effects: AtomicEffect[]
  energyCost: number // Energy required to use
  cooldown?: number // Turns between uses (0 = no cooldown)
  condition?: Condition // When AI should use this (health threshold, etc.)
}

// Enemy ultimate (triggers at low health or special conditions)
export interface EnemyUltimate {
  id: string
  name: string
  description: string
  effects: AtomicEffect[]
  trigger: 'lowHealth' | 'enraged' | 'turnCount' | 'custom'
  triggerValue?: number // HP% threshold or turn count
}

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
  ethereal?: boolean // Card exhausts if not played by end of turn
  upgradesTo?: Partial<CardDefinition>
  generatedFrom?: {
    template: string
    seed: number
    parameters: Record<string, number | string>
  }
  // Hero-specific fields (only for theme: 'hero')
  heroStats?: HeroStats
  archetype?: string // AI-generated class (e.g., "Pyromancer", "Guardian")
  passive?: AtomicEffect[] // Effects applied at combat start
  activated?: HeroActivated // Ability usable once per turn
  ultimate?: HeroUltimate // Powerful ability that charges over time

  // Enemy-specific fields (only for theme: 'enemy')
  enemyStats?: EnemyStats
  enemyAbility?: EnemyAbility // Ability enemy can use (costs energy)
  enemyUltimate?: EnemyUltimate // Triggers at threshold (low health, etc.)
}

export interface CardInstance {
  uid: string
  definitionId: string
  upgraded: boolean
  retained?: boolean // Card stays in hand at end of turn
  ethereal?: boolean // Card exhausts if not played by end of turn
  costModifier?: number // Temporary cost adjustment (negative = cheaper)
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
  // Hero ability state
  heroCardId?: string // Reference to hero CardDefinition
  activatedUsedThisTurn?: boolean
  ultimateCharges?: number
  ultimateReady?: boolean
}

export interface EnemyEntity extends Entity {
  intent: Intent
  patternIndex: number
  // Elemental properties
  element?: Element // Primary element affinity
  vulnerabilities?: Element[] // Takes 1.5x damage from these elements
  resistances?: Element[] // Takes 0.5x damage from these elements
  innateStatus?: ElementalStatus // Starts combat with this status

  // Enemy card reference (for theme: 'enemy' cards)
  cardId?: string // Reference to enemy CardDefinition

  // Enemy ability state (when created from enemy card)
  energy?: number // Current energy pool
  maxEnergy?: number // Max energy per turn
  abilityCooldown?: number // Turns until ability is usable again
  ultimateTriggered?: boolean // Has ultimate already fired?
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

// Legacy HeroDefinition - kept for backwards compatibility during migration
export interface HeroDefinition {
  id: string
  name: string
  health: number
  energy: number
  image?: string
  starterDeck: string[]
}

// Runtime hero state during a run - references hero card
export interface HeroState {
  heroCardId?: string // Reference to hero CardDefinition (theme: 'hero') - optional for migration
  currentHealth: number
  maxHealth: number
  // Fallback fields for migration (from legacy HeroDefinition)
  id?: string
  name?: string
  health?: number
  energy?: number
  image?: string
  starterDeck?: string[]
}

// ============================================
// ROOM / DUNGEON
// ============================================

export type RoomType = 'combat' | 'elite' | 'boss' | 'campfire' | 'event' | 'shop' | 'treasure'

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
  enemyCardIds?: string[] // For combat rooms: which enemy cards to spawn (overrides room definition)
}

// ============================================
// DUNGEON DECK DEFINITIONS
// ============================================

export interface DungeonRoom {
  id: string
  type: RoomType
  enemyCardIds?: string[] // For combat rooms: which enemy cards to spawn
  modifiers?: RoomModifier[]
}

export interface RoomModifier {
  type: 'elite' | 'boss' | 'doubleEnemy' | 'noReward' | 'enhancedReward'
  value?: number
}

/**
 * A saveable dungeon deck template that defines a complete run structure.
 * Can be Groq-generated, player-modified, or system-created.
 */
export interface DungeonDeckDefinition {
  id: string
  name: string
  description: string
  theme?: string // "Fire Caverns", "Void Temple", etc.
  difficulty: 1 | 2 | 3 | 4 | 5

  // Room composition
  rooms: DungeonRoom[]

  // Metadata
  createdBy: 'groq' | 'player' | 'system'
  createdAt: number
}

/**
 * Tracks player ownership of dungeon decks with roguelike consequences.
 * - Beat deck → Special reward scaled to difficulty
 * - Abandon deck → Gold cost penalty
 * - Die → Lose deck + death penalties
 */
export interface OwnedDungeonDeck {
  deckId: string
  acquiredAt: number
  status: 'available' | 'active' | 'beaten' | 'abandoned' | 'lost'
  attemptsCount: number
  bestFloor: number
  completedAt?: number
}

// ============================================
// GAME STATE
// ============================================

export type TurnPhase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat'
export type GamePhase = 'menu' | 'roomSelect' | 'combat' | 'reward' | 'campfire' | 'treasure' | 'dungeonComplete' | 'gameOver'
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

export interface PendingDiscover {
  type: 'discover'
  cards: CardDefinition[] // Generated card options to choose from
  maxSelect: number // How many cards to pick (usually 1)
  destination: 'hand' | 'drawPile' | 'discardPile'
  copies?: number // How many copies of chosen card to add
}

export interface PendingBanish {
  type: 'banish'
  cards: CardInstance[] // Cards available to banish
  from: CardTarget | FilteredCardTarget // Source pile
  maxSelect: number // How many to select
}

export type PendingSelection = PendingScry | PendingTutor | PendingDiscover | PendingBanish

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
  lastPlayedCard?: CardInstance // Most recently played card this turn
  visualQueue: VisualEvent[]
  pendingSelection?: PendingSelection
}

export interface RunState {
  gamePhase: GamePhase
  floor: number
  hero: HeroState
  deck: CardInstance[]
  relics: RelicInstance[]
  combat: CombatState | null
  dungeonDeck: RoomCard[]
  roomChoices: RoomCard[]
  currentRoomId?: string // The room definition ID of current/just-completed room
  gold: number
  stats: RunStats
  // Dungeon deck tracking (for roguelike ownership)
  dungeonDeckId?: string // Reference to DungeonDeckDefinition.id
}

// ============================================
// RELICS
// ============================================

export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'boss'

export type RelicTrigger =
  | 'onCombatStart'
  | 'onCombatEnd'
  | 'onTurnStart'
  | 'onTurnEnd'
  | 'onCardPlayed'
  | 'onAttack'
  | 'onKill'
  | 'onDamaged'
  | 'onHeal'
  | 'onGoldGained'
  | 'passive'

export interface RelicDefinition {
  id: string
  name: string
  description: string
  rarity: RelicRarity
  image?: string
  trigger: RelicTrigger
  effects?: AtomicEffect[]
  // For passive relics that modify stats
  modifiers?: {
    maxHealth?: number
    startingEnergy?: number
    startingDraw?: number
    goldMultiplier?: number
  }
}

export interface RelicInstance {
  id: string
  definitionId: string
  counter?: number // For relics that track uses/stacks
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
  source: string
  cardUid?: string // The card being played/replayed
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
  | { type: 'resolveDiscover'; selectedCardIds: string[] }
  | { type: 'resolveBanish'; selectedUids: string[] }
  // Hero abilities
  | { type: 'useActivatedAbility' }
  | { type: 'useUltimateAbility' }

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
  | { type: 'banish'; cardUids: string[] }
  | { type: 'addCard'; cardId: string; destination: 'hand' | 'drawPile' | 'discardPile'; count: number }
  | { type: 'powerApply'; targetId: string; powerId: string; amount: number }
  | { type: 'powerRemove'; targetId: string; powerId: string }
  | { type: 'energy'; delta: number }
  | { type: 'gold'; delta: number }
  | { type: 'shuffle' }
  | { type: 'costModify'; cardUids: string[]; delta: number }
  | { type: 'conditionalTrigger'; branch: 'then' | 'else' }
  | { type: 'repeatEffect'; times: number; current: number }
  | { type: 'replay'; cardUid: string; times: number }
  | { type: 'playTopCard'; cardId: string; fromPile: 'drawPile' | 'discardPile' }
  | { type: 'maxHealth'; targetId: string; delta: number }
  | { type: 'upgrade'; cardUids: string[] }
  | { type: 'retain'; cardUids: string[] }
  | { type: 'transform'; cardUid: string; fromCardId: string; toCardId: string }
  | { type: 'cardPlayed'; cardUid: string; theme: CardTheme; targetId?: string }
  | { type: 'comboMilestone'; count: number }
  | { type: 'putOnDeck'; cardUids: string[]; position: 'top' | 'bottom' | 'random' }
  | { type: 'powerTrigger'; targetId: string; powerId: string; triggerEvent: string }
  | { type: 'relicTrigger'; relicId: string; relicDefId: string; trigger: RelicTrigger }
  | { type: 'enemyDeath'; enemyId: string }
  // Hero abilities
  | { type: 'heroActivated'; heroCardId: string }
  | { type: 'heroUltimate'; heroCardId: string }
  | { type: 'heroUltimateReady'; heroCardId: string }
  | { type: 'heroUltimateCharge'; heroCardId: string; charges: number; required: number }
  // Enemy abilities
  | { type: 'enemyAbility'; entityId: string; abilityName: string }
  | { type: 'enemyUltimate'; entityId: string; ultimateName: string }

// ============================================
// COMBAT NUMBERS (FCT)
// ============================================

export interface CombatNumber {
  id: string
  value: number
  type: 'damage' | 'heal' | 'block' | 'maxHealth' | 'combo' | 'gold'
  targetId: string
  x: number
  y: number
  element?: Element
  variant?: 'poison' | 'piercing' | 'combo' | 'chain' | 'execute'
  comboName?: string
  label?: string // Custom label like "Max HP"
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
