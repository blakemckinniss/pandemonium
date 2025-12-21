// ============================================
// DUNGEON DECK MODIFIERS
// ============================================
// Cards that modify dungeon deck composition and run rules.
// Categories: Catalysts (trade-offs), Omens (curses), Edicts (rules), Seals (restrictions)

import type { Element } from './elements'
import type { RoomType } from './rooms'
import type { DeckHookDefinition } from './deck-builder'

// ============================================
// MODIFIER TAXONOMY
// ============================================

/**
 * Modifier category determines naming flavor and effect style:
 * - catalyst: Active trade-offs, transmutation ("becomes", "+X/-Y")
 * - omen: Curses, prophecies, inevitable doom ("shall", dark themes)
 * - edict: Rule changes, decrees from above ("must/cannot", laws)
 * - seal: Lockouts, binding contracts ("forbidden", restrictions)
 */
export type ModifierCategory = 'catalyst' | 'omen' | 'edict' | 'seal'

export type ModifierRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

/**
 * Durability determines how long a modifier lasts:
 * - consumable: One-use, destroyed after single run
 * - fragile: Limited uses (3-5), can be repaired
 * - permanent: Always available once owned (extremely rare)
 */
export type ModifierDurability =
  | { type: 'consumable' }
  | { type: 'fragile'; uses: number; maxUses: number }
  | { type: 'permanent' }

// ============================================
// MODIFIER EFFECTS
// ============================================

/**
 * What aspects of the run a modifier can affect
 */
export type ModifierEffectTarget =
  | 'room_distribution'   // Change room type counts
  | 'rarity_odds'         // Affect reward/enemy rarity weights
  | 'enemy_stats'         // Modify enemy HP/damage/strength
  | 'player_stats'        // Modify starting HP/energy/draw
  | 'element_affinity'    // Boost/penalize elemental damage
  | 'deck_size'           // Adjust dungeon deck size (24-36)
  | 'reward_scaling'      // Multiply/reduce gold and rewards
  | 'card_rewards'        // Extra card choices, rarity boosts
  | 'relic_rewards'       // Extra relic chances, rarity boosts
  | 'curse_injection'     // Add curse cards to player deck

export type ModifierOperation = 'add' | 'multiply' | 'set' | 'remove'

/**
 * Room distribution modification
 */
export interface RoomDistributionEffect {
  target: 'room_distribution'
  roomType: RoomType
  operation: 'add' | 'remove' | 'set'
  count: number
}

/**
 * Rarity odds modification (multiplier-based)
 */
export interface RarityOddsEffect {
  target: 'rarity_odds'
  scope: 'cards' | 'relics' | 'enemies' | 'all'
  rarityBoosts: Partial<Record<'common' | 'uncommon' | 'rare' | 'legendary', number>>
}

/**
 * Enemy stat modification
 */
export interface EnemyStatsEffect {
  target: 'enemy_stats'
  scope: 'all' | 'elites' | 'boss' | 'combat'
  stat: 'health' | 'damage' | 'strength' | 'block'
  operation: 'add' | 'multiply'
  value: number
}

/**
 * Player stat modification (applied at run start)
 */
export interface PlayerStatsEffect {
  target: 'player_stats'
  stat: 'maxHealth' | 'startingHealth' | 'energy' | 'draw' | 'strength' | 'dexterity'
  operation: 'add' | 'multiply'
  value: number
}

/**
 * Elemental affinity modification
 */
export interface ElementAffinityEffect {
  target: 'element_affinity'
  element: Element
  damageMultiplier?: number     // Outgoing damage of this element
  resistanceMultiplier?: number // Incoming damage of this element
  cardChance?: number           // Chance to see cards of this element
}

/**
 * Deck size modification
 */
export interface DeckSizeEffect {
  target: 'deck_size'
  operation: 'add' | 'set'
  value: number // Final size clamped to 24-36
}

/**
 * Reward scaling modification
 */
export interface RewardScalingEffect {
  target: 'reward_scaling'
  scope: 'gold' | 'all'
  multiplier: number
}

