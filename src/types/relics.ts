// ============================================
// RELICS
// ============================================

import type { AtomicEffect } from './effects'

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
