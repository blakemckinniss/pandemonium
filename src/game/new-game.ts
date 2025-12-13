import type { RunState, HeroDefinition, EnemyEntity } from '../types'
import { createCardInstance } from './actions'
import { generateUid, randomInt } from '../lib/utils'
import { createDungeonDeck, drawRoomChoices } from './dungeon-deck'
import { getRoomDefinition } from '../content/rooms'

// ============================================
// HERO DEFINITIONS
// ============================================

export const HEROES: Record<string, HeroDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Ironclad',
    health: 80,
    energy: 3,
    starterDeck: [
      'strike', 'strike', 'strike', 'strike', 'strike',
      'defend', 'defend', 'defend', 'defend',
      'bash',
    ],
  },
}

// ============================================
// MONSTER DEFINITIONS
// ============================================

export interface MonsterTemplate {
  id: string
  name: string
  healthRange: [number, number]
  damage: number
}

export const MONSTERS: Record<string, MonsterTemplate> = {
  slime: {
    id: 'slime',
    name: 'Acid Slime',
    healthRange: [8, 12],
    damage: 5,
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    healthRange: [48, 54],
    damage: 6,
  },
  jaw_worm: {
    id: 'jaw_worm',
    name: 'Jaw Worm',
    healthRange: [40, 44],
    damage: 11,
  },
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createEnemy(templateId: string): EnemyEntity {
  const template = MONSTERS[templateId]
  if (!template) {
    throw new Error(`Unknown monster: ${templateId}`)
  }

  const health = randomInt(template.healthRange[0], template.healthRange[1])

  return {
    id: generateUid(),
    name: template.name,
    currentHealth: health,
    maxHealth: health,
    block: 0,
    powers: {},
    intent: { type: 'attack', value: template.damage },
    patternIndex: 0,
  }
}

export function createNewRun(heroId: string = 'warrior'): RunState {
  const hero = HEROES[heroId]
  if (!hero) {
    throw new Error(`Unknown hero: ${heroId}`)
  }

  // Build deck from starter cards
  const deck = hero.starterDeck.map((cardId) => createCardInstance(cardId))

  // Create dungeon deck and draw initial choices
  const dungeonDeck = createDungeonDeck()
  const { choices, remaining } = drawRoomChoices(dungeonDeck, 3)

  return {
    gamePhase: 'roomSelect',
    floor: 1,
    hero,
    deck,
    combat: null,
    dungeonDeck: remaining,
    roomChoices: choices,
    gold: 99,
    stats: {
      enemiesKilled: 0,
      cardsPlayed: 0,
      damageDealt: 0,
      damageTaken: 0,
    },
  }
}

/**
 * Create enemies from a room definition
 */
export function createEnemiesFromRoom(roomId: string): EnemyEntity[] {
  const room = getRoomDefinition(roomId)
  if (!room?.monsters) return []

  return room.monsters.map((monsterId) => createEnemy(monsterId))
}

export function createTestCombat(): EnemyEntity[] {
  return [createEnemy('slime'), createEnemy('slime')]
}
