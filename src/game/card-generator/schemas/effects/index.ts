// ============================================
// ATOMIC EFFECT DISCRIMINATED UNION
// Combines all 54+ effect types into a single schema
// ============================================

import { z } from 'zod'

// Import all effect schema arrays
import { CombatEffectSchemas } from './combat'
import { AdvancedCombatEffectSchemas } from './advanced-combat'
import { CardEffectSchemas } from './cards'
import { PowerEffectSchemas } from './powers'
import {
  MetaEffectSchemas,
  setAtomicEffectSchema as setMetaAtomicEffectSchema,
} from './meta'
import {
  MiscEffectSchemas,
  setAtomicEffectSchema as setMiscAtomicEffectSchema,
} from './misc'

// Build the discriminated union from all effect schemas
// Using discriminatedUnion for efficient type-based matching
const AllEffectSchemas = [
  ...CombatEffectSchemas,
  ...AdvancedCombatEffectSchemas,
  ...CardEffectSchemas,
  ...PowerEffectSchemas,
  ...MetaEffectSchemas,
  ...MiscEffectSchemas,
] as const

// Create the discriminated union
// Note: We need at least 2 schemas, which we have (54+)
export const AtomicEffectSchema = z.discriminatedUnion('type', [
  ...AllEffectSchemas,
])

// Inject the complete schema into recursive modules
setMetaAtomicEffectSchema(AtomicEffectSchema)
setMiscAtomicEffectSchema(AtomicEffectSchema)

// Export inferred type for type-safety
export type AtomicEffectSchemaType = z.infer<typeof AtomicEffectSchema>

// Export individual categories for targeted validation
export {
  CombatEffectSchemas,
  AdvancedCombatEffectSchemas,
  CardEffectSchemas,
  PowerEffectSchemas,
  MetaEffectSchemas,
  MiscEffectSchemas,
}

// Re-export individual schemas for granular access (excluding setter functions to avoid conflicts)
export * from './combat'
export * from './advanced-combat'
export * from './cards'
export * from './powers'
// Note: meta and misc have setAtomicEffectSchema which conflicts - export schemas individually
export {
  ConditionalEffectSchema,
  RepeatEffectSchema,
  RandomEffectSchema,
  SequenceEffectSchema,
  ForEachEffectSchema,
} from './meta'
export {
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
} from './misc'
