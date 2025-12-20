// ============================================
// MISC EFFECT SCHEMAS
// Covers: Resource, Deck Manipulation, Enemy, Damage Manipulation,
//         Status Cards, Delayed, Replay effects
// ============================================

import { z } from 'zod'
import {
  EffectValueSchema,
  EntityTargetSchema,
  CardTargetOrFilteredSchema,
  CardFilterSchema,
} from '../primitives'

// Forward reference for DelayedEffect
let AtomicEffectSchema: z.ZodTypeAny = z.any()

export function setAtomicEffectSchema(schema: z.ZodTypeAny) {
  AtomicEffectSchema = schema
}

// --- RESOURCE EFFECTS ---

export const EnergyEffectSchema = z.object({
  type: z.literal('energy'),
  amount: EffectValueSchema,
  operation: z.enum(['gain', 'spend', 'set']),
})

export const GoldEffectSchema = z.object({
  type: z.literal('gold'),
  amount: EffectValueSchema,
  operation: z.enum(['gain', 'lose', 'set']),
})

// --- DECK MANIPULATION ---

export const MillEffectSchema = z.object({
  type: z.literal('mill'),
  amount: EffectValueSchema,
  target: z.enum(['drawPile', 'enemy']).optional(),
})

export const CreateRandomCardEffectSchema = z.object({
  type: z.literal('createRandomCard'),
  filter: CardFilterSchema.optional(),
  pool: z.enum(['all', 'common', 'uncommon', 'rare', 'attack', 'skill', 'power']).optional(),
  destination: z.enum(['hand', 'drawPile', 'discardPile']),
  count: EffectValueSchema.optional(),
  upgraded: z.boolean().optional(),
})

export const InnateEffectSchema = z.object({
  type: z.literal('innate'),
  target: CardTargetOrFilteredSchema,
})

export const EtherealEffectSchema = z.object({
  type: z.literal('ethereal'),
  target: CardTargetOrFilteredSchema,
})

export const UnplayableEffectSchema = z.object({
  type: z.literal('unplayable'),
  target: CardTargetOrFilteredSchema,
  duration: z.enum(['turn', 'combat']).optional(),
})

// --- ENEMY MANIPULATION ---

export const WeakenIntentEffectSchema = z.object({
  type: z.literal('weakenIntent'),
  amount: EffectValueSchema,
  target: EntityTargetSchema,
})

export const MarkTargetEffectSchema = z.object({
  type: z.literal('markTarget'),
  target: EntityTargetSchema,
  duration: z.number().optional(),
  bonusDamage: EffectValueSchema.optional(),
  bonusMultiplier: z.number().optional(),
})

// --- DAMAGE MANIPULATION ---

export const ReflectEffectSchema = z.object({
  type: z.literal('reflect'),
  amount: EffectValueSchema,
  percentage: z.number().optional(),
  duration: z.number().optional(),
})

export const AmplifyEffectSchema = z.object({
  type: z.literal('amplify'),
  multiplier: z.number(),
  attacks: z.number().optional(),
  duration: z.number().optional(),
})

// --- RESOURCE MANIPULATION ---

export const EnergyNextTurnEffectSchema = z.object({
  type: z.literal('energyNextTurn'),
  amount: EffectValueSchema,
})

export const TempMaxEnergyEffectSchema = z.object({
  type: z.literal('tempMaxEnergy'),
  amount: EffectValueSchema,
  duration: z.number().optional(),
})

// --- STATUS CARDS ---

export const AddStatusCardEffectSchema = z.object({
  type: z.literal('addStatusCard'),
  cardId: z.string().min(1),
  destination: z.enum(['hand', 'drawPile', 'discardPile']),
  count: EffectValueSchema.optional(),
})

export const RemoveStatusCardsEffectSchema = z.object({
  type: z.literal('removeStatusCards'),
  count: EffectValueSchema.optional(),
  from: z.enum(['hand', 'drawPile', 'discardPile', 'all']).optional(),
  cardType: z.enum(['wound', 'dazed', 'burn', 'curse', 'status']).optional(),
})

// --- DELAYED ---

export const DelayedEffectSchema = z.object({
  type: z.literal('delayed'),
  delay: z.number(),
  effects: z.lazy(() => z.array(AtomicEffectSchema)),
  trigger: z.enum(['turnStart', 'turnEnd']).optional(),
})

// --- REPLAY ---

export const ReplayCardEffectSchema = z.object({
  type: z.literal('replayCard'),
  target: CardTargetOrFilteredSchema,
  times: EffectValueSchema.optional(),
  free: z.boolean().optional(),
  exhaustAfter: z.boolean().optional(),
})

export const PlayTopCardEffectSchema = z.object({
  type: z.literal('playTopCard'),
  pile: z.enum(['drawPile', 'discardPile']),
  count: EffectValueSchema.optional(),
  exhaust: z.boolean().optional(),
})

export const MiscEffectSchemas = [
  EnergyEffectSchema,
  GoldEffectSchema,
  MillEffectSchema,
  CreateRandomCardEffectSchema,
  InnateEffectSchema,
  EtherealEffectSchema,
  UnplayableEffectSchema,
  WeakenIntentEffectSchema,
  MarkTargetEffectSchema,
  ReflectEffectSchema,
  AmplifyEffectSchema,
  EnergyNextTurnEffectSchema,
  TempMaxEnergyEffectSchema,
  AddStatusCardEffectSchema,
  RemoveStatusCardsEffectSchema,
  DelayedEffectSchema,
  ReplayCardEffectSchema,
  PlayTopCardEffectSchema,
] as const
