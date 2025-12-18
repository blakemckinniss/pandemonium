// ============================================
// CARDS
// ============================================

import type { Element } from './elements'
import type { EffectValue } from './values'
import type { EntityTarget, CardTheme } from './targeting'
import type { AtomicEffect } from './effects'

// Card Variants
export type CardVariant = 'player' | 'hand' | 'enemy' | 'room'
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'ultra-rare' | 'legendary' | 'mythic' | 'ancient'

// Card Filtering & Sorting
export interface CardFilters {
  themes: CardTheme[]
  rarities: CardRarity[]
  elements: Element[]
  energyRange: [number, number]
  owned: boolean | null // true=owned only, false=unowned, null=all
  searchQuery: string
}

export type SortOption = 'name' | 'rarity' | 'energy' | 'theme' | 'element'
export type SortDirection = 'asc' | 'desc'

export const DEFAULT_FILTERS: CardFilters = {
  themes: [],
  rarities: [],
  elements: [],
  energyRange: [0, 10],
  owned: null,
  searchQuery: '',
}

// Rarity order for sorting (higher = rarer)
export const RARITY_ORDER: Record<CardRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  'ultra-rare': 5,
  legendary: 6,
  mythic: 7,
  ancient: 8,
}

// ============================================
// HERO CARDS
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
// ENEMY CARDS
// ============================================

// Intent system for enemies
export type IntentType = 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown'

export interface Intent {
  type: IntentType
  value?: number
  times?: number  // For multi-hit attacks (e.g., 3x5 damage)
}

// Enemy-specific stats (only for theme: 'enemy')
export interface EnemyStats {
  healthRange: [number, number] // Min/max HP (randomized at spawn)
  baseDamage: number // Default attack damage
  energy: number // Energy pool per turn (like heroes)

  // Elemental properties
  element?: Element
  vulnerabilities?: Element[]
  resistances?: Element[]
  innateStatus?: import('./elements').ElementalStatus

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
  condition?: import('./conditions').Condition // When AI should use this (health threshold, etc.)
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

// ============================================
// CARD DEFINITION
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
  rarity?: CardRarity
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
  innate?: boolean // Card draws at start of combat
  unplayable?: boolean | 'combat' // Card cannot be played (true = this turn, 'combat' = all combat)
}
