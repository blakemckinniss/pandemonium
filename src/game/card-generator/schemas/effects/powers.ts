// ============================================
// POWER EFFECT SCHEMAS
// Mirrors: ApplyPowerEffect, RemovePowerEffect, TransferPowerEffect,
//          StealPowerEffect, SilencePowerEffect
// ============================================

import { z } from 'zod'
import { EffectValueSchema, EntityTargetSchema } from '../primitives'

export const ApplyPowerEffectSchema = z.object({
  type: z.literal('applyPower'),
  powerId: z.string().min(1),
  amount: EffectValueSchema,
  target: EntityTargetSchema.optional(),
  duration: z.number().optional(),
})

export const RemovePowerEffectSchema = z.object({
  type: z.literal('removePower'),
  powerId: z.string().min(1),
  target: EntityTargetSchema.optional(),
  amount: EffectValueSchema.optional(),
})

export const TransferPowerEffectSchema = z.object({
  type: z.literal('transferPower'),
  powerId: z.string().min(1),
  from: EntityTargetSchema,
  to: EntityTargetSchema,
  amount: EffectValueSchema.optional(),
})

export const StealPowerEffectSchema = z.object({
  type: z.literal('stealPower'),
  powerId: z.string().optional(),
  from: EntityTargetSchema,
  to: EntityTargetSchema.optional(),
  amount: EffectValueSchema.optional(),
})

export const SilencePowerEffectSchema = z.object({
  type: z.literal('silencePower'),
  powerId: z.string().optional(),
  target: EntityTargetSchema,
  duration: z.number().optional(),
})

export const PowerEffectSchemas = [
  ApplyPowerEffectSchema,
  RemovePowerEffectSchema,
  TransferPowerEffectSchema,
  StealPowerEffectSchema,
  SilencePowerEffectSchema,
] as const
