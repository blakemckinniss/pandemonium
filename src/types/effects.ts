// ============================================
// ATOMIC EFFECTS
// ============================================

import type { EffectValue } from './values'
import type { EntityTarget, CardTarget, FilteredCardTarget, CardFilter } from './targeting'
import type { Condition } from './conditions'
import type { Element } from './elements'

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

// --- ADVANCED COMBAT EFFECTS ---

export interface ExecuteEffect {
  type: 'execute'
  amount: EffectValue // Base damage
  target?: EntityTarget
  threshold: number // HP percentage (e.g., 0.5 = 50% HP)
  bonusMultiplier: number // Damage multiplier when below threshold (e.g., 2 = double)
  element?: Element
}

export interface SplashEffect {
  type: 'splash'
  amount: EffectValue // Damage to primary target
  splashAmount: EffectValue // Damage to secondary targets
  target: EntityTarget // Primary target
  splashTargets?: 'all_enemies' | 'adjacent' // Who gets splash (default all_enemies)
  element?: Element
}

export interface RecoilEffect {
  type: 'recoil'
  amount: EffectValue // Damage dealt to self
  target?: EntityTarget // Who takes recoil (default self)
}

export interface CounterAttackEffect {
  type: 'counterAttack'
  amount: EffectValue // Damage when triggered
  duration?: number // Turns active (default 1)
  triggersRemaining?: number // Max triggers (default unlimited)
}

export interface ChainEffect {
  type: 'chain'
  amount: EffectValue // Base damage
  bounces: number // Number of times to bounce
  decay?: number // Damage reduction per bounce (0-1, default 0.2 = 20% less each)
  element?: Element
}

// --- DECK MANIPULATION EFFECTS ---

export interface MillEffect {
  type: 'mill'
  amount: EffectValue // Cards to discard from deck
  target?: 'drawPile' | 'enemy' // Whose deck (default drawPile, enemy for enemy mill)
}

export interface CreateRandomCardEffect {
  type: 'createRandomCard'
  filter?: CardFilter
  pool?: 'all' | 'common' | 'uncommon' | 'rare' | 'attack' | 'skill' | 'power'
  destination: 'hand' | 'drawPile' | 'discardPile'
  count?: EffectValue
  upgraded?: boolean
}

export interface InnateEffect {
  type: 'innate'
  target: CardTarget | FilteredCardTarget
}

export interface EtherealEffect {
  type: 'ethereal'
  target: CardTarget | FilteredCardTarget
}

export interface UnplayableEffect {
  type: 'unplayable'
  target: CardTarget | FilteredCardTarget
  duration?: 'turn' | 'combat' // Default turn
}

// --- POWER MANIPULATION EFFECTS ---

export interface StealPowerEffect {
  type: 'stealPower'
  powerId?: string // Specific power, or omit to steal random buff
  from: EntityTarget
  to?: EntityTarget // Default self
  amount?: EffectValue // Stacks to steal (default all)
}

export interface SilencePowerEffect {
  type: 'silencePower'
  powerId?: string // Specific power, or omit to silence all
  target: EntityTarget
  duration?: number // Turns to silence (default 1)
}

// --- ENEMY MANIPULATION EFFECTS ---

export interface WeakenIntentEffect {
  type: 'weakenIntent'
  amount: EffectValue // Reduce intent damage by this amount
  target: EntityTarget
}

// --- DELAYED EFFECTS ---

export interface DelayedEffect {
  type: 'delayed'
  delay: number // Turns until effect triggers
  effects: AtomicEffect[] // Effects to execute when triggered
  trigger?: 'turnStart' | 'turnEnd' // When to check (default turnStart)
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
  // Advanced Combat
  | ExecuteEffect
  | SplashEffect
  | RecoilEffect
  | CounterAttackEffect
  | ChainEffect
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
  // Deck Manipulation
  | MillEffect
  | CreateRandomCardEffect
  | InnateEffect
  | EtherealEffect
  | UnplayableEffect
  // Power
  | ApplyPowerEffect
  | RemovePowerEffect
  | TransferPowerEffect
  | StealPowerEffect
  | SilencePowerEffect
  // Enemy Manipulation
  | WeakenIntentEffect
  // Delayed
  | DelayedEffect
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
