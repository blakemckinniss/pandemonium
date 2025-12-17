// ============================================
// POWER APPLICATION
// ============================================

import type { Entity } from '../../types'
import { getPowerDefinition } from './registry'
import { logger } from '../../lib/logger'

/**
 * Apply a power to an entity, respecting stack behavior
 */
export function applyPowerToEntity(
  entity: Entity,
  powerId: string,
  amount: number,
  duration?: number
): void {
  const powerDef = getPowerDefinition(powerId)
  if (!powerDef) {
    logger.warn('Powers', `Unknown power: ${powerId}`)
    return
  }

  const existing = entity.powers[powerId]

  if (existing) {
    // Stack based on behavior
    switch (powerDef.stackBehavior) {
      case 'intensity':
        existing.amount += amount
        break
      case 'duration':
        // Duration powers use amount as turns remaining
        existing.amount = Math.max(existing.amount, amount)
        break
      case 'both':
        existing.amount += amount
        if (duration !== undefined) {
          existing.duration = Math.max(existing.duration ?? 0, duration)
        }
        break
    }
  } else {
    // New power
    entity.powers[powerId] = {
      id: powerId,
      amount,
      duration,
    }
  }
}

/**
 * Remove power stacks from an entity
 */
export function removePowerFromEntity(
  entity: Entity,
  powerId: string,
  amount?: number
): void {
  const existing = entity.powers[powerId]
  if (!existing) return

  if (amount === undefined) {
    // Remove all
    delete entity.powers[powerId]
  } else {
    existing.amount -= amount
    const powerDef = getPowerDefinition(powerId)
    if (existing.amount <= 0 && powerDef?.removeAtZero) {
      delete entity.powers[powerId]
    }
  }
}

/**
 * Decay powers at turn start/end
 * Handles both intensity decay (via decayOn) and duration decay
 */
export function decayPowers(
  entity: Entity,
  event: 'turnStart' | 'turnEnd'
): void {
  for (const [powerId, power] of Object.entries(entity.powers)) {
    const def = getPowerDefinition(powerId)
    if (!def) continue

    // Intensity decay (existing behavior)
    if (def.decayOn === event) {
      power.amount -= 1
      if (power.amount <= 0 && def.removeAtZero) {
        delete entity.powers[powerId]
        continue
      }
    }

    // Duration decay - powers with limited duration expire at turn end
    if (event === 'turnEnd' && power.duration !== undefined) {
      power.duration -= 1
      if (power.duration <= 0) {
        delete entity.powers[powerId]
      }
    }
  }
}

/**
 * Get all triggers for an entity for a specific event
 */
export function getPowerTriggers(
  entity: Entity,
  event: string
): Array<{ powerId: string; stacks: number; effects: import('../../types').AtomicEffect[] }> {
  const triggers: Array<{
    powerId: string
    stacks: number
    effects: import('../../types').AtomicEffect[]
  }> = []

  for (const [powerId, power] of Object.entries(entity.powers)) {
    const def = getPowerDefinition(powerId)
    if (!def?.triggers) continue

    for (const trigger of def.triggers) {
      if (trigger.event === event) {
        triggers.push({
          powerId,
          stacks: power.amount,
          effects: trigger.effects,
        })
      }
    }
  }

  return triggers
}
