// ============================================
// HEAT SYSTEM
// ============================================
// Accumulated difficulty that scales with modifier use.
// Prevents runaway "juicing" by making heavily modified runs harder.
// Resets on death (along with deck reset).

import type {
  HeatState,
  HeatEffects,
  HeatTier,
  ModifierInstance,
  ModifierDefinition,
} from '../types'
import { HEAT_TIERS, DEFAULT_HEAT_STATE } from '../types'
import { getModifierDefinition } from './modifiers'

// ============================================
// HEAT CALCULATION
// ============================================

/**
 * Heat generation multipliers by durability type:
 * - Consumable: DV × 0.1 (lowest - one use)
 * - Fragile: DV × 0.15 (medium - limited uses)
 * - Permanent: DV × 0.2 (highest - always available)
 */
const HEAT_MULTIPLIERS = {
  consumable: 0.1,
  fragile: 0.15,
  permanent: 0.2,
} as const

/**
 * Additional heat from stacking modifiers.
 * Each additional modifier adds 25% more heat.
 */
const STACKING_MULTIPLIER = 0.25

/**
 * Calculate heat contribution from a single modifier.
 */
export function calculateModifierHeat(definition: ModifierDefinition): number {
  const baseHeat = definition.dangerValue * HEAT_MULTIPLIERS[definition.durability.type]
  return Math.round(baseHeat * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate total heat from a set of active modifiers.
 * Includes stacking penalty for multiple modifiers.
 */
export function calculateTotalHeat(modifiers: ModifierInstance[]): HeatState {
  if (modifiers.length === 0) {
    return { ...DEFAULT_HEAT_STATE }
  }

  const contributions: Record<string, number> = {}
  let baseHeat = 0

  // Calculate individual contributions
  for (const instance of modifiers) {
    const definition = getModifierDefinition(instance.definitionId)
    if (!definition) continue

    const heat = calculateModifierHeat(definition)
    contributions[instance.definitionId] = heat
    baseHeat += heat
  }

  // Apply stacking penalty (25% per additional modifier beyond first)
  const stackingPenalty = modifiers.length > 1 ? (modifiers.length - 1) * STACKING_MULTIPLIER : 0
  const totalHeat = Math.min(100, Math.round(baseHeat * (1 + stackingPenalty)))

  return {
    current: totalHeat,
    maxReached: totalHeat,
    baseHeat,
    modifierContributions: contributions,
  }
}

/**
 * Update heat state after completing a room.
 * Heat decays slightly with each room cleared.
 */
export function decayHeat(state: HeatState, roomType: 'combat' | 'campfire' | 'dungeon_complete'): HeatState {
  const decayAmounts = {
    combat: 2,      // -2 per regular room
    campfire: 5,    // -5 at campfires
    dungeon_complete: 15, // -15 on dungeon completion
  }

  const decay = decayAmounts[roomType]
  const newCurrent = Math.max(0, state.current - decay)

  return {
    ...state,
    current: newCurrent,
  }
}

// ============================================
// HEAT EFFECTS
// ============================================

/**
 * Get the current heat tier based on heat level.
 */
export function getHeatTier(heat: number): HeatTier {
  for (let i = HEAT_TIERS.length - 1; i >= 0; i--) {
    if (heat >= HEAT_TIERS[i].min) {
      return HEAT_TIERS[i]
    }
  }
  return HEAT_TIERS[0] // Safe tier
}

/**
 * Calculate cumulative heat effects from current heat level.
 * Effects stack from lower tiers.
 */
export function calculateHeatEffects(heat: number): HeatEffects {
  const effects: HeatEffects = {
    enemyHealthMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemyStrengthBonus: 0,
    eliteChanceBoost: 0,
    campfireReduction: 0,
    treasureReduction: 0,
    bossPhaseTwo: false,
  }

  // Apply effects from all tiers up to current heat level
  for (const tier of HEAT_TIERS) {
    if (heat >= tier.min) {
      const tierEffects = tier.effects

      // Multiplicative effects
      if (tierEffects.enemyHealthMultiplier) {
        effects.enemyHealthMultiplier *= tierEffects.enemyHealthMultiplier
      }
      if (tierEffects.enemyDamageMultiplier) {
        effects.enemyDamageMultiplier *= tierEffects.enemyDamageMultiplier
      }

      // Additive effects
      if (tierEffects.enemyStrengthBonus) {
        effects.enemyStrengthBonus += tierEffects.enemyStrengthBonus
      }
      if (tierEffects.eliteChanceBoost) {
        effects.eliteChanceBoost += tierEffects.eliteChanceBoost
      }
      if (tierEffects.campfireReduction) {
        effects.campfireReduction += tierEffects.campfireReduction
      }
      if (tierEffects.treasureReduction) {
        effects.treasureReduction += tierEffects.treasureReduction
      }

      // Boolean flags
      if (tierEffects.bossPhaseTwo) {
        effects.bossPhaseTwo = true
      }
    }
  }

  return effects
}

/**
 * Format heat for display with tier label and color.
 */
export function formatHeatDisplay(heat: number): { value: number; label: string; color: string } {
  const tier = getHeatTier(heat)
  return {
    value: heat,
    label: tier.label,
    color: tier.color,
  }
}

// ============================================
// HEAT PREVIEW
// ============================================

/**
 * Preview what heat would be if a modifier were added.
 * Used for UI to show potential heat before confirming.
 */
export function previewHeatWithModifier(
  currentModifiers: ModifierInstance[],
  newModifierId: string
): { heat: number; tier: HeatTier; change: number } {
  const definition = getModifierDefinition(newModifierId)
  if (!definition) {
    const currentHeat = calculateTotalHeat(currentModifiers)
    return {
      heat: currentHeat.current,
      tier: getHeatTier(currentHeat.current),
      change: 0,
    }
  }

  // Create temporary instance
  const tempInstance: ModifierInstance = {
    uid: 'preview',
    definitionId: newModifierId,
    appliedAt: Date.now(),
  }

  const currentHeat = calculateTotalHeat(currentModifiers)
  const newHeat = calculateTotalHeat([...currentModifiers, tempInstance])

  return {
    heat: newHeat.current,
    tier: getHeatTier(newHeat.current),
    change: newHeat.current - currentHeat.current,
  }
}
