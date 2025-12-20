// Content seeding utilities for development
// Generates base enemies and dungeons via Groq AI

import { generateBaseEnemySet } from './card-generator'
import { generateBaseDungeonSet } from './dungeon-generator'
import { registerCardUnsafe } from './cards'
import { getAllModifiers } from './modifiers'
import { db, saveDungeonDeck } from '../stores/db'
import { useMetaStore } from '../stores/metaStore'
import { logger } from '../lib/logger'

export interface SeedResult {
  enemies: number
  dungeons: number
  modifiers: number
  errors: string[]
}

// ============================================
// STARTER MODIFIERS
// ============================================

/**
 * IDs of starter modifiers to give players (from static registry in game/modifiers.ts).
 * These reference the canonical definitions - no need to duplicate them here.
 */
const STARTER_MODIFIER_IDS = [
  // Common
  'copper_tithe',
  'kindling',
  'blood_price',
  'dark_prophecy',
  'whispers_of_doom',
  'austerity_decree',
  // Uncommon
  'gauntlet_decree',
  'ember_pact',
  'frost_binding',
]

/**
 * Seed starter modifiers into the meta store.
 * Uses definitions from the static registry (game/modifiers.ts).
 */
export function seedStarterModifiers(): number {
  const { addModifier, ownedModifiers } = useMetaStore.getState()
  const allModifiers = getAllModifiers()

  let seeded = 0
  const now = Date.now()

  for (const modId of STARTER_MODIFIER_IDS) {
    // Verify modifier exists in static registry
    const definition = allModifiers.find(m => m.id === modId)
    if (!definition) {
      logger.warn('Seed', `Modifier ${modId} not found in registry, skipping`)
      continue
    }

    // Check if already owned
    if (ownedModifiers.some(m => m.definitionId === modId)) continue

    // Give player 2 copies of common, 1 copy of uncommon+
    const quantity = definition.rarity === 'common' ? 2 : 1

    addModifier({
      definitionId: modId,
      quantity,
      obtainedAt: now,
      source: 'starter',
    })

    seeded++
  }

  return seeded
}

/**
 * Seed the game with AI-generated base content.
 * - Generates 10 base enemies across elements/difficulties
 * - Generates 5 starter dungeons
 * - Seeds starter modifiers
 * - Registers enemies in card registry
 * - Saves dungeons to IndexedDB
 */
export async function seedBaseContent(): Promise<SeedResult> {
  const result: SeedResult = { enemies: 0, dungeons: 0, modifiers: 0, errors: [] }

  logger.info('Seed', 'Starting content generation...')

  // Seed starter modifiers (synchronous, no AI needed)
  try {
    result.modifiers = seedStarterModifiers()
    logger.info('Seed', `Seeded ${result.modifiers} starter modifiers`)
  } catch (error) {
    const msg = `Modifier seeding failed: ${error instanceof Error ? error.message : String(error)}`
    logger.error('Seed', msg)
    result.errors.push(msg)
  }

  // Generate and register enemies
  try {
    logger.info('Seed', 'Generating enemies...')
    const enemies = await generateBaseEnemySet()
    for (const enemy of enemies) {
      registerCardUnsafe(enemy)
      result.enemies++
    }
    logger.info('Seed', `Registered ${result.enemies} enemies`)
  } catch (error) {
    const msg = `Enemy generation failed: ${error instanceof Error ? error.message : String(error)}`
    logger.error('Seed', msg)
    result.errors.push(msg)
  }

  // Generate and save dungeons
  try {
    logger.info('Seed', 'Generating dungeons...')
    const dungeons = await generateBaseDungeonSet()
    for (const dungeon of dungeons) {
      await saveDungeonDeck(dungeon)
      result.dungeons++
    }
    logger.info('Seed', `Saved ${result.dungeons} dungeons`)
  } catch (error) {
    const msg = `Dungeon generation failed: ${error instanceof Error ? error.message : String(error)}`
    logger.error('Seed', msg)
    result.errors.push(msg)
  }

  logger.info('Seed', 'Complete:', result)
  return result
}

/**
 * Check if base content has already been seeded.
 */
export async function isContentSeeded(): Promise<boolean> {
  const dungeonCount = await db.dungeonDecks.count()
  return dungeonCount >= 5
}
