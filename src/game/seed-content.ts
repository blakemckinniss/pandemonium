// Content seeding utilities for development
// Generates base enemies and dungeons via Groq AI

import { generateBaseEnemySet } from './card-generator'
import { generateBaseDungeonSet } from './dungeon-generator'
import { registerCardUnsafe } from './cards'
import { db, saveDungeonDeck } from '../stores/db'
import { useMetaStore } from '../stores/metaStore'
import { logger } from '../lib/logger'
import type { ModifierDefinition } from '../types'

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
 * System-defined starter modifiers for initial gameplay.
 * Based on the DV/RV balance system from the design doc.
 */
const STARTER_MODIFIERS: ModifierDefinition[] = [
  // Common Catalysts (consumable, low DV)
  {
    id: 'mod_copper_tithe',
    name: 'Copper Tithe',
    description: '+15% gold from all sources. Enemies have +5% HP.',
    flavorText: 'Greed always demands its toll.',
    category: 'catalyst',
    rarity: 'common',
    dangerValue: 5,
    rewardValue: 5,
    durability: { type: 'consumable' },
    effects: [
      { target: 'reward_scaling', scope: 'gold', multiplier: 1.15 },
      { target: 'enemy_stats', scope: 'all', stat: 'health', operation: 'multiply', value: 1.05 },
    ],
    generatedBy: 'system',
  },
  {
    id: 'mod_blood_price',
    name: 'Blood Price',
    description: 'Start with -10 HP. Gain +1 Strength.',
    flavorText: 'Power carved from flesh.',
    category: 'catalyst',
    rarity: 'common',
    dangerValue: 5,
    rewardValue: 5,
    durability: { type: 'consumable' },
    effects: [
      { target: 'player_stats', stat: 'startingHealth', operation: 'add', value: -10 },
      { target: 'player_stats', stat: 'strength', operation: 'add', value: 1 },
    ],
    generatedBy: 'system',
  },
  {
    id: 'mod_kindling',
    name: 'Kindling',
    description: '-1 Campfire room, +1 Treasure room.',
    flavorText: 'Rest is for the weak. Riches await.',
    category: 'catalyst',
    rarity: 'common',
    dangerValue: 5,
    rewardValue: 4,
    durability: { type: 'consumable' },
    effects: [
      { target: 'room_distribution', roomType: 'campfire', operation: 'add', count: -1 },
      { target: 'room_distribution', roomType: 'treasure', operation: 'add', count: 1 },
    ],
    generatedBy: 'system',
  },
  // Common Omens
  {
    id: 'mod_dark_prophecy',
    name: 'Dark Prophecy',
    description: 'Elite enemies deal +10% damage. +20% gold from elites.',
    flavorText: 'The strong grow stronger in shadow.',
    category: 'omen',
    rarity: 'common',
    dangerValue: 6,
    rewardValue: 6,
    durability: { type: 'consumable' },
    effects: [
      { target: 'enemy_stats', scope: 'elites', stat: 'damage', operation: 'multiply', value: 1.10 },
      { target: 'reward_scaling', scope: 'gold', multiplier: 1.20 },
    ],
    generatedBy: 'system',
  },
  // Uncommon (fragile)
  {
    id: 'mod_gauntlet_decree',
    name: 'Gauntlet Decree',
    description: '+2 Elite rooms. +50% gold from all sources.',
    flavorText: 'By royal command, prove your worth.',
    category: 'edict',
    rarity: 'uncommon',
    dangerValue: 16,
    rewardValue: 15,
    durability: { type: 'fragile', uses: 3, maxUses: 3 },
    effects: [
      { target: 'room_distribution', roomType: 'elite', operation: 'add', count: 2 },
      { target: 'reward_scaling', scope: 'gold', multiplier: 1.50 },
    ],
    generatedBy: 'system',
  },
  {
    id: 'mod_forge_seal',
    name: 'Forge Seal',
    description: 'Start with +1 Energy. -1 card draw per turn.',
    flavorText: 'Power concentrated, options limited.',
    category: 'seal',
    rarity: 'uncommon',
    dangerValue: 7,
    rewardValue: 7,
    durability: { type: 'fragile', uses: 3, maxUses: 3 },
    effects: [
      { target: 'player_stats', stat: 'energy', operation: 'add', value: 1 },
      { target: 'player_stats', stat: 'draw', operation: 'add', value: -1 },
    ],
    generatedBy: 'system',
  },
]

/**
 * Seed starter modifiers into the meta store.
 */
export function seedStarterModifiers(): number {
  const { addModifierDefinition, addModifier, modifierDefinitions } = useMetaStore.getState()

  let seeded = 0
  const now = Date.now()

  for (const mod of STARTER_MODIFIERS) {
    // Check if already registered
    if (modifierDefinitions.some(m => m.id === mod.id)) continue

    // Add definition
    addModifierDefinition(mod)

    // Give player 2 copies of each starter modifier
    addModifier({
      definitionId: mod.id,
      quantity: 2,
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
