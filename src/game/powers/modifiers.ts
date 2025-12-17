// ============================================
// DAMAGE/BLOCK MODIFIERS
// ============================================

import type { Entity } from '../../types'
import { getPowerDefinition } from './registry'

/**
 * Apply outgoing damage modifiers (Strength, Weak)
 * Strength: +X flat damage
 * Weak: *0.75 multiplier
 */
export function applyOutgoingDamageModifiers(
  baseDamage: number,
  attacker: Entity
): number {
  let damage = baseDamage

  // Strength: additive
  const strength = attacker.powers['strength']
  if (strength) {
    damage += strength.amount
  }

  // Weak: multiplicative (round down)
  const weak = attacker.powers['weak']
  if (weak) {
    const weakDef = getPowerDefinition('weak')
    if (weakDef?.modifiers?.outgoingDamage) {
      damage = Math.floor(damage * weakDef.modifiers.outgoingDamage)
    }
  }

  return Math.max(0, damage)
}

/**
 * Apply incoming damage modifiers (Vulnerable, Intangible)
 * Vulnerable: *1.5 multiplier
 * Intangible: reduces all damage to 1
 */
export function applyIncomingDamageModifiers(
  baseDamage: number,
  defender: Entity
): number {
  let damage = baseDamage

  // Intangible: reduces all damage to 1 (checked first, overrides everything)
  const intangible = defender.powers['intangible']
  if (intangible && damage > 0) {
    return 1
  }

  // Vulnerable: multiplicative (round down)
  const vulnerable = defender.powers['vulnerable']
  if (vulnerable) {
    const vulnDef = getPowerDefinition('vulnerable')
    if (vulnDef?.modifiers?.incomingDamage) {
      damage = Math.floor(damage * vulnDef.modifiers.incomingDamage)
    }
  }

  return Math.max(0, damage)
}

/**
 * Apply outgoing block modifiers (Dexterity, Frail)
 * Dexterity: +X flat block
 * Frail: *0.75 multiplier
 */
export function applyOutgoingBlockModifiers(
  baseBlock: number,
  blocker: Entity
): number {
  let block = baseBlock

  // Dexterity: additive
  const dexterity = blocker.powers['dexterity']
  if (dexterity) {
    block += dexterity.amount
  }

  // Frail: multiplicative (round down)
  const frail = blocker.powers['frail']
  if (frail) {
    const frailDef = getPowerDefinition('frail')
    if (frailDef?.modifiers?.outgoingBlock) {
      block = Math.floor(block * frailDef.modifiers.outgoingBlock)
    }
  }

  return Math.max(0, block)
}
