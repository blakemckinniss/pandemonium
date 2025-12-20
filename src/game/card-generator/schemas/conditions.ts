// ============================================
// CONDITION ZOD SCHEMAS (Nestable)
// Mirrors: src/types/conditions.ts
// ============================================

import { z } from 'zod'
import {
  EntityTargetSchema,
  ComparisonOpSchema,
  CardFilterSchema,
} from './primitives'

// ============================================
// LEAF CONDITIONS
// ============================================

export const HealthConditionSchema = z.object({
  type: z.literal('health'),
  target: EntityTargetSchema,
  compare: z.enum(['current', 'max', 'percent', 'missing']),
  op: ComparisonOpSchema,
  value: z.number(),
})

export const HasPowerConditionSchema = z.object({
  type: z.literal('hasPower'),
  target: EntityTargetSchema,
  powerId: z.string().min(1),
  minStacks: z.number().optional(),
})

export const ResourceConditionSchema = z.object({
  type: z.literal('resource'),
  resource: z.enum(['energy', 'gold', 'block']),
  target: EntityTargetSchema.optional(),
  op: ComparisonOpSchema,
  value: z.number(),
})

export const CardCountConditionSchema = z.object({
  type: z.literal('cardCount'),
  pile: z.enum(['hand', 'drawPile', 'discardPile', 'exhaustPile']),
  op: ComparisonOpSchema,
  value: z.number(),
  filter: CardFilterSchema.optional(),
})

export const TurnConditionSchema = z.object({
  type: z.literal('turn'),
  op: ComparisonOpSchema,
  value: z.number(),
})

export const CombatConditionSchema = z.object({
  type: z.literal('combat'),
  check: z.enum(['enemyCount', 'isPlayerTurn', 'isFirstTurn']),
  op: ComparisonOpSchema.optional(),
  value: z.number().optional(),
})

export const CardsPlayedConditionSchema = z.object({
  type: z.literal('cardsPlayed'),
  op: ComparisonOpSchema,
  value: z.number(),
})

// ============================================
// COMPOSITE CONDITIONS (Recursive)
// ============================================

// Forward declaration for recursive types
type ConditionType = z.infer<typeof BaseConditionSchema> | AndCondition | OrCondition | NotCondition

interface AndCondition {
  type: 'and'
  conditions: ConditionType[]
}

interface OrCondition {
  type: 'or'
  conditions: ConditionType[]
}

interface NotCondition {
  type: 'not'
  condition: ConditionType
}

// Base conditions (non-recursive)
const BaseConditionSchema = z.discriminatedUnion('type', [
  HealthConditionSchema,
  HasPowerConditionSchema,
  ResourceConditionSchema,
  CardCountConditionSchema,
  TurnConditionSchema,
  CombatConditionSchema,
  CardsPlayedConditionSchema,
])

// Recursive condition schema using z.lazy()
export const ConditionSchema: z.ZodType<ConditionType> = z.lazy(() =>
  z.union([
    BaseConditionSchema,
    z.object({
      type: z.literal('and'),
      conditions: z.array(ConditionSchema),
    }),
    z.object({
      type: z.literal('or'),
      conditions: z.array(ConditionSchema),
    }),
    z.object({
      type: z.literal('not'),
      condition: ConditionSchema,
    }),
  ])
)
