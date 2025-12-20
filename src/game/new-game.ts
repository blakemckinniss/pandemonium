import type { RunState, HeroDefinition, EnemyEntity, ModifierInstance } from '../types'
import { createCardInstance } from './actions'
import { generateUid, randomInt } from '../lib/utils'
import { createDungeonDeck, createDungeonDeckFromDefinition, drawRoomChoices } from './dungeon-deck'
import { getRoomDefinition } from '../content/rooms'
import { getCardDefinition, getEnemyCardById } from './cards'
import { getDungeonDeck } from '../stores/db'
import { applyEnemyStatModifiers, getPlayerStatModifications } from './modifier-resolver'
import { calculateHeatEffects } from './heat'

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
  element?: import('../types').Element  // Monster's elemental affinity
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
    element: 'physical',
    image: '/cards/enemy_slime.webp',
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    healthRange: [48, 54],
    damage: 6,
    element: 'void',
    image: '/cards/enemy_cultist.webp',
  },
  jaw_worm: {
    id: 'jaw_worm',
    name: 'Jaw Worm',
    healthRange: [40, 44],
    damage: 11,
    element: 'physical',
    image: '/cards/enemy_jaw_worm.webp',
  },
  spike_slime: {
    id: 'spike_slime',
    name: 'Spike Slime',
    healthRange: [28, 32],
    damage: 5,
    times: 2,  // Attacks twice: 2x5 damage
    element: 'physical',
    image: '/cards/enemy_spike_slime.webp',
  },
  gremlin_nob: {
    id: 'gremlin_nob',
    name: 'Gremlin Nob',
    healthRange: [82, 86],
    damage: 8,
    times: 3,  // Attacks three times: 3x8 damage
    element: 'physical',
    image: '/cards/enemy_gremlin_nob.webp',
  },

  // --- ELEMENTAL MONSTERS ---

  fire_imp: {
    id: 'fire_imp',
    name: 'Fire Imp',
    healthRange: [18, 24],
    damage: 7,
    element: 'fire',
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
    element: 'ice',
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
    element: 'lightning',
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
    element: 'void',
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
    element: 'ice',
    resistances: ['ice', 'physical'],
    vulnerabilities: ['lightning', 'fire'],
    innateStatus: 'wet',
    image: '/cards/enemy_water_slime.webp',
  },

  // --- SHADOW CRYPT (Void Element) ---

  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    healthRange: [22, 28],
    damage: 6,
    resistances: ['void', 'physical'],
    vulnerabilities: ['fire', 'lightning'],
    element: 'void',
    image: '/cards/enemy_skeleton_warrior.webp',
  },
  shadow_wraith: {
    id: 'shadow_wraith',
    name: 'Shadow Wraith',
    healthRange: [16, 20],
    damage: 3,
    times: 3, // Fast multi-hit: 3x3 damage
    resistances: ['void', 'physical'],
    vulnerabilities: ['fire'],
    element: 'void',
    image: '/cards/enemy_shadow_wraith.webp',
  },
  bone_golem: {
    id: 'bone_golem',
    name: 'Bone Golem',
    healthRange: [55, 65],
    damage: 12,
    resistances: ['void', 'physical', 'ice'],
    vulnerabilities: ['fire', 'lightning'],
    element: 'void',
    image: '/cards/enemy_bone_golem.webp',
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    healthRange: [40, 48],
    damage: 7,
    resistances: ['void'],
    vulnerabilities: ['fire', 'physical'],
    element: 'void',
    innateStatus: 'oiled', // Dark magic aura
    image: '/cards/enemy_necromancer.webp',
  },

  // --- ELITE MONSTER VARIANTS ---
  // Enhanced versions with higher stats and special behaviors

  elite_slime: {
    id: 'elite_slime',
    name: 'Corrupted Slime',
    healthRange: [35, 45],
    damage: 8,
    times: 2, // Double attack
    element: 'void',
    resistances: ['void', 'physical'],
    image: '/cards/enemy_slime.webp',
  },
  elite_cultist: {
    id: 'elite_cultist',
    name: 'High Priestess',
    healthRange: [65, 75],
    damage: 10,
    element: 'void',
    resistances: ['void'],
    vulnerabilities: ['fire'],
    innateStatus: 'oiled',
    image: '/cards/enemy_cultist.webp',
  },
  elite_fire_imp: {
    id: 'elite_fire_imp',
    name: 'Inferno Demon',
    healthRange: [45, 55],
    damage: 9,
    times: 2,
    element: 'fire',
    resistances: ['fire'],
    vulnerabilities: ['ice'],
    innateStatus: 'burning',
    image: '/cards/enemy_fire_imp.webp',
  },
  elite_frost_elemental: {
    id: 'elite_frost_elemental',
    name: 'Frost Colossus',
    healthRange: [55, 65],
    damage: 8,
    element: 'ice',
    resistances: ['ice', 'physical'],
    vulnerabilities: ['fire'],
    innateStatus: 'frozen',
    image: '/cards/enemy_frost_elemental.webp',
  },
  elite_shadow_wraith: {
    id: 'elite_shadow_wraith',
    name: 'Phantom Lord',
    healthRange: [40, 50],
    damage: 5,
    times: 4, // Rapid 4-hit attack
    element: 'void',
    resistances: ['void', 'physical'],
    vulnerabilities: ['fire', 'lightning'],
    image: '/cards/enemy_shadow_wraith.webp',
  },
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createEnemy(
  templateId: string,
  modifiers: ModifierInstance[] = [],
  heatLevel: number = 0
): EnemyEntity {
  // Calculate heat effects for enemy stat scaling
  const heatEffects = calculateHeatEffects(heatLevel)

  // First, check if templateId is an enemy card
  const enemyCard = getEnemyCardById(templateId)
  if (enemyCard?.enemyStats) {
    const { healthRange, baseDamage, energy, element, vulnerabilities, resistances, innateStatus } = enemyCard.enemyStats
    const baseHealth = randomInt(healthRange[0], healthRange[1])

    // Apply modifier effects to stats, then heat effects on top
    const modifierScaled = applyEnemyStatModifiers(baseHealth, baseDamage, modifiers)
    const health = Math.floor(modifierScaled.health * heatEffects.enemyHealthMultiplier)
    const damage = Math.floor(modifierScaled.damage * heatEffects.enemyDamageMultiplier)

    // Build initial powers from heat-based strength bonus
    const powers: EnemyEntity['powers'] = {}
    if (heatEffects.enemyStrengthBonus > 0) {
      powers.strength = { id: 'strength', amount: heatEffects.enemyStrengthBonus }
    }

    return {
      id: generateUid(),
      cardId: enemyCard.id, // Reference to card definition for abilities
      name: enemyCard.name,
      currentHealth: health,
      maxHealth: health,
      block: 0,
      barrier: 0,
      powers,
      intent: { type: 'attack', value: damage },
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

  const baseHealth = randomInt(template.healthRange[0], template.healthRange[1])

  // Apply modifier effects to stats, then heat effects on top
  const modifierScaled = applyEnemyStatModifiers(baseHealth, template.damage, modifiers)
  const health = Math.floor(modifierScaled.health * heatEffects.enemyHealthMultiplier)
  const damage = Math.floor(modifierScaled.damage * heatEffects.enemyDamageMultiplier)

  // Build initial powers from heat-based strength bonus
  const powers: EnemyEntity['powers'] = {}
  if (heatEffects.enemyStrengthBonus > 0) {
    powers.strength = { id: 'strength', amount: heatEffects.enemyStrengthBonus }
  }

  return {
    id: generateUid(),
    name: template.name,
    image: template.image,
    currentHealth: health,
    maxHealth: health,
    block: 0,
    barrier: 0,
    powers,
    intent: { type: 'attack', value: damage, times: template.times },
    patternIndex: 0,
    // Elemental properties
    element: template.element,
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
  dungeonDeckId?: string,
  modifiers: ModifierInstance[] = []
): Promise<RunState> {
  const { def: hero, heroCardId } = resolveHero(heroId)

  // Build deck from custom cards or hero starter deck
  const cardIds = customCardIds ?? hero.starterDeck
  const deck = cardIds.map((cardId) => createCardInstance(cardId))

  // Apply player stat modifications from modifiers
  const statMods = getPlayerStatModifications(modifiers)
  const modifiedHealth = Math.max(1, hero.health + statMods.healthDelta)

  // Create dungeon deck: load from definition if ID provided, otherwise generate random
  // Pass modifiers for room distribution effects
  let dungeonDeck
  if (dungeonDeckId) {
    const definition = await getDungeonDeck(dungeonDeckId)
    if (definition) {
      dungeonDeck = createDungeonDeckFromDefinition(definition)
    } else {
      // Fallback to random if dungeon not found
      dungeonDeck = createDungeonDeck(modifiers)
    }
  } else {
    dungeonDeck = createDungeonDeck(modifiers)
  }
  const { choices, remaining } = drawRoomChoices(dungeonDeck, 3)

  return {
    gamePhase: 'roomSelect',
    floor: 1,
    hero: {
      ...hero,
      currentHealth: modifiedHealth,
      maxHealth: modifiedHealth,
      heroCardId, // Reference to hero card for abilities
      // Store stat deltas for combat initialization
      strengthBonus: statMods.strengthDelta,
      energyBonus: statMods.energyDelta,
      drawBonus: statMods.drawDelta,
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
 * Applies modifier and heat scaling to enemy stats.
 */
export function createEnemiesFromRoom(
  roomId: string,
  enemyCardIds?: string[],
  modifiers: ModifierInstance[] = [],
  heatLevel: number = 0
): EnemyEntity[] {
  // Use override enemies if provided
  if (enemyCardIds && enemyCardIds.length > 0) {
    const resolvedIds = resolveMonsterIds(enemyCardIds)
    return resolvedIds.map((id) => createEnemy(id, modifiers, heatLevel))
  }

  // Fall back to room definition monsters
  const room = getRoomDefinition(roomId)
  if (!room?.monsters) return []

  return room.monsters.map((monsterId) => createEnemy(monsterId, modifiers, heatLevel))
}

export function createTestCombat(): EnemyEntity[] {
  return [createEnemy('slime'), createEnemy('slime')]
}
