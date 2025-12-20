// Modifier Resolution Layer
// Computes modified game values based on active modifiers
// Uses "computed" approach (base + modifiers = result) to avoid double-application bugs

import type { ModifierInstance, ModifierDefinition, RoomType } from '../types'
import { getModifierDefinition } from './modifiers'

// ============================================
// TYPES
// ============================================

export interface ResolvedModifiers {
  goldMultiplier: number
  enemyHealthMultiplier: number
  enemyDamageMultiplier: number
  playerStartingHealthDelta: number
  playerStrengthDelta: number
  playerEnergyDelta: number
  playerDrawDelta: number
  roomDistributionDeltas: Partial<Record<RoomType, number>>
}

// ============================================
// RESOLVER
// ============================================

/**
 * Resolve all active modifiers into computed deltas/multipliers.
 * Order of operations: flat additions first, then multipliers.
 */
export function resolveModifiers(instances: ModifierInstance[]): ResolvedModifiers {
  const resolved: ResolvedModifiers = {
    goldMultiplier: 1,
    enemyHealthMultiplier: 1,
    enemyDamageMultiplier: 1,
    playerStartingHealthDelta: 0,
    playerStrengthDelta: 0,
    playerEnergyDelta: 0,
    playerDrawDelta: 0,
    roomDistributionDeltas: {},
  }

  for (const instance of instances) {
    const definition = getModifierDefinition(instance.definitionId)
    if (!definition) continue

    applyModifierEffects(definition, resolved)
  }

  return resolved
}

/**
 * Apply a single modifier's effects to the resolved state.
 */
function applyModifierEffects(def: ModifierDefinition, resolved: ResolvedModifiers): void {
  for (const effect of def.effects) {
    switch (effect.target) {
      case 'reward_scaling':
        if (effect.scope === 'gold' || effect.scope === 'all') {
          resolved.goldMultiplier *= effect.multiplier
        }
        break

      case 'enemy_stats':
        if (effect.stat === 'health') {
          if (effect.operation === 'multiply') {
            resolved.enemyHealthMultiplier *= effect.value
          } else if (effect.operation === 'add') {
            // Convert flat add to approximate multiplier (based on ~50 base HP)
            resolved.enemyHealthMultiplier *= 1 + effect.value / 50
          }
        } else if (effect.stat === 'damage') {
          if (effect.operation === 'multiply') {
            resolved.enemyDamageMultiplier *= effect.value
          } else if (effect.operation === 'add') {
            // Convert flat add to approximate multiplier (based on ~10 base damage)
            resolved.enemyDamageMultiplier *= 1 + effect.value / 10
          }
        }
        break

      case 'player_stats':
        if (effect.operation === 'add') {
          switch (effect.stat) {
            case 'startingHealth':
            case 'maxHealth':
              resolved.playerStartingHealthDelta += effect.value
              break
            case 'strength':
              resolved.playerStrengthDelta += effect.value
              break
            case 'energy':
              resolved.playerEnergyDelta += effect.value
              break
            case 'draw':
              resolved.playerDrawDelta += effect.value
              break
          }
        }
        break

      case 'room_distribution':
        if (effect.operation === 'add') {
          const current = resolved.roomDistributionDeltas[effect.roomType] ?? 0
          resolved.roomDistributionDeltas[effect.roomType] = current + effect.count
        }
        break
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Apply gold multiplier to a base reward amount.
 */
export function applyGoldMultiplier(baseGold: number, modifiers: ModifierInstance[]): number {
  const resolved = resolveModifiers(modifiers)
  return Math.floor(baseGold * resolved.goldMultiplier)
}

/**
 * Get modified room counts for dungeon generation.
 */
export function getModifiedRoomCounts(
  baseTemplate: Record<RoomType, number>,
  modifiers: ModifierInstance[]
): Record<RoomType, number> {
  const resolved = resolveModifiers(modifiers)
  const modified = { ...baseTemplate }

  for (const [roomType, delta] of Object.entries(resolved.roomDistributionDeltas)) {
    const key = roomType as RoomType
    if (key in modified) {
      modified[key] = Math.max(0, modified[key] + delta)
    }
  }

  return modified
}

/**
 * Apply enemy stat modifiers to base health/damage.
 * Returns scaled values without mutating the original.
 */
export function applyEnemyStatModifiers(
  baseHealth: number,
  baseDamage: number,
  modifiers: ModifierInstance[]
): { health: number; damage: number } {
  const resolved = resolveModifiers(modifiers)
  return {
    health: Math.floor(baseHealth * resolved.enemyHealthMultiplier),
    damage: Math.floor(baseDamage * resolved.enemyDamageMultiplier),
  }
}

/**
 * Get player stat modifications for run initialization.
 */
export function getPlayerStatModifications(modifiers: ModifierInstance[]): {
  healthDelta: number
  strengthDelta: number
  energyDelta: number
  drawDelta: number
} {
  const resolved = resolveModifiers(modifiers)
  return {
    healthDelta: resolved.playerStartingHealthDelta,
    strengthDelta: resolved.playerStrengthDelta,
    energyDelta: resolved.playerEnergyDelta,
    drawDelta: resolved.playerDrawDelta,
  }
}
