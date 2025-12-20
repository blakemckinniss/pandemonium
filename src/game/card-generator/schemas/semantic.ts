// ============================================
// SEMANTIC VALIDATION
// Layer 3: Target compatibility, loop detection, reasonable amounts
// ============================================

import type { ValidationWarning } from './index'

interface SemanticResult {
  valid: boolean
  errors: string[]
  warnings: ValidationWarning[]
}

// Effect types that target enemies
const ENEMY_TARGETING_EFFECTS = new Set([
  'damage',
  'execute',
  'splash',
  'chain',
  'weakenIntent',
  'markTarget',
])

// Effect types that target self/player
const SELF_TARGETING_EFFECTS = new Set([
  'block',
  'heal',
  'draw',
  'energy',
  'energyNextTurn',
  'tempMaxEnergy',
])

// Meta effect types that contain nested effects
const META_EFFECT_TYPES = new Set([
  'conditional',
  'repeat',
  'random',
  'sequence',
  'forEach',
  'delayed',
])

/**
 * Check for target compatibility issues
 * E.g., self-targeted card with enemy-targeting effects
 */
export function validateTargetCompatibility(
  cardTarget: string,
  effects: unknown[]
): SemanticResult {
  const warnings: ValidationWarning[] = []

  function checkEffect(effect: unknown, path: string[]): void {
    if (!effect || typeof effect !== 'object') return
    const e = effect as Record<string, unknown>
    const type = e.type as string

    // Skip meta effects, check their children instead
    if (META_EFFECT_TYPES.has(type)) {
      checkNestedEffects(e, path)
      return
    }

    // Self-targeted card with enemy-targeting effect
    if (cardTarget === 'self' && ENEMY_TARGETING_EFFECTS.has(type)) {
      // Check if effect has its own target override
      if (!e.target || e.target === 'enemy' || e.target === 'all_enemies') {
        warnings.push({
          code: 'TARGET_MISMATCH',
          message: `Card targets self but effect "${type}" targets enemies at ${path.join('.')}`,
          path,
          severity: 'warning',
        })
      }
    }

    // Enemy-targeted card with self-only effect (less common, usually OK)
    if (cardTarget === 'enemy' && SELF_TARGETING_EFFECTS.has(type)) {
      // This is usually fine - cards often deal damage AND block
    }
  }

  function checkNestedEffects(e: Record<string, unknown>, path: string[]): void {
    if ('effects' in e && Array.isArray(e.effects)) {
      e.effects.forEach((nested, i) => {
        checkEffect(nested, [...path, 'effects', String(i)])
      })
    }
    if ('then' in e && Array.isArray(e.then)) {
      e.then.forEach((nested, i) => {
        checkEffect(nested, [...path, 'then', String(i)])
      })
    }
    if ('else' in e && Array.isArray(e.else)) {
      e.else.forEach((nested, i) => {
        checkEffect(nested, [...path, 'else', String(i)])
      })
    }
    if ('choices' in e && Array.isArray(e.choices)) {
      e.choices.forEach((choice, ci) => {
        if (Array.isArray(choice)) {
          choice.forEach((nested, i) => {
            checkEffect(nested, [...path, 'choices', String(ci), String(i)])
          })
        }
      })
    }
  }

  effects.forEach((effect, i) => {
    checkEffect(effect, ['effects', String(i)])
  })

  return { valid: true, errors: [], warnings }
}

/**
 * Detect potential infinite loops in meta effects
 * Checks for unbounded repeat with no termination condition
 */
