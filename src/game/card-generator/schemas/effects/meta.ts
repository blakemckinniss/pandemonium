// ============================================
// META EFFECT SCHEMAS (Recursive)
// Mirrors: ConditionalEffect, RepeatEffect, RandomEffect,
//          SequenceEffect, ForEachEffect
// ============================================

import { z } from 'zod'
import { EffectValueSchema, EntityTargetSchema, CardTargetSchema } from '../primitives'
import { ConditionSchema } from '../conditions'

// Forward reference - will be set by index.ts
let AtomicEffectSchema: z.ZodTypeAny = z.any()

export function setAtomicEffectSchema(schema: z.ZodTypeAny) {
  AtomicEffectSchema = schema
}

export const ConditionalEffectSchema = z.object({
  type: z.literal('conditional'),
  condition: ConditionSchema,
  then: z.lazy(() => z.array(AtomicEffectSchema)),
  else: z.lazy(() => z.array(AtomicEffectSchema)).optional(),
})

export const RepeatEffectSchema = z.object({
  type: z.literal('repeat'),
  times: EffectValueSchema,
  effects: z.lazy(() => z.array(AtomicEffectSchema)),
})

export const RandomEffectSchema = z.object({
  type: z.literal('random'),
  choices: z.lazy(() => z.array(z.array(AtomicEffectSchema))),
  weights: z.array(z.number()).optional(),
})

export const SequenceEffectSchema = z.object({
  type: z.literal('sequence'),
  effects: z.lazy(() => z.array(AtomicEffectSchema)),
})

export const ForEachEffectSchema = z.object({
  type: z.literal('forEach'),
  target: z.union([EntityTargetSchema, CardTargetSchema]),
  effects: z.lazy(() => z.array(AtomicEffectSchema)),
})

export const MetaEffectSchemas = [
  ConditionalEffectSchema,
  RepeatEffectSchema,
  RandomEffectSchema,
  SequenceEffectSchema,
  ForEachEffectSchema,
] as const
