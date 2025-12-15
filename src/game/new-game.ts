import type { RunState, HeroDefinition, EnemyEntity } from '../types'
import { createCardInstance } from './actions'
import { generateUid, randomInt } from '../lib/utils'
import { createDungeonDeck, drawRoomChoices } from './dungeon-deck'
import { getRoomDefinition } from '../content/rooms'
import { getCardDefinition, getEnemyCardById } from './cards'

// ============================================
// HERO DEFINITIONS
// ============================================

export const HEROES: Record<string, HeroDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Ironclad',
    health: 80,
    energy: 3,
    // Minimal starter deck - player builds better decks from collection
    starterDeck: [
      'strike', 'strike', 'strike', 'strike',
      'defend', 'defend', 'defend', 'defend',
      'bash', 'bash',
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
  // First, check if templateId is an enemy card
  const enemyCard = getEnemyCardById(templateId)
  if (enemyCard?.enemyStats) {
    const { healthRange, baseDamage, energy, element, vulnerabilities, resistances, innateStatus } = enemyCard.enemyStats
    const health = randomInt(healthRange[0], healthRange[1])

    return {
      id: generateUid(),
      cardId: enemyCard.id, // Reference to card definition for abilities
      name: enemyCard.name,
      currentHealth: health,
      maxHealth: health,
      block: 0,
      barrier: 0,
      powers: {},
      intent: { type: 'attack', value: baseDamage },
      patternIndex: 0,
      // Energy pool (like heroes)
      energy: energy,
      maxEnergy: energy,
      // Ability state
      abilityCooldown: 0,
      ultimateTriggered: false,
      // Elemental properties
      element,
      vulnerabilities,
      resistances,
      innateStatus,
    }
  }

  // Fall back to legacy MONSTERS lookup
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

/**
 * Resolve hero definition from either a hero card ID or legacy HEROES lookup
 */
function resolveHero(heroId: string): { def: HeroDefinition; heroCardId?: string } {
  // First, check if heroId is a hero card (theme: 'hero')
  const heroCard = getCardDefinition(heroId)
  if (heroCard?.theme === 'hero' && heroCard.heroStats) {
    // Convert hero card to HeroDefinition
    return {
      def: {
        id: heroCard.id,
        name: heroCard.name,
        health: heroCard.heroStats.health,
        energy: heroCard.heroStats.energy,
        // Hero cards use TCG collection - no preset starter deck
        starterDeck: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'bash', 'bash'],
      },
      heroCardId: heroCard.id,
    }
  }

  // Fall back to legacy HEROES lookup
  const legacyHero = HEROES[heroId]
  if (legacyHero) {
    return { def: legacyHero }
  }

  // Default to warrior if not found
  return { def: HEROES['warrior'] }
}

export function createNewRun(
  heroId: string = 'hero_ironclad',
  customCardIds?: string[],
  dungeonDeckId?: string
): RunState {
  const { def: hero, heroCardId } = resolveHero(heroId)

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
      heroCardId, // Reference to hero card for abilities
    },
    deck,
    relics: [],
    combat: null,
    dungeonDeck: remaining,
    roomChoices: choices,
    dungeonDeckId, // Track which dungeon deck is being played
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
