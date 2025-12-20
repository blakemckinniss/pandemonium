// ============================================
// REGISTRY REFERENCE VALIDATORS
// Layer 2: Validate powerId/cardId against registries
// ============================================

import { getAllPowers } from '../../powers'
import { getAllCards } from '../../cards'
import type { ValidationWarning } from './index'

// Cached power IDs (static at runtime)
let cachedPowerIds: Set<string> | null = null

function getPowerIds(): Set<string> {
  if (!cachedPowerIds) {
    const powers = getAllPowers()
    cachedPowerIds = new Set(powers.map((p) => p.id))
  }
  return cachedPowerIds
}

// Card IDs are NOT cached (can be dynamic with generated cards)
function getCardIds(): Set<string> {
  const cards = getAllCards()
  return new Set(cards.map((c) => c.id))
}

interface RefValidationResult {
  valid: boolean
  errors: string[]
  warnings: ValidationWarning[]
}

/**
 * Validate all power references in effects
 */
export function validatePowerRefs(
  effects: unknown[],
  path: string[] = []
): RefValidationResult {
  const powerIds = getPowerIds()
  const errors: string[] = []
  const warnings: ValidationWarning[] = []

  function checkEffect(effect: unknown, currentPath: string[]): void {
    if (!effect || typeof effect !== 'object') return
    const e = effect as Record<string, unknown>

    // Check powerId field
    if ('powerId' in e && typeof e.powerId === 'string') {
      if (!powerIds.has(e.powerId)) {
        errors.push(
          `Unknown powerId "${e.powerId}" at ${currentPath.join('.')}`
        )
      }
    }

    // Recursively check nested effects
    if ('effects' in e && Array.isArray(e.effects)) {
      e.effects.forEach((nested, i) => {
        checkEffect(nested, [...currentPath, 'effects', String(i)])
      })
    }

    // Check 'then' and 'else' for conditional effects
    if ('then' in e && Array.isArray(e.then)) {
      e.then.forEach((nested, i) => {
        checkEffect(nested, [...currentPath, 'then', String(i)])
      })
    }
    if ('else' in e && Array.isArray(e.else)) {
      e.else.forEach((nested, i) => {
        checkEffect(nested, [...currentPath, 'else', String(i)])
      })
    }

    // Check 'choices' for random effects
    if ('choices' in e && Array.isArray(e.choices)) {
      e.choices.forEach((choice, i) => {
        if (Array.isArray(choice)) {
          choice.forEach((nested, j) => {
            checkEffect(nested, [...currentPath, 'choices', String(i), String(j)])
          })
        }
      })
    }
  }

  effects.forEach((effect, i) => {
    checkEffect(effect, [...path, String(i)])
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate all card references in effects
 */
export function validateCardRefs(
  effects: unknown[],
  path: string[] = []
): RefValidationResult {
  const cardIds = getCardIds()
  const errors: string[] = []
  const warnings: ValidationWarning[] = []

  function checkEffect(effect: unknown, currentPath: string[]): void {
    if (!effect || typeof effect !== 'object') return
    const e = effect as Record<string, unknown>

    // Check cardId field (addCard, addStatusCard effects)
    if ('cardId' in e && typeof e.cardId === 'string') {
      // Allow special status card IDs that may be defined elsewhere
      const specialStatusCards = ['wound', 'dazed', 'burn', 'curse', 'slime']
      if (!cardIds.has(e.cardId) && !specialStatusCards.includes(e.cardId)) {
        errors.push(
          `Unknown cardId "${e.cardId}" at ${currentPath.join('.')}`
        )
      }
    }

    // Check toCardId for transform effects
    if ('toCardId' in e && typeof e.toCardId === 'string') {
      if (!cardIds.has(e.toCardId)) {
        errors.push(
          `Unknown toCardId "${e.toCardId}" at ${currentPath.join('.')}`
        )
      }
    }

    // Recursively check nested effects
    if ('effects' in e && Array.isArray(e.effects)) {
      e.effects.forEach((nested, i) => {
        checkEffect(nested, [...currentPath, 'effects', String(i)])
      })
    }

    if ('then' in e && Array.isArray(e.then)) {
      e.then.forEach((nested, i) => {
        checkEffect(nested, [...currentPath, 'then', String(i)])
      })
    }
    if ('else' in e && Array.isArray(e.else)) {
      e.else.forEach((nested, i) => {
        checkEffect(nested, [...currentPath, 'else', String(i)])
      })
    }

    if ('choices' in e && Array.isArray(e.choices)) {
      e.choices.forEach((choice, i) => {
        if (Array.isArray(choice)) {
          choice.forEach((nested, j) => {
            checkEffect(nested, [...currentPath, 'choices', String(i), String(j)])
          })
        }
      })
    }
  }

  effects.forEach((effect, i) => {
    checkEffect(effect, [...path, String(i)])
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate all registry references (powers + cards)
 */
export function validateRegistryRefs(
  effects: unknown[],
  path: string[] = []
): RefValidationResult {
  const powerResult = validatePowerRefs(effects, path)
  const cardResult = validateCardRefs(effects, path)

  return {
    valid: powerResult.valid && cardResult.valid,
    errors: [...powerResult.errors, ...cardResult.errors],
    warnings: [...powerResult.warnings, ...cardResult.warnings],
  }
}

/**
 * Clear cached power IDs (for testing or hot reload)
 */
export function clearPowerIdCache(): void {
  cachedPowerIds = null
}
