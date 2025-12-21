/**
 * Dungeon Deck Generation via Groq AI
 *
 * Generates themed dungeon decks with balanced room distribution.
 * Used to create roguelike run structures.
 */

import { chatCompletion } from '../lib/groq'
import { generateUid } from '../lib/utils'
import { logger } from '../lib/logger'
import { loadPrompt } from '../config/prompts/loader'
import type { DungeonDeckDefinition, DungeonRoom, RoomType, RoomModifier } from '../types'

// ============================================
// DUNGEON SYSTEM PROMPT (LEGACY - kept as fallback)
// ============================================

const DUNGEON_SYSTEM_PROMPT_LEGACY = `You are a dungeon designer for Pandemonium, a Slay the Spire-style roguelike deckbuilder.

Generate unique dungeon decks as valid JSON. A dungeon deck defines a complete run structure with themed rooms.

DUNGEON SCHEMA (respond with ONLY this JSON, no markdown):
{
  "name": "string (dungeon name, e.g., 'The Crimson Depths')",
  "description": "string (1-2 sentence dungeon lore)",
  "theme": "string (e.g., 'Fire Caverns', 'Void Temple', 'Frozen Wastes')",
  "difficulty": 1-5 (1=easy, 5=brutal),
  "rooms": [DungeonRoom array - see below]
}

DUNGEON ROOM SCHEMA:
{
  "id": "string (unique room id, e.g., 'room_01')",
  "type": "combat" | "elite" | "boss" | "campfire" | "event" | "shop" | "treasure",
  "name": "string (optional, thematic room name)",
  "enemyTier": 1 | 2 | 3 (for combat/elite/boss rooms - which difficulty enemies to spawn),
  "modifiers": [{ "type": "elite" | "boss" | "doubleEnemy" | "enhancedReward" }] (optional)
}

ROOM DISTRIBUTION GUIDELINES (for a 15-room dungeon):
- Combat rooms: 60% (9 rooms) - Regular enemy encounters
- Elite rooms: 15% (2 rooms) - Stronger enemies, better rewards
- Campfire: 10% (1-2 rooms) - Rest and heal
- Treasure: 10% (1-2 rooms) - Guaranteed rewards
- Boss: 5% (1 room) - Final challenge, always last

ROOM FLOW PATTERN:
1. Start with 2-3 easy combat rooms
2. Mix in first elite around room 4-5
3. Campfire before elite/boss
4. Treasure rooms as rewards after tough fights
5. Boss is ALWAYS the final room

DIFFICULTY SCALING:
- Difficulty 1-2: Mostly Tier 1 enemies, easy elites
- Difficulty 3: Mix of Tier 1-2 enemies, Tier 2 elites
- Difficulty 4: Mostly Tier 2 enemies, Tier 3 elites
- Difficulty 5: Tier 2-3 enemies, brutal boss

THEME EXAMPLES:
- "Volcanic Depths" - Fire themed, lava hazards, fire enemies
- "Frozen Sanctum" - Ice themed, cold damage, frozen enemies
- "Storm Spire" - Lightning themed, chain attacks, storm elementals
- "Shadow Crypt" - Void themed, debuffs, undead enemies
- "Ancient Ruins" - Physical, golems, guardians
- "Cursed Forest" - Poison, nature, corrupted beasts

Create dungeons that feel cohesive - room names and composition should match the theme.
The boss room should have a unique name fitting the dungeon's theme.

Respond with ONLY the JSON object. No explanation, no markdown code blocks.`

// ============================================
// DUNGEON GENERATION OPTIONS
// ============================================

export interface DungeonGenerationOptions {
  difficulty?: 1 | 2 | 3 | 4 | 5
  theme?: string // "Fire", "Ice", "Void", etc.
  roomCount?: number // Default 15
  hint?: string // Creative direction hint
}

// ============================================
// DUNGEON GENERATION FUNCTION
// ============================================

/**
 * Generate a dungeon deck definition via AI.
 * Creates themed dungeons with balanced room distribution.
 */
