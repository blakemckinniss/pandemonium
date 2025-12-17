import type { RunState, HeroDefinition, EnemyEntity } from '../types'
import { createCardInstance } from './actions'
import { generateUid, randomInt } from '../lib/utils'
import { createDungeonDeck, createDungeonDeckFromDefinition, drawRoomChoices } from './dungeon-deck'
import { getRoomDefinition } from '../content/rooms'
import { getCardDefinition, getEnemyCardById } from './cards'
import { getDungeonDeck } from '../stores/db'

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
  times?: number  // Multi-hit attacks (e.g., 3x4 damage)
  image?: string  // Path to monster portrait
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
    image: '/cards/enemy_slime.webp',
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    healthRange: [48, 54],
    damage: 6,
    image: '/cards/enemy_cultist.webp',
  },
  jaw_worm: {
    id: 'jaw_worm',
    name: 'Jaw Worm',
    healthRange: [40, 44],
    damage: 11,
    image: '/cards/enemy_jaw_worm.webp',
  },
  spike_slime: {
    id: 'spike_slime',
    name: 'Spike Slime',
    healthRange: [28, 32],
    damage: 5,
    times: 2,  // Attacks twice: 2x5 damage
    image: '/cards/enemy_spike_slime.webp',
  },
  gremlin_nob: {
    id: 'gremlin_nob',
    name: 'Gremlin Nob',
    healthRange: [82, 86],
    damage: 8,
    times: 3,  // Attacks three times: 3x8 damage
    image: '/cards/enemy_gremlin_nob.webp',
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
    image: '/cards/enemy_fire_imp.webp',
  },
  frost_elemental: {
    id: 'frost_elemental',
    name: 'Frost Elemental',
    healthRange: [30, 36],
    damage: 5,
    resistances: ['ice'],
    vulnerabilities: ['fire'],
    innateStatus: 'frozen',
    image: '/cards/enemy_frost_elemental.webp',
  },
  storm_sprite: {
    id: 'storm_sprite',
    name: 'Storm Sprite',
    healthRange: [14, 18],
    damage: 4,
    resistances: ['lightning'],
    vulnerabilities: ['physical'],
    innateStatus: 'charged',
    image: '/cards/enemy_storm_sprite.webp',
  },
  void_cultist: {
    id: 'void_cultist',
    name: 'Void Cultist',
    healthRange: [35, 42],
    damage: 8,
    resistances: ['void'],
    vulnerabilities: ['lightning'],
    innateStatus: 'oiled',
    image: '/cards/enemy_void_cultist.webp',
  },
  water_slime: {
    id: 'water_slime',
    name: 'Water Slime',
    healthRange: [20, 26],
    damage: 4,
    resistances: ['ice', 'physical'],
    vulnerabilities: ['lightning', 'fire'],
    innateStatus: 'wet',
    image: '/cards/enemy_water_slime.webp',
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
    image: template.image,
    currentHealth: health,
    maxHealth: health,
    block: 0,
    barrier: 0,
    powers: {},
    intent: { type: 'attack', value: template.damage, times: template.times },
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

export async function createNewRun(
  heroId: string = 'hero_ironclad',
  customCardIds?: string[],
  dungeonDeckId?: string
): Promise<RunState> {
  const { def: hero, heroCardId } = resolveHero(heroId)

  // Build deck from custom cards or hero starter deck
  const cardIds = customCardIds ?? hero.starterDeck
  const deck = cardIds.map((cardId) => createCardInstance(cardId))

  // Create dungeon deck: load from definition if ID provided, otherwise generate random
  let dungeonDeck
  if (dungeonDeckId) {
    const definition = await getDungeonDeck(dungeonDeckId)
    if (definition) {
      dungeonDeck = createDungeonDeckFromDefinition(definition)
    } else {
      // Fallback to random if dungeon not found
      dungeonDeck = createDungeonDeck()
    }
  } else {
    dungeonDeck = createDungeonDeck()
  }
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

// Monster tiers for dungeon generation - lower tiers are weaker
const MONSTER_TIERS: Record<string, string[]> = {
  tier_1: ['slime', 'storm_sprite', 'fire_imp', 'water_slime'],
  tier_2: ['cultist', 'jaw_worm', 'frost_elemental', 'void_cultist'],
  tier_3: ['jaw_worm', 'cultist', 'frost_elemental', 'void_cultist'], // Harder versions, same pool for now
}

/**
 * Resolve a monster ID or tier hint to actual monster IDs.
 * Tier hints like "tier_1" get resolved to random monsters from that tier.
 */
function resolveMonsterIds(ids: string[]): string[] {
  return ids.flatMap((id) => {
    if (id.startsWith('tier_')) {
      const tier = MONSTER_TIERS[id]
      if (tier && tier.length > 0) {
        // Pick 1-2 random monsters from the tier
        const count = Math.random() > 0.5 ? 2 : 1
        const result: string[] = []
        for (let i = 0; i < count; i++) {
          result.push(tier[Math.floor(Math.random() * tier.length)])
        }
        return result
      }
    }
    return [id] // Return as-is if not a tier hint
  })
}

/**
 * Create enemies from a room definition.
 * If enemyCardIds is provided, use those instead of room definition's monsters.
 * Supports tier hints (tier_1, tier_2, tier_3) that resolve to actual monsters.
 */
export function createEnemiesFromRoom(roomId: string, enemyCardIds?: string[]): EnemyEntity[] {
  // Use override enemies if provided
  if (enemyCardIds && enemyCardIds.length > 0) {
    const resolvedIds = resolveMonsterIds(enemyCardIds)
    return resolvedIds.map((id) => createEnemy(id))
  }

  // Fall back to room definition monsters
  const room = getRoomDefinition(roomId)
  if (!room?.monsters) return []

  return room.monsters.map((monsterId) => createEnemy(monsterId))
}

export function createTestCombat(): EnemyEntity[] {
  return [createEnemy('slime'), createEnemy('slime')]
}
