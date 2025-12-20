// ============================================
// ADVANCED COMBAT EFFECT SCHEMAS
// Mirrors: ExecuteEffect, SplashEffect, RecoilEffect,
//          CounterAttackEffect, ChainEffect
// ============================================

import { z } from 'zod'
import { EffectValueSchema, EntityTargetSchema, ElementSchema } from '../primitives'

export const ExecuteEffectSchema = z.object({
  type: z.literal('execute'),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
  threshold: z.number().min(0).max(1),
  bonusMultiplier: z.number(),
  element: ElementSchema.optional(),
})

export const SplashEffectSchema = z.object({
  type: z.literal('splash'),
  amount: EffectValueSchema,
  splashAmount: EffectValueSchema,
  target: EntityTargetSchema,
  splashTargets: z.enum(['all_enemies', 'adjacent']).optional(),
  element: ElementSchema.optional(),
})

export const RecoilEffectSchema = z.object({
  type: z.literal('recoil'),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
})

export const CounterAttackEffectSchema = z.object({
  type: z.literal('counterAttack'),
  amount: EffectValueSchema,
  duration: z.number().optional(),
  triggersRemaining: z.number().optional(),
})

export const ChainEffectSchema = z.object({
  type: z.literal('chain'),
  amount: EffectValueSchema,
  bounces: z.number(),
  decay: z.number().optional(),
  element: ElementSchema.optional(),
})

export const AdvancedCombatEffectSchemas = [
  ExecuteEffectSchema,
  SplashEffectSchema,
  RecoilEffectSchema,
  CounterAttackEffectSchema,
  ChainEffectSchema,
] as const
