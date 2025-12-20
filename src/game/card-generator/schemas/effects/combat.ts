// ============================================
// COMBAT EFFECT SCHEMAS
// Mirrors: DamageEffect, BlockEffect, HealEffect, LifestealEffect,
//          DestroyBlockEffect, MaxHealthEffect, SetHealthEffect
// ============================================

import { z } from 'zod'
import { EffectValueSchema, EntityTargetSchema, ElementSchema } from '../primitives'

// Forward reference for nested effects (triggerOnHit)
let AtomicEffectArraySchema: z.ZodArray<z.ZodTypeAny> = z.array(z.any())

export function setAtomicEffectArraySchema(schema: z.ZodArray<z.ZodTypeAny>) {
  AtomicEffectArraySchema = schema
}

export const DamageEffectSchema = z.object({
  type: z.literal('damage'),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
  element: ElementSchema.optional(),
  piercing: z.boolean().optional(),
  triggerOnHit: z.lazy(() => AtomicEffectArraySchema).optional(),
})

export const BlockEffectSchema = z.object({
  type: z.literal('block'),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
  persistent: z.boolean().optional(),
})

export const HealEffectSchema = z.object({
  type: z.literal('heal'),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
  canOverheal: z.boolean().optional(),
})

export const LifestealEffectSchema = z.object({
  type: z.literal('lifesteal'),
  amount: EffectValueSchema,
  target: EntityTargetSchema,
  healTarget: EntityTargetSchema.optional(),
  ratio: z.number().optional(),
})

export const DestroyBlockEffectSchema = z.object({
  type: z.literal('destroyBlock'),
  target: EntityTargetSchema,
  amount: EffectValueSchema.optional(),
})

export const MaxHealthEffectSchema = z.object({
  type: z.literal('maxHealth'),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
  operation: z.enum(['gain', 'lose', 'set']),
})

export const SetHealthEffectSchema = z.object({
  type: z.literal('setHealth'),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
})

// Export all combat effect schemas
export const CombatEffectSchemas = [
  DamageEffectSchema,
  BlockEffectSchema,
  HealEffectSchema,
  LifestealEffectSchema,
  DestroyBlockEffectSchema,
  MaxHealthEffectSchema,
  SetHealthEffectSchema,
] as const