export async function generateDungeonDeck(
  options?: DungeonGenerationOptions
): Promise<DungeonDeckDefinition> {
  const difficulty = options?.difficulty ?? 3
  const roomCount = options?.roomCount ?? 15

  // Build user prompt
  const parts: string[] = [
    `Generate a ${roomCount}-room dungeon.`,
    `Difficulty: ${difficulty} out of 5.`,
  ]

  if (options?.theme) {
    parts.push(`Theme: ${options.theme} themed dungeon.`)
  }

  if (options?.hint) {
    parts.push(`Creative direction: ${options.hint}`)
  }

  const userPrompt = parts.join(' ')

  // Load prompt from YAML config (falls back to legacy if unavailable)
  let systemPrompt: string
  try {
    systemPrompt = await loadPrompt('dungeon')
  } catch {
    logger.warn('DungeonGen', 'Failed to load YAML prompt, using legacy')
    systemPrompt = DUNGEON_SYSTEM_PROMPT_LEGACY
  }

  // Call Groq with dungeon system prompt
  const response = await chatCompletion(systemPrompt, userPrompt, {
    temperature: 0.85,
    maxTokens: 1024,
  })

  // Parse and validate
  const parsed = parseDungeonResponse(response)
  const validated = validateDungeon(parsed, difficulty, roomCount)

  // Generate unique ID
  const dungeonId = `dungeon_${validated.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${generateUid().slice(0, 6)}`

  const definition: DungeonDeckDefinition = {
    id: dungeonId,
    name: validated.name,
    description: validated.description,
    theme: validated.theme,
    difficulty: validated.difficulty,
    rooms: validated.rooms,
    createdBy: 'groq',
    createdAt: Date.now(),
  }

  return definition
}

// ============================================
// PARSING & VALIDATION
// ============================================

function parseDungeonResponse(response: string): Record<string, unknown> {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>
    }
    throw new Error(`Failed to parse dungeon response: ${response}`)
  }
}

interface ValidatedDungeon {
  name: string
  description: string
  theme: string
  difficulty: 1 | 2 | 3 | 4 | 5
  rooms: DungeonRoom[]
}

function validateDungeon(
  data: Record<string, unknown>,
  targetDifficulty: number,
  targetRoomCount: number
): ValidatedDungeon {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Dungeon must have a name')
  }

  // Validate difficulty
  const rawDifficulty = Number(data.difficulty) || targetDifficulty
  const difficulty = Math.max(1, Math.min(5, rawDifficulty)) as 1 | 2 | 3 | 4 | 5

  // Validate rooms
  const rawRooms = data.rooms
  if (!Array.isArray(rawRooms) || rawRooms.length === 0) {
    // Generate default rooms if missing
    return {
      name: data.name,
      description: typeof data.description === 'string' ? data.description : `A mysterious dungeon called ${String(data.name)}.`,
      theme: typeof data.theme === 'string' ? data.theme : 'Unknown',
      difficulty,
      rooms: generateDefaultRooms(targetRoomCount, difficulty),
    }
  }

  const validRoomTypes: RoomType[] = ['combat', 'elite', 'boss', 'campfire', 'event', 'shop', 'treasure']

  const rooms: DungeonRoom[] = rawRooms.map((rawRoom, index) => {
    const room = rawRoom as Record<string, unknown>
    const roomType = validRoomTypes.includes(room.type as RoomType)
      ? (room.type as RoomType)
      : 'combat'

    const modifiers: RoomModifier[] = []
    if (Array.isArray(room.modifiers)) {
      for (const mod of room.modifiers) {
        const m = mod as Record<string, unknown>
        const validModTypes = ['elite', 'boss', 'doubleEnemy', 'noReward', 'enhancedReward'] as const
        if (typeof m.type === 'string' && validModTypes.includes(m.type as typeof validModTypes[number])) {
          modifiers.push({
            type: m.type as RoomModifier['type'],
            value: typeof m.value === 'number' ? m.value : undefined,
          })
        }
      }
    }

    const roomId = typeof room.id === 'string' ? room.id : `room_${String(index + 1).padStart(2, '0')}`
    const enemyTier = typeof room.enemyTier === 'number' ? room.enemyTier : getTierForDifficulty(difficulty, roomType)

    return {
      id: roomId,
      type: roomType,
      // Map enemyTier to actual enemy card IDs - will be resolved at runtime
      // For now we store the tier as a hint in enemyCardIds format
      enemyCardIds: roomType === 'combat' || roomType === 'elite' || roomType === 'boss'
        ? [`tier_${enemyTier}`]
        : undefined,
      modifiers: modifiers.length > 0 ? modifiers : undefined,
    }
  })

  // Ensure boss room is last
  const bossIndex = rooms.findIndex(r => r.type === 'boss')
  if (bossIndex >= 0 && bossIndex !== rooms.length - 1) {
    const bossRoom = rooms.splice(bossIndex, 1)[0]
    rooms.push(bossRoom)
  }

  return {
    name: data.name,
    description: typeof data.description === 'string' ? data.description : `A mysterious dungeon called ${String(data.name)}.`,
    theme: typeof data.theme === 'string' ? data.theme : 'Unknown',
    difficulty,
    rooms,
  }
}