export function validateNoInfiniteLoops(effects: unknown[]): SemanticResult {
  const errors: string[] = []
  const warnings: ValidationWarning[] = []
  const MAX_DEPTH = 10

  function checkEffect(effect: unknown, path: string[], depth: number): void {
    if (depth > MAX_DEPTH) {
      errors.push(`Effect nesting too deep (>${MAX_DEPTH}) at ${path.join('.')}`)
      return
    }

    if (!effect || typeof effect !== 'object') return
    const e = effect as Record<string, unknown>
    const type = e.type as string

    // Check repeat effects
    if (type === 'repeat') {
      const times = e.times
      // If times is a dynamic value, warn about potential issues
      if (times && typeof times === 'object' && 'source' in times) {
        const source = (times as Record<string, unknown>).source
        // Scaling sources that could be very high
        if (source === 'cardsPlayedThisTurn' || source === 'cardsInHand') {
          warnings.push({
            code: 'POTENTIALLY_HIGH_REPEAT',
            message: `Repeat effect at ${path.join('.')} uses dynamic source "${source}" - could be high`,
            path,
            severity: 'info',
          })
        }
      }
      // Check if times is unreasonably high
      if (typeof times === 'number' && times > 20) {
        warnings.push({
          code: 'HIGH_REPEAT_COUNT',
          message: `Repeat effect at ${path.join('.')} has ${times} iterations - may be excessive`,
          path,
          severity: 'warning',
        })
      }
    }

    // Check for deeply nested meta effects
    if (META_EFFECT_TYPES.has(type)) {
      if (depth > 5) {
        warnings.push({
          code: 'DEEP_NESTING',
          message: `Meta effect nesting depth ${depth} at ${path.join('.')} - may be hard to debug`,
          path,
          severity: 'info',
        })
      }
      checkNestedEffects(e, path, depth + 1)
    }
  }

  function checkNestedEffects(
    e: Record<string, unknown>,
    path: string[],
    depth: number
  ): void {
    if ('effects' in e && Array.isArray(e.effects)) {
      e.effects.forEach((nested, i) => {
        checkEffect(nested, [...path, 'effects', String(i)], depth)
      })
    }
    if ('then' in e && Array.isArray(e.then)) {
      e.then.forEach((nested, i) => {
        checkEffect(nested, [...path, 'then', String(i)], depth)
      })
    }
    if ('else' in e && Array.isArray(e.else)) {
      e.else.forEach((nested, i) => {
        checkEffect(nested, [...path, 'else', String(i)], depth)
      })
    }
    if ('choices' in e && Array.isArray(e.choices)) {
      e.choices.forEach((choice, ci) => {
        if (Array.isArray(choice)) {
          choice.forEach((nested, i) => {
            checkEffect(nested, [...path, 'choices', String(ci), String(i)], depth)
          })
        }
      })
    }
  }

  effects.forEach((effect, i) => {
    checkEffect(effect, ['effects', String(i)], 0)
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check for suspicious/unreasonable amounts
 */
export function validateReasonableAmounts(effects: unknown[]): SemanticResult {
  const warnings: ValidationWarning[] = []

  function checkEffect(effect: unknown, path: string[]): void {
    if (!effect || typeof effect !== 'object') return
    const e = effect as Record<string, unknown>
    const type = e.type as string

    // Check damage amounts
    if (type === 'damage' && typeof e.amount === 'number') {
      if (e.amount > 100) {
        warnings.push({
          code: 'HIGH_DAMAGE',
          message: `Damage of ${e.amount} at ${path.join('.')} seems very high`,
          path,
          severity: 'warning',
        })
      }
      if (e.amount < 1) {
        warnings.push({
          code: 'LOW_DAMAGE',
          message: `Damage of ${e.amount} at ${path.join('.')} seems too low`,
          path,
          severity: 'info',
        })
      }
    }

    // Check block amounts
    if (type === 'block' && typeof e.amount === 'number') {
      if (e.amount > 100) {
        warnings.push({
          code: 'HIGH_BLOCK',
          message: `Block of ${e.amount} at ${path.join('.')} seems very high`,
          path,
          severity: 'warning',
        })
      }
    }

    // Check draw amounts
    if (type === 'draw' && typeof e.amount === 'number') {
      if (e.amount > 10) {
        warnings.push({
          code: 'HIGH_DRAW',
          message: `Draw of ${e.amount} at ${path.join('.')} seems excessive`,
          path,
          severity: 'warning',
        })
      }
    }

    // Check energy costs/gains
    if (type === 'energy' && typeof e.amount === 'number') {
      if (Math.abs(e.amount) > 5) {
        warnings.push({
          code: 'HIGH_ENERGY',
          message: `Energy amount of ${e.amount} at ${path.join('.')} seems high`,
          path,
          severity: 'info',
        })
      }
    }

    // Recurse into nested effects
    if (META_EFFECT_TYPES.has(type)) {
      checkNestedEffects(e, path)
    }
  }

  function checkNestedEffects(e: Record<string, unknown>, path: string[]): void {
    if ('effects' in e && Array.isArray(e.effects)) {
      e.effects.forEach((nested, i) => {
        checkEffect(nested, [...path, 'effects', String(i)])
      })
    }
    if ('then' in e && Array.isArray(e.then)) {
      e.then.forEach((nested, i) => {
        checkEffect(nested, [...path, 'then', String(i)])
      })
    }
    if ('else' in e && Array.isArray(e.else)) {
      e.else.forEach((nested, i) => {
        checkEffect(nested, [...path, 'else', String(i)])
      })
    }
    if ('choices' in e && Array.isArray(e.choices)) {
      e.choices.forEach((choice, ci) => {
        if (Array.isArray(choice)) {
          choice.forEach((nested, i) => {
            checkEffect(nested, [...path, 'choices', String(ci), String(i)])
          })
        }
      })
    }
  }

  effects.forEach((effect, i) => {
    checkEffect(effect, ['effects', String(i)])
  })

  return { valid: true, errors: [], warnings }
}

/**
 * Run all semantic validations
 */
export function validateSemantics(
  cardTarget: string,
  effects: unknown[]
): SemanticResult {
  const targetResult = validateTargetCompatibility(cardTarget, effects)
  const loopResult = validateNoInfiniteLoops(effects)
  const amountResult = validateReasonableAmounts(effects)

  return {
    valid: targetResult.valid && loopResult.valid && amountResult.valid,
    errors: [
      ...targetResult.errors,
      ...loopResult.errors,
      ...amountResult.errors,
    ],
    warnings: [
      ...targetResult.warnings,
      ...loopResult.warnings,
      ...amountResult.warnings,
    ],
  }
}
