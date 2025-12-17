// ============================================
// POWER SYSTEM
// ============================================

import type { AtomicEffect } from './effects'

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
