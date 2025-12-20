// ============================================
// MODIFIER VALIDATION (3-LAYER)
// ============================================
// Layer 1: Schema validation (structure)
// Layer 2: Registry validation (no conflicts)
// Layer 3: Semantic validation (balance rules)

import type {
  ModifierDefinition,
  ModifierCategory,
  ModifierRarity,
  ModifierDurability,
  ModifierEffect,
} from '../../types'
import { getModifierDefinition, getAllModifiers } from '../modifiers'

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export interface ValidationError {
  code: string
  message: string
  field?: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  success: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  balanceScore?: number
}

// ============================================
// LAYER 1: SCHEMA VALIDATION
// ============================================

const VALID_CATEGORIES: ModifierCategory[] = ['catalyst', 'omen', 'edict', 'seal']
const VALID_RARITIES: ModifierRarity[] = ['common', 'uncommon', 'rare', 'legendary']
const VALID_DURABILITY_TYPES = ['consumable', 'fragile', 'permanent'] as const

export function validateModifierSchema(data: unknown): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  if (!data || typeof data !== 'object') {
    errors.push({ code: 'INVALID_OBJECT', message: 'Modifier must be an object', severity: 'error' })
    return { success: false, errors, warnings }
  }

  const mod = data as Record<string, unknown>

  // Required string fields
  if (!mod.name || typeof mod.name !== 'string' || mod.name.length < 2) {
    errors.push({ code: 'MISSING_NAME', message: 'Modifier must have a valid name', field: 'name', severity: 'error' })
  }

  if (!mod.description || typeof mod.description !== 'string') {
    errors.push({ code: 'MISSING_DESCRIPTION', message: 'Modifier must have a description', field: 'description', severity: 'error' })
  }

  // Category validation
  if (!mod.category || !VALID_CATEGORIES.includes(mod.category as ModifierCategory)) {
    errors.push({
      code: 'INVALID_CATEGORY',
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      field: 'category',
      severity: 'error'
    })
  }

  // Rarity validation
  if (!mod.rarity || !VALID_RARITIES.includes(mod.rarity as ModifierRarity)) {
    errors.push({
      code: 'INVALID_RARITY',
      message: `Rarity must be one of: ${VALID_RARITIES.join(', ')}`,
      field: 'rarity',
      severity: 'error'
    })
  }

  // DV/RV validation
  if (typeof mod.dangerValue !== 'number' || mod.dangerValue < 0) {
    errors.push({ code: 'INVALID_DV', message: 'dangerValue must be a positive number', field: 'dangerValue', severity: 'error' })
  }

  if (typeof mod.rewardValue !== 'number' || mod.rewardValue < 0) {
    errors.push({ code: 'INVALID_RV', message: 'rewardValue must be a positive number', field: 'rewardValue', severity: 'error' })
  }

  // Durability validation
  if (!mod.durability || typeof mod.durability !== 'object') {
    errors.push({ code: 'MISSING_DURABILITY', message: 'Modifier must have durability', field: 'durability', severity: 'error' })
  } else {
    const dur = mod.durability as Record<string, unknown>
    if (!VALID_DURABILITY_TYPES.includes(dur.type as typeof VALID_DURABILITY_TYPES[number])) {
      errors.push({
        code: 'INVALID_DURABILITY_TYPE',
        message: `Durability type must be one of: ${VALID_DURABILITY_TYPES.join(', ')}`,
        field: 'durability.type',
        severity: 'error'
      })
    }
    if (dur.type === 'fragile' && (typeof dur.uses !== 'number' || dur.uses < 1)) {
      errors.push({
        code: 'INVALID_FRAGILE_USES',
        message: 'Fragile durability must have positive uses count',
        field: 'durability.uses',
        severity: 'error'
      })
    }
  }

  // Effects validation
  if (!Array.isArray(mod.dangerEffects) || mod.dangerEffects.length === 0) {
    errors.push({ code: 'MISSING_DANGER_EFFECTS', message: 'Modifier must have at least one danger effect', field: 'dangerEffects', severity: 'error' })
  }

  if (!Array.isArray(mod.rewardEffects) || mod.rewardEffects.length === 0) {
    errors.push({ code: 'MISSING_REWARD_EFFECTS', message: 'Modifier must have at least one reward effect', field: 'rewardEffects', severity: 'error' })
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// LAYER 2: REGISTRY VALIDATION
// ============================================

export function validateModifierRegistry(mod: Partial<ModifierDefinition>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Check for duplicate ID
  if (mod.id) {
    const existing = getModifierDefinition(mod.id)
    if (existing) {
      errors.push({
        code: 'DUPLICATE_ID',
        message: `Modifier with ID "${mod.id}" already exists`,
        field: 'id',
        severity: 'error'
      })
    }
  }

  // Check for similar names (fuzzy duplicate detection)
  if (mod.name) {
    const allModifiers = getAllModifiers()
    const normalizedName = mod.name.toLowerCase().replace(/[^a-z0-9]/g, '')

    for (const existing of allModifiers) {
      const existingNormalized = existing.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalizedName === existingNormalized) {
        errors.push({
          code: 'DUPLICATE_NAME',
          message: `Modifier with similar name "${existing.name}" already exists`,
          field: 'name',
          severity: 'error'
        })
        break
      }
      // Levenshtein-like similarity check (simple version)
      if (normalizedName.length > 5 && existingNormalized.includes(normalizedName.slice(0, 5))) {
        warnings.push({
          code: 'SIMILAR_NAME',
          message: `Modifier name similar to existing "${existing.name}"`,
          field: 'name',
          severity: 'warning'
        })
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// LAYER 3: SEMANTIC VALIDATION (BALANCE)
// ============================================

// DV ranges by rarity
const DV_RANGES: Record<ModifierRarity, [number, number]> = {
  common: [5, 15],
  uncommon: [12, 25],
  rare: [20, 40],
  legendary: [35, 60],
}

// Durability constraints by rarity
const DURABILITY_BY_RARITY: Record<ModifierRarity, ('consumable' | 'fragile' | 'permanent')[]> = {
  common: ['consumable'],
  uncommon: ['consumable', 'fragile'],
  rare: ['fragile'],
  legendary: ['fragile', 'permanent'],
}

export function validateModifierSemantic(mod: Partial<ModifierDefinition>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  const dv = mod.dangerValue ?? 0
  const rv = mod.rewardValue ?? 0
  const rarity = mod.rarity ?? 'common'

  // Balance ratio check (0.85 - 1.15)
  const ratio = dv > 0 ? rv / dv : 0
  const balanceScore = Math.abs(1 - ratio)

  if (ratio < 0.85) {
    errors.push({
      code: 'UNDERPOWERED_REWARD',
      message: `RV/DV ratio ${ratio.toFixed(2)} is below 0.85 - reward is too weak for danger`,
      severity: 'error'
    })
  } else if (ratio > 1.15) {
    errors.push({
      code: 'OVERPOWERED_REWARD',
      message: `RV/DV ratio ${ratio.toFixed(2)} is above 1.15 - reward is too strong for danger`,
      severity: 'error'
    })
  } else if (ratio < 0.90 || ratio > 1.10) {
    warnings.push({
      code: 'BORDERLINE_BALANCE',
      message: `RV/DV ratio ${ratio.toFixed(2)} is near balance limits`,
      severity: 'warning'
    })
  }

  // DV range check by rarity
  const [minDV, maxDV] = DV_RANGES[rarity]
  if (dv < minDV) {
    errors.push({
      code: 'DV_TOO_LOW',
      message: `DV ${dv} is below ${rarity} minimum of ${minDV}`,
      field: 'dangerValue',
      severity: 'error'
    })
  } else if (dv > maxDV) {
    errors.push({
      code: 'DV_TOO_HIGH',
      message: `DV ${dv} is above ${rarity} maximum of ${maxDV}`,
      field: 'dangerValue',
      severity: 'error'
    })
  }

  // Durability check by rarity
  const durabilityType = mod.durability?.type
  if (durabilityType) {
    const allowedTypes = DURABILITY_BY_RARITY[rarity]
    if (!allowedTypes.includes(durabilityType)) {
      errors.push({
        code: 'INVALID_DURABILITY_FOR_RARITY',
        message: `${rarity} modifiers cannot have ${durabilityType} durability`,
        field: 'durability',
        severity: 'error'
      })
    }
  }

  // Fragile uses check
  if (durabilityType === 'fragile') {
    const uses = mod.durability?.uses ?? 0
    if (uses < 3 || uses > 5) {
      warnings.push({
        code: 'FRAGILE_USES_RANGE',
        message: `Fragile uses ${uses} outside typical range 3-5`,
        field: 'durability.uses',
        severity: 'warning'
      })
    }
  }

  // Effect count check by rarity
  const totalEffects = mod.effects?.length ?? 0

  const maxEffects: Record<ModifierRarity, number> = {
    common: 4,
    uncommon: 6,
    rare: 8,
    legendary: 12,
  }

  if (totalEffects > maxEffects[rarity]) {
    warnings.push({
      code: 'TOO_MANY_EFFECTS',
      message: `${totalEffects} effects exceeds typical ${rarity} limit of ${maxEffects[rarity]}`,
      severity: 'warning'
    })
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    balanceScore,
  }
}

// ============================================
// COMBINED VALIDATION
// ============================================

export function validateGeneratedModifier(data: unknown): ValidationResult {
  // Layer 1: Schema
  const schemaResult = validateModifierSchema(data)
  if (!schemaResult.success) {
    return schemaResult
  }

  const mod = data as Partial<ModifierDefinition>

  // Layer 2: Registry
  const registryResult = validateModifierRegistry(mod)

  // Layer 3: Semantic
  const semanticResult = validateModifierSemantic(mod)

  // Combine results
  return {
    success: registryResult.success && semanticResult.success,
    errors: [...registryResult.errors, ...semanticResult.errors],
    warnings: [...schemaResult.warnings, ...registryResult.warnings, ...semanticResult.warnings],
    balanceScore: semanticResult.balanceScore,
  }
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = []

  if (result.errors.length > 0) {
    lines.push('ERRORS:')
    for (const err of result.errors) {
      lines.push(`  ❌ [${err.code}] ${err.message}${err.field ? ` (${err.field})` : ''}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push('WARNINGS:')
    for (const warn of result.warnings) {
      lines.push(`  ⚠️ [${warn.code}] ${warn.message}${warn.field ? ` (${warn.field})` : ''}`)
    }
  }

  if (result.balanceScore !== undefined) {
    lines.push(`Balance Score: ${result.balanceScore.toFixed(3)} (lower is better, 0 = perfect)`)
  }

  return lines.join('\n')
}

// ============================================
// COERCION HELPERS
// ============================================

export function coerceModifierCategory(value: unknown): ModifierCategory {
  if (typeof value === 'string' && VALID_CATEGORIES.includes(value as ModifierCategory)) {
    return value as ModifierCategory
  }
  return 'catalyst'
}

export function coerceModifierRarity(value: unknown): ModifierRarity {
  if (typeof value === 'string' && VALID_RARITIES.includes(value as ModifierRarity)) {
    return value as ModifierRarity
  }
  return 'common'
}

export function coerceDurability(value: unknown): ModifierDurability {
  if (value && typeof value === 'object') {
    const dur = value as Record<string, unknown>
    if (dur.type === 'fragile' && typeof dur.uses === 'number') {
      const uses = Math.max(1, Math.min(10, dur.uses))
      const maxUses = typeof dur.maxUses === 'number' ? dur.maxUses : uses
      return { type: 'fragile', uses, maxUses }
    }
    if (dur.type === 'permanent') {
      return { type: 'permanent' }
    }
  }
  return { type: 'consumable' }
}

export function coerceModifierEffects(effects: unknown): ModifierEffect[] {
  if (!Array.isArray(effects)) return []

  return effects.filter((e): e is ModifierEffect => {
    return e && typeof e === 'object' && typeof (e as Record<string, unknown>).type === 'string'
  })
}
