// ============================================
// TARGETING SYSTEM
// ============================================

import type { AtomicEffectType } from './effects'

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

export type CardTheme = 'attack' | 'skill' | 'power' | 'curse' | 'status' | 'hero' | 'enemy'

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