// ============================================
// HELPERS
// ============================================

function getTierForDifficulty(difficulty: number, roomType: RoomType): number {
  if (roomType === 'boss') return Math.min(3, difficulty)
  if (roomType === 'elite') return Math.max(2, Math.min(3, difficulty))
  // Regular combat scales with difficulty
  if (difficulty <= 2) return 1
  if (difficulty <= 4) return 2
  return 3
}

function generateDefaultRooms(count: number, difficulty: number): DungeonRoom[] {
  const rooms: DungeonRoom[] = []

  // Simple distribution: 60% combat, 15% elite, 10% campfire, 10% treasure, 5% boss
  const combatCount = Math.floor(count * 0.6)
  const eliteCount = Math.floor(count * 0.15)
  const campfireCount = Math.floor(count * 0.1)
  const treasureCount = Math.floor(count * 0.1)

  let roomIndex = 1

  // Add combat rooms
  for (let i = 0; i < combatCount; i++) {
    rooms.push({
      id: `room_${String(roomIndex++).padStart(2, '0')}`,
      type: 'combat',
      enemyCardIds: [`tier_${getTierForDifficulty(difficulty, 'combat')}`],
    })
  }

  // Add elite rooms
  for (let i = 0; i < eliteCount; i++) {
    rooms.push({
      id: `room_${String(roomIndex++).padStart(2, '0')}`,
      type: 'elite',
      enemyCardIds: [`tier_${getTierForDifficulty(difficulty, 'elite')}`],
    })
  }

  // Add campfire rooms
  for (let i = 0; i < campfireCount; i++) {
    rooms.push({
      id: `room_${String(roomIndex++).padStart(2, '0')}`,
      type: 'campfire',
    })
  }

  // Add treasure rooms
  for (let i = 0; i < treasureCount; i++) {
    rooms.push({
      id: `room_${String(roomIndex++).padStart(2, '0')}`,
      type: 'treasure',
    })
  }

  // Add boss room (always last)
  rooms.push({
    id: `room_${String(roomIndex).padStart(2, '0')}`,
    type: 'boss',
    enemyCardIds: [`tier_${getTierForDifficulty(difficulty, 'boss')}`],
    modifiers: [{ type: 'boss' }],
  })

  // Shuffle non-boss rooms for variety
  const bossRoom = rooms.pop()!
  shuffleArray(rooms)
  rooms.push(bossRoom)

  return rooms
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// ============================================
// BASE DUNGEON SET GENERATION
// ============================================

/**
 * Generate starter dungeon decks across difficulty levels.
 * Creates 5 themed dungeons for initial game content.
 */
export async function generateBaseDungeonSet(): Promise<DungeonDeckDefinition[]> {
  const dungeonSpecs: DungeonGenerationOptions[] = [
    // Easy dungeons (2)
    { difficulty: 1, theme: 'Ancient Ruins', roomCount: 12, hint: 'Crumbling stone temple with golem guardians' },
    { difficulty: 2, theme: 'Cursed Forest', roomCount: 12, hint: 'Dark woods with corrupted nature spirits' },

    // Medium dungeons (2)
    { difficulty: 3, theme: 'Volcanic Depths', roomCount: 15, hint: 'Lava caverns with fire elementals and demons' },
    { difficulty: 3, theme: 'Frozen Sanctum', roomCount: 15, hint: 'Ice temple with frost creatures and undead' },

    // Hard dungeon (1)
    { difficulty: 4, theme: 'Shadow Crypt', roomCount: 18, hint: 'Void-touched necropolis with powerful undead bosses' },
  ]

  const dungeons: DungeonDeckDefinition[] = []

  for (const spec of dungeonSpecs) {
    try {
      const dungeon = await generateDungeonDeck(spec)
      dungeons.push(dungeon)
      logger.debug('DungeonGen', `Generated: ${dungeon.name} (${dungeon.rooms.length} rooms)`)
    } catch (error) {
      logger.error('DungeonGen', 'Failed to generate dungeon:', error)
      // Continue with other dungeons
    }
  }

  return dungeons
}
