// ============================================
// CARD GENERATION ZOD SCHEMAS
// Main entry point for all validation schemas
// ============================================

import { z } from 'zod'

// Re-export primitives
export * from './primitives'

// Re-export conditions
export * from './conditions'

// Re-export all effect schemas
export { AtomicEffectSchema, type AtomicEffectSchemaType } from './effects'

// Import for building card schema
import { AtomicEffectSchema } from './effects'
import { CardThemeSchema } from './primitives'

// --- CARD SCHEMA ---

export const GeneratedCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  energy: z.number().int().min(0).max(10),
  theme: CardThemeSchema,
  target: z.enum(['enemy', 'self', 'all_enemies', 'none']),
  effects: z.array(AtomicEffectSchema).min(1),
  description: z.string().optional(),
  rarity: z.enum(['common', 'uncommon', 'rare']).optional(),
  keywords: z.array(z.string()).optional(),
  exhaust: z.boolean().optional(),
  ethereal: z.boolean().optional(),
  innate: z.boolean().optional(),
  retain: z.boolean().optional(),
  unplayable: z.boolean().optional(),
})

export type GeneratedCardSchemaType = z.infer<typeof GeneratedCardSchema>

// --- VALIDATION RESULT TYPES ---

export interface ValidationWarning {
  code: string
  message: string
  path?: string[]
  severity: 'warning' | 'info'
}

export interface ValidationResult {
  success: boolean
  errors: z.ZodError | null
  warnings: ValidationWarning[]
  card: GeneratedCardSchemaType | null
}

// --- HIGH-LEVEL VALIDATION FUNCTIONS ---

/**
 * Validate card structure using Zod schema
 * Layer 1: Schema validation only
 */
export function validateCardSchema(data: unknown): ValidationResult {
  const result = GeneratedCardSchema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      errors: null,
      warnings: [],
      card: result.data,
    }
  }

  return {
    success: false,
    errors: result.error,
    warnings: [],
    card: null,
  }
}

// Zod v4 safe parse result type
type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError }

/**
 * Validate a single effect
 */
export function validateEffect(
  effect: unknown
): SafeParseResult<z.infer<typeof AtomicEffectSchema>> {
  return AtomicEffectSchema.safeParse(effect) as SafeParseResult<z.infer<typeof AtomicEffectSchema>>
}

/**
 * Validate an array of effects
 */
export function validateEffects(effects: unknown[]): {
  valid: boolean
  results: SafeParseResult<z.infer<typeof AtomicEffectSchema>>[]
} {
  const results = effects.map((e) => AtomicEffectSchema.safeParse(e) as SafeParseResult<z.infer<typeof AtomicEffectSchema>>)
  const valid = results.every((r) => r.success)
  return { valid, results }
}