/**
 * Card reward modification
 */
export interface CardRewardsEffect {
  target: 'card_rewards'
  extraChoices?: number
  rarityBoost?: number // Tiers to add (1 = common->uncommon)
  removeBasics?: number // Remove N basic cards from rewards
}

/**
 * Relic reward modification
 */
export interface RelicRewardsEffect {
  target: 'relic_rewards'
  extraChance?: number // Additional % chance for relic drop
  rarityBoost?: number // Tiers to add
}

/**
 * Curse injection
 */
export interface CurseInjectionEffect {
  target: 'curse_injection'
  count: number
  curseIds?: string[] // Specific curses, or random if not specified
}

/**
 * Union of all modifier effect types
 */
export type ModifierEffect =
  | RoomDistributionEffect
  | RarityOddsEffect
  | EnemyStatsEffect
  | PlayerStatsEffect
  | ElementAffinityEffect
  | DeckSizeEffect
  | RewardScalingEffect
  | CardRewardsEffect
  | RelicRewardsEffect
  | CurseInjectionEffect

// ============================================
// MODIFIER DEFINITION & INSTANCE
// ============================================

/**
 * Template/definition for a modifier card.
 * Similar to CardDefinition - the "blueprint" for modifier instances.
 */
export interface ModifierDefinition {
  id: string
  name: string
  description: string
  flavorText?: string
  category: ModifierCategory
  rarity: ModifierRarity
  image?: string

  // Balance values (1-10 scale for AI validation)
  dangerValue: number  // How much harder the run becomes
  rewardValue: number  // Compensation for danger

  // Durability model
  durability: ModifierDurability

  // Actual effects
  effects: ModifierEffect[]

  // Deck building hook (modifies starter deck)
  deckHook?: DeckHookDefinition

  // Generation metadata (if AI-generated)
  generatedBy?: 'system' | 'groq'
  generatedAt?: number
}

/**
 * Runtime instance of a modifier in a run.
 * Tracks uses remaining for fragile modifiers.
 */
export interface ModifierInstance {
  uid: string
  definitionId: string
  usesRemaining?: number // For fragile modifiers
  appliedAt: number      // Timestamp when applied to run
}

/**
 * Owned modifier in player's collection.
 * Tracks quantity and acquisition source.
 */
export interface OwnedModifier {
  definitionId: string
  quantity: number
  obtainedAt: number
  source: 'reward' | 'purchase' | 'starter' | 'achievement' | 'generated'
}

// ============================================
// COMPUTED MODIFIER STATE
// ============================================

/**
 * Aggregated effects from all active modifiers.
 * Computed once at run start, cached for performance.
 */
export interface ComputedModifierEffects {
  // Room distribution overrides
  roomDistribution: Partial<Record<RoomType, number>>

  // Stat multipliers
  enemyHealthMultiplier: number
  enemyDamageMultiplier: number
  playerMaxHealthModifier: number
  playerEnergyModifier: number
  playerDrawModifier: number
  playerStrengthModifier: number

  // Reward multipliers
  goldMultiplier: number
  cardRarityBoost: number
  relicRarityBoost: number
  extraCardChoices: number
  extraRelicChance: number

  // Element affinities
  elementAffinities: Partial<Record<Element, {
    damageMultiplier: number
    resistanceMultiplier: number
  }>>

  // Deck size
  deckSizeModifier: number

  // Curses to add
  cursesToInject: string[]
}

// ============================================
// PACK TYPES
// ============================================

/**
 * Configuration for modifier pack generation
 */
export interface ModifierPackConfig {
  size: number
  rarityWeights: {
    common: number
    uncommon: number
    rare: number
    legendary: number
  }
  categoryWeights?: Partial<Record<ModifierCategory, number>>
  guaranteedRare?: boolean
}

/**
 * Modifier pack definition (purchasable)
 */
export interface ModifierPack {
  id: string
  name: string
  description: string
  price: number
  config: ModifierPackConfig
}
