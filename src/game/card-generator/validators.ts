// ============================================
// HIGH-LEVEL VALIDATORS
// Combines all 3 layers: Schema, Registry, Semantic
// ============================================

import {
  validateCardSchema,
  validateEffect,
  type ValidationWarning,
  type ValidationResult,
  type GeneratedCardSchemaType,
} from './schemas'
import { validateRegistryRefs } from './schemas/registry-refs'
import { validateSemantics } from './schemas/semantic'

export interface FullValidationResult {
  success: boolean
  card: GeneratedCardSchemaType | null
  errors: {
    schema: string[]
    registry: string[]
    semantic: string[]
  }
  warnings: ValidationWarning[]
}

/**
 * Full 3-layer validation for AI-generated cards
 * Layer 1: Zod schema validation (structure + types)
 * Layer 2: Registry validation (powerId/cardId exist)
 * Layer 3: Semantic validation (target compat, loops, amounts)
 */
export function validateGeneratedCard(data: unknown): FullValidationResult {
  const result: FullValidationResult = {
    success: false,
    card: null,
    errors: {
      schema: [],
      registry: [],
      semantic: [],
    },
    warnings: [],
  }

  // Layer 1: Schema validation
  const schemaResult = validateCardSchema(data)
  if (!schemaResult.success) {
    if (schemaResult.errors) {
      result.errors.schema = schemaResult.errors.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      )
    } else {
      result.errors.schema = ['Unknown schema error']
    }
    return result
  }

  const card = schemaResult.card!
  result.card = card

  // Layer 2: Registry validation
  const registryResult = validateRegistryRefs(card.effects)
  if (!registryResult.valid) {
    result.errors.registry = registryResult.errors
    return result
  }
  result.warnings.push(...registryResult.warnings)

  // Layer 3: Semantic validation
  const semanticResult = validateSemantics(card.target, card.effects)
  if (!semanticResult.valid) {
    result.errors.semantic = semanticResult.errors
    return result
  }
  result.warnings.push(...semanticResult.warnings)

  result.success = true
  return result
}

/**
 * Schema-only validation (fast, no registry/semantic checks)
 */
export function validateCardSchemaOnly(data: unknown): ValidationResult {
  return validateCardSchema(data)
}

/**
 * Validate a single effect with full checks
 */
export function validateSingleEffect(effect: unknown): {
  valid: boolean
  errors: string[]
  warnings: ValidationWarning[]
} {
  // Schema check
  const schemaResult = validateEffect(effect)
  if (!schemaResult.success) {
    // Zod v4: error.issues is the array of issues
    const issues = schemaResult.error?.issues ?? []
    return {
      valid: false,
      errors: issues.map(
        (e: { path: PropertyKey[]; message: string }) => `${String(e.path.join('.'))}: ${e.message}`
      ),
      warnings: [],
    }
  }

  // Registry check
  const registryResult = validateRegistryRefs([effect])
  if (!registryResult.valid) {
    return {
      valid: false,
      errors: registryResult.errors,
      warnings: registryResult.warnings,
    }
  }

  return {
    valid: true,
    errors: [],
    warnings: registryResult.warnings,
  }
}

/**
 * Format validation result for display/logging
 */
export function formatValidationResult(result: FullValidationResult): string {
  const lines: string[] = []

  if (result.success) {
    lines.push('✓ Card validation passed')
    if (result.card) {
      lines.push(`  Name: ${result.card.name}`)
      lines.push(`  Effects: ${result.card.effects.length}`)
    }
  } else {
    lines.push('✗ Card validation failed')

    if (result.errors.schema.length > 0) {
      lines.push('  Schema errors:')
      result.errors.schema.forEach((e) => lines.push(`    - ${e}`))
    }
    if (result.errors.registry.length > 0) {
      lines.push('  Registry errors:')
      result.errors.registry.forEach((e) => lines.push(`    - ${e}`))
    }
    if (result.errors.semantic.length > 0) {
      lines.push('  Semantic errors:')
      result.errors.semantic.forEach((e) => lines.push(`    - ${e}`))
    }
  }

  if (result.warnings.length > 0) {
    lines.push('  Warnings:')
    result.warnings.forEach((w) =>
      lines.push(`    [${w.severity}] ${w.code}: ${w.message}`)
    )
  }

  return lines.join('\n')
}

// Re-export types for convenience
export type { ValidationWarning, ValidationResult, GeneratedCardSchemaType }
