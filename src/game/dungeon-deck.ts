import type { RoomCard, RoomType, DungeonDeckDefinition, DungeonRoom } from '../types'
import { getRoomsByType } from '../content/rooms'
import { generateUid } from '../lib/utils'

// Dungeon structure: how many rooms of each type per act
interface DungeonTemplate {
  combat: number
  elite: number
  campfire: number
  treasure: number
  boss: number
}

const ACT_1_TEMPLATE: DungeonTemplate = {
  combat: 7,
  elite: 2,
  campfire: 2,
  treasure: 2,
  boss: 1,
}

/**
 * Create a shuffled dungeon deck for a new run
 */
export function createDungeonDeck(): RoomCard[] {
  const deck: RoomCard[] = []

  // Add combat rooms
  const combatRooms = getRoomsByType('combat')
  for (let i = 0; i < ACT_1_TEMPLATE.combat; i++) {
    const room = combatRooms[i % combatRooms.length]
    deck.push({
      uid: generateUid(),
      definitionId: room.id,
      revealed: false,
    })
  }

  // Add elite rooms
  const eliteRooms = getRoomsByType('elite')
  for (let i = 0; i < ACT_1_TEMPLATE.elite; i++) {
    const room = eliteRooms[i % eliteRooms.length]
    deck.push({
      uid: generateUid(),
      definitionId: room.id,
      revealed: false,
    })
  }

  // Add campfire rooms
  const campfireRooms = getRoomsByType('campfire')
  for (let i = 0; i < ACT_1_TEMPLATE.campfire; i++) {
    const room = campfireRooms[i % campfireRooms.length]
    deck.push({
      uid: generateUid(),
      definitionId: room.id,
      revealed: false,
    })
  }

  // Add treasure rooms
  const treasureRooms = getRoomsByType('treasure')
  for (let i = 0; i < ACT_1_TEMPLATE.treasure; i++) {
    const room = treasureRooms[i % treasureRooms.length]
    deck.push({
      uid: generateUid(),
      definitionId: room.id,
      revealed: false,
    })
  }

  // Add boss room at the end (don't shuffle boss)
  const bossRooms = getRoomsByType('boss')
  const bossCard: RoomCard = {
    uid: generateUid(),
    definitionId: bossRooms[0].id,
    revealed: false,
  }

  // Shuffle non-boss cards
  const shuffled = shuffleArray(deck)

  // Boss at START of array (drawn last since we pop from end)
  shuffled.unshift(bossCard)

  return shuffled
}

/**
 * Draw room choices from the dungeon deck
 */
export function drawRoomChoices(
  dungeonDeck: RoomCard[],
  count: number = 3
): { choices: RoomCard[]; remaining: RoomCard[] } {
  const choices: RoomCard[] = []
  const remaining = [...dungeonDeck]

  // Draw up to count cards
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const card = remaining.pop()!
    card.revealed = true
    choices.push(card)
  }

  return { choices, remaining }
}

/**
 * Check if this is the boss room
 */
export function isBossRoom(roomCard: RoomCard): boolean {
  return roomCard.definitionId.includes('boss')
}

/**
 * Get room difficulty color
 */
export function getRoomDifficultyColor(type: RoomType): string {
  switch (type) {
    case 'combat':
      return 'text-green-400'
    case 'elite':
      return 'text-yellow-400'
    case 'boss':
      return 'text-red-400'
    case 'campfire':
      return 'text-orange-400'
    case 'treasure':
      return 'text-purple-400'
    default:
      return 'text-gray-400'
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Room definition IDs by type - must match ROOMS in content/rooms.ts
const ROOM_DEFINITIONS_BY_TYPE: Record<string, string[]> = {
  combat: ['slime_pit', 'cultist_lair', 'jaw_worm_nest', 'mixed_combat', 'infernal_pit', 'frozen_cavern', 'storm_nexus', 'void_shrine', 'flooded_chamber'],
  elite: ['elite_guardian'],
  boss: ['boss_heart'],
  campfire: ['campfire'],
  treasure: ['treasure_small', 'treasure_large'],
  event: ['campfire'], // Fallback to campfire for events
  shop: ['treasure_small'], // Fallback to treasure for shops
}

/**
 * Map a DungeonRoom type to a valid room definition ID.
 * Uses randomization within type for variety.
 */
function getDefinitionIdForRoom(room: DungeonRoom): string {
  const options = ROOM_DEFINITIONS_BY_TYPE[room.type] ?? ROOM_DEFINITIONS_BY_TYPE.combat
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Convert a DungeonDeckDefinition into playable RoomCard array.
 * Maps DungeonRoom entries to RoomCard format, preserving enemyCardIds for combat override.
 */
export function createDungeonDeckFromDefinition(definition: DungeonDeckDefinition): RoomCard[] {
  return definition.rooms.map((room) => ({
    uid: generateUid(),
    definitionId: getDefinitionIdForRoom(room),
    revealed: false,
    enemyCardIds: room.enemyCardIds,
  }))
}
