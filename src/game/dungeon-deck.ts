import type { RoomCard, RoomType } from '../types'
import { getRoomsByType } from '../content/rooms'
import { generateUid } from '../lib/utils'

// Dungeon structure: how many rooms of each type per act
interface DungeonTemplate {
  combat: number
  elite: number
  campfire: number
  boss: number
}

const ACT_1_TEMPLATE: DungeonTemplate = {
  combat: 7,
  elite: 2,
  campfire: 2,
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
