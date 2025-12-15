// Content seeding utilities for development
// Generates base enemies and dungeons via Groq AI

import { generateBaseEnemySet } from './card-generator'
import { generateBaseDungeonSet } from './dungeon-generator'
import { registerCard } from './cards'
import { db, saveDungeonDeck } from '../stores/db'

export interface SeedResult {
  enemies: number
  dungeons: number
  errors: string[]
}

/**
 * Seed the game with AI-generated base content.
 * - Generates 10 base enemies across elements/difficulties
 * - Generates 5 starter dungeons
 * - Registers enemies in card registry
 * - Saves dungeons to IndexedDB
 */
export async function seedBaseContent(): Promise<SeedResult> {
  const result: SeedResult = { enemies: 0, dungeons: 0, errors: [] }

  console.log('[seedBaseContent] Starting content generation...')

  // Generate and register enemies
  try {
    console.log('[seedBaseContent] Generating enemies...')
    const enemies = await generateBaseEnemySet()
    for (const enemy of enemies) {
      registerCard(enemy)
      result.enemies++
    }
    console.log(`[seedBaseContent] Registered ${result.enemies} enemies`)
  } catch (error) {
    const msg = `Enemy generation failed: ${error}`
    console.error('[seedBaseContent]', msg)
    result.errors.push(msg)
  }

  // Generate and save dungeons
  try {
    console.log('[seedBaseContent] Generating dungeons...')
    const dungeons = await generateBaseDungeonSet()
    for (const dungeon of dungeons) {
      await saveDungeonDeck(dungeon)
      result.dungeons++
    }
    console.log(`[seedBaseContent] Saved ${result.dungeons} dungeons`)
  } catch (error) {
    const msg = `Dungeon generation failed: ${error}`
    console.error('[seedBaseContent]', msg)
    result.errors.push(msg)
  }

  console.log('[seedBaseContent] Complete:', result)
  return result
}

/**
 * Check if base content has already been seeded.
 */
export async function isContentSeeded(): Promise<boolean> {
  const dungeonCount = await db.dungeonDecks.count()
  return dungeonCount >= 5
}
