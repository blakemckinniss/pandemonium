// ============================================
// CARD MANIPULATION EFFECT SCHEMAS
// Mirrors: DrawEffect, DiscardEffect, ExhaustEffect, AddCardEffect,
//          ShuffleEffect, UpgradeEffect, RetainEffect, TransformEffect,
//          ScryEffect, TutorEffect, CopyCardEffect, PutOnDeckEffect,
//          ModifyCostEffect, DiscoverEffect, BanishEffect
// ============================================

import { z } from 'zod'
import {
  EffectValueSchema,
  CardTargetOrFilteredSchema,
  CardFilterSchema,
} from '../primitives'

export const DrawEffectSchema = z.object({
  type: z.literal('draw'),
  amount: EffectValueSchema,
})

export const DiscardEffectSchema = z.object({
  type: z.literal('discard'),
  target: CardTargetOrFilteredSchema,
  amount: EffectValueSchema.optional(),
})

export const ExhaustEffectSchema = z.object({
  type: z.literal('exhaust'),
  target: CardTargetOrFilteredSchema,
  amount: EffectValueSchema.optional(),
})

export const BanishEffectSchema = z.object({
  type: z.literal('banish'),
  target: CardTargetOrFilteredSchema,
  amount: EffectValueSchema.optional(),
  playerChoice: z.boolean().optional(),
})

export const AddCardEffectSchema = z.object({
  type: z.literal('addCard'),
  cardId: z.string().min(1),
  destination: z.enum(['hand', 'drawPile', 'discardPile']),
  position: z.enum(['top', 'bottom', 'random']).optional(),
  upgraded: z.boolean().optional(),
  count: EffectValueSchema.optional(),
})

export const ShuffleEffectSchema = z.object({
  type: z.literal('shuffle'),
  pile: z.enum(['drawPile', 'discardPile']),
  into: z.literal('drawPile').optional(),
})

export const UpgradeEffectSchema = z.object({
  type: z.literal('upgrade'),
  target: CardTargetOrFilteredSchema,
})

export const RetainEffectSchema = z.object({
  type: z.literal('retain'),
  target: CardTargetOrFilteredSchema,
})

export const TransformEffectSchema = z.object({
  type: z.literal('transform'),
  target: CardTargetOrFilteredSchema,
  toCardId: z.string().optional(),
  toRandom: z
    .object({
      filter: CardFilterSchema.optional(),
      pool: z.enum(['all', 'common', 'uncommon', 'rare']).optional(),
    })
    .optional(),
  upgraded: z.boolean().optional(),
})

export const ScryEffectSchema = z.object({
  type: z.literal('scry'),
  amount: EffectValueSchema,
})

export const TutorEffectSchema = z.object({
  type: z.literal('tutor'),
  from: z.enum(['drawPile', 'discardPile']),
  filter: CardFilterSchema.optional(),
  amount: EffectValueSchema.optional(),
  destination: z.enum(['hand', 'drawPile']),
  position: z.enum(['top', 'bottom', 'random']).optional(),
  shuffle: z.boolean().optional(),
})

export const CopyCardEffectSchema = z.object({
  type: z.literal('copyCard'),
  target: CardTargetOrFilteredSchema,
  destination: z.enum(['hand', 'drawPile', 'discardPile']),
  position: z.enum(['top', 'bottom', 'random']).optional(),
  count: EffectValueSchema.optional(),
})

export const PutOnDeckEffectSchema = z.object({
  type: z.literal('putOnDeck'),
  target: CardTargetOrFilteredSchema,
  position: z.enum(['top', 'bottom', 'random']).optional(),
})

export const ModifyCostEffectSchema = z.object({
  type: z.literal('modifyCost'),
  target: CardTargetOrFilteredSchema,
  amount: EffectValueSchema,
  duration: z.enum(['turn', 'combat', 'permanent']).optional(),
})

export const DiscoverEffectSchema = z.object({
  type: z.literal('discover'),
  count: z.number(),
  filter: CardFilterSchema.optional(),
  pool: z
    .enum(['all', 'common', 'uncommon', 'rare', 'attack', 'skill', 'power'])
    .optional(),
  destination: z.enum(['hand', 'drawPile', 'discardPile']).optional(),
  copies: z.number().optional(),
  exhaust: z.boolean().optional(),
})

export const CardEffectSchemas = [
  DrawEffectSchema,
  DiscardEffectSchema,
  ExhaustEffectSchema,
  BanishEffectSchema,
  AddCardEffectSchema,
  ShuffleEffectSchema,
  UpgradeEffectSchema,
  RetainEffectSchema,
  TransformEffectSchema,
  ScryEffectSchema,
  TutorEffectSchema,
  CopyCardEffectSchema,
  PutOnDeckEffectSchema,
  ModifyCostEffectSchema,
  DiscoverEffectSchema,
] as const
