// ============================================
// PRIMITIVE ZOD SCHEMAS
// Mirrors: src/types/values.ts, src/types/targeting.ts, src/types/elements.ts
// ============================================

import { z } from 'zod'

// ============================================
// ELEMENTS
// ============================================

export const ElementSchema = z.enum(['physical', 'fire', 'ice', 'lightning', 'void'])

// ============================================
// SCALING & VALUES
// ============================================

export const ScalingSourceSchema = z.enum([
  'energy',
  'maxEnergy',
  'cardsInHand',
  'cardsPlayed',
  'block',
  'missingHealth',
  'healthPercent',
  'enemyCount',
  'turnNumber',
  'powerStacks',
])

export const FixedValueSchema = z.object({
  type: z.literal('fixed'),
  value: z.number(),
})

export const RangeValueSchema = z.object({
  type: z.literal('range'),
  min: z.number(),
  max: z.number(),
})

export const ScaledValueSchema = z.object({
  type: z.literal('scaled'),
  base: z.number(),
  perUnit: z.number(),
  source: ScalingSourceSchema,
  max: z.number().optional(),
})

export const GeneratedScaledValueSchema = z.object({
  type: z.literal('generatedScaled'),
  baseRange: z.tuple([z.number(), z.number()]),
  perUnit: z.number(),
  source: ScalingSourceSchema,
})

export const PowerAmountValueSchema = z.object({
  type: z.literal('powerAmount'),
})

export const EffectValueSchema = z.union([
  z.number(),
  FixedValueSchema,
  RangeValueSchema,
  ScaledValueSchema,
  GeneratedScaledValueSchema,
  PowerAmountValueSchema,
])

// ============================================
// TARGETING
// ============================================

export const EntityTargetSchema = z.enum([
  // Direct
  'self',
  'player',
  'source',
  'none',
  // Single enemy
  'enemy',
  'randomEnemy',
  'weakestEnemy',
  'strongestEnemy',
  'frontEnemy',
  'backEnemy',
  // Multiple
  'allEnemies',
  'allEntities',
  'otherEnemies',
])

export const CardThemeSchema = z.enum([
  'attack',
  'skill',
  'power',
  'curse',
  'status',
  'hero',
  'enemy',
])

export const CardTargetSchema = z.enum([
  'hand',
  'drawPile',
  'discardPile',
  'exhaustPile',
  'randomHand',
  'randomDraw',
  'randomDiscard',
  'leftmostHand',
  'rightmostHand',
  'topDraw',
  'thisCard',
  'lastPlayed',
])

// Forward reference for AtomicEffectType - will be set by effects/index.ts
// Using ZodTypeAny to avoid Zod v4 enum type issues
let AtomicEffectTypeSchema: z.ZodTypeAny = z.enum(['damage'])

export function setAtomicEffectTypeSchema(schema: z.ZodTypeAny) {
  AtomicEffectTypeSchema = schema
}

export const CardFilterSchema = z.object({
  theme: z.union([CardThemeSchema, z.array(CardThemeSchema)]).optional(),
  costMin: z.number().optional(),
  costMax: z.number().optional(),
  hasEffect: z.lazy(() => AtomicEffectTypeSchema).optional(),
})

export const FilteredCardTargetSchema = z.object({
  from: CardTargetSchema,
  filter: CardFilterSchema.optional(),
  count: z.number().optional(),
})

// Union of simple CardTarget or FilteredCardTarget
export const CardTargetOrFilteredSchema = z.union([CardTargetSchema, FilteredCardTargetSchema])

// ============================================
// COMPARISON
// ============================================

export const ComparisonOpSchema = z.enum(['<', '<=', '=', '>=', '>', '!='])

// ============================================
// RARITY
// ============================================

export const RaritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'ultra-rare',
  'legendary',
  'mythic',
  'ancient',
])
