// ============================================
// ENTITIES (Player, Enemy)
// ============================================

import type { Powers } from './powers'
import type { Element, ElementalStatus } from './elements'
import type { Intent } from './cards'

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
  // Modifier bonuses (from Dungeon Deck modifiers)
  strengthBonus?: number
  energyBonus?: number
  drawBonus?: number
}
