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
      // Core strikes (10)
      'strike', 'strike', 'strike', 'strike', 'strike',
      'strike', 'strike', 'strike', 'strike', 'strike',
      // Core defends (8)
      'defend', 'defend', 'defend', 'defend',
      'defend', 'defend', 'defend', 'defend',
      // Special attacks (10)
      'bash', 'bash',
      'cleave', 'cleave',
      'pommel_strike', 'pommel_strike',  // Draw cards
      'twin_strike', 'twin_strike',
      'uppercut', 'carnage',
      // Skills (8)
      'shrug_it_off', 'shrug_it_off',
      'battle_trance', 'battle_trance',  // Draw cards
      'armaments', 'armaments',
      'true_grit', 'bloodletting',
      // Powers (4)
      'inflame', 'inflame',
      'metallicize', 'demon_form',
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
  // Elemental properties
  vulnerabilities?: import('../types').Element[]
  resistances?: import('../types').Element[]
  innateStatus?: import('../types').ElementalStatus
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

  // --- ELEMENTAL MONSTERS ---

  fire_imp: {
    id: 'fire_imp',
    name: 'Fire Imp',
    healthRange: [18, 24],
    damage: 7,
    resistances: ['fire'],
    vulnerabilities: ['ice'],
    innateStatus: 'burning', // Burns itself but deals fire damage
  },
  frost_elemental: {
    id: 'frost_elemental',
    name: 'Frost Elemental',
    healthRange: [30, 36],
    damage: 5,
    resistances: ['ice'],
    vulnerabilities: ['fire'],
    innateStatus: 'frozen',
  },
  storm_sprite: {
    id: 'storm_sprite',
    name: 'Storm Sprite',
    healthRange: [14, 18],
    damage: 4,
    resistances: ['lightning'],
    vulnerabilities: ['physical'],
    innateStatus: 'charged',
  },
  void_cultist: {
    id: 'void_cultist',
    name: 'Void Cultist',
    healthRange: [35, 42],
    damage: 8,
    resistances: ['void'],
    vulnerabilities: ['lightning'],
    innateStatus: 'oiled',
  },
  water_slime: {
    id: 'water_slime',
    name: 'Water Slime',
    healthRange: [20, 26],
    damage: 4,
    resistances: ['ice', 'physical'],
    vulnerabilities: ['lightning', 'fire'],
    innateStatus: 'wet',
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
    barrier: 0,
    powers: {},
    intent: { type: 'attack', value: template.damage },
    patternIndex: 0,
    // Elemental properties
    vulnerabilities: template.vulnerabilities,
    resistances: template.resistances,
    innateStatus: template.innateStatus,
  }
}

export function createNewRun(
  heroId: string = 'warrior',
  customCardIds?: string[]
): RunState {
  const hero = HEROES[heroId]
  if (!hero) {
    throw new Error(`Unknown hero: ${heroId}`)
  }

  // Build deck from custom cards or hero starter deck
  const cardIds = customCardIds ?? hero.starterDeck
  const deck = cardIds.map((cardId) => createCardInstance(cardId))

  // Create dungeon deck and draw initial choices
  const dungeonDeck = createDungeonDeck()
  const { choices, remaining } = drawRoomChoices(dungeonDeck, 3)

  return {
    gamePhase: 'roomSelect',
    floor: 1,
    hero: {
      ...hero,
      currentHealth: hero.health,
      maxHealth: hero.health,
    },
    deck,
    relics: [],
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
