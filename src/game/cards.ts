import type { CardDefinition, CardInstance } from '../types'
import { logger } from '../lib/logger'

// ============================================
// CARD REGISTRY
// All player cards are AI-generated at runtime.
// Only heroes and enemies are predefined.
// ============================================

const cardRegistry = new Map<string, CardDefinition>()

// Required fields for each card theme
const REQUIRED_FIELDS_BY_THEME: Record<string, (keyof CardDefinition)[]> = {
  attack: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects'],
  skill: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects'],
  power: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects'],
  curse: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects'],
  status: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects'],
  hero: ['id', 'name', 'description', 'theme', 'image', 'heroStats'],
  enemy: ['id', 'name', 'description', 'theme', 'image', 'enemyStats'],
}

/**
 * Validate a card has all required metadata for its theme.
 * Returns list of missing fields, or empty array if valid.
 */
export function validateCard(card: CardDefinition): string[] {
  const requiredFields = REQUIRED_FIELDS_BY_THEME[card.theme] ?? []
  const missing: string[] = []

  for (const field of requiredFields) {
    const value = card[field]
    if (value === undefined || value === null || value === '') {
      missing.push(field)
    }
  }

  return missing
}

/**
 * Check if a card is valid (has all required metadata).
 */
export function isValidCard(card: CardDefinition): boolean {
  return validateCard(card).length === 0
}

/**
 * Register a card. Rejects corrupt cards missing required metadata.
 * Returns true if registered, false if rejected.
 */
export function registerCard(card: CardDefinition): boolean {
  const missing = validateCard(card)
  if (missing.length > 0) {
    logger.warn('CardRegistry', `Rejected corrupt card "${card.id}" (${card.theme}): missing ${missing.join(', ')}`)
    return false
  }
  cardRegistry.set(card.id, card)
  return true
}

/**
 * Force-register a card without validation.
 * Used for AI-generated cards and predefined heroes/enemies.
 */
export function registerCardUnsafe(card: CardDefinition): void {
  cardRegistry.set(card.id, card)
}

/**
 * Purge all invalid cards from the registry.
 * Returns array of purged card IDs.
 */
export function purgeInvalidCards(): string[] {
  const purged: string[] = []
  for (const [id, card] of cardRegistry) {
    if (!isValidCard(card)) {
      cardRegistry.delete(id)
      purged.push(id)
      logger.warn('CardRegistry', `Purged corrupt card: ${id}`)
    }
  }
  return purged
}

export function getCardDefinition(id: string): CardDefinition | undefined {
  return cardRegistry.get(id)
}

export function getAllCards(): CardDefinition[] {
  return Array.from(cardRegistry.values())
}

/**
 * Get the default starter hero ID.
 */
export function getStarterHeroId(): string {
  return 'hero_sakura'
}

/**
 * Get all hero cards from registry.
 */
export function getAllHeroes(): CardDefinition[] {
  return Array.from(cardRegistry.values()).filter((c) => c.theme === 'hero')
}

/**
 * Get all enemy cards from registry.
 */
export function getEnemyCards(): CardDefinition[] {
  return Array.from(cardRegistry.values()).filter((c) => c.theme === 'enemy')
}

/**
 * Get enemy card by ID (returns undefined if not an enemy card).
 */
export function getEnemyCardById(id: string): CardDefinition | undefined {
  const card = cardRegistry.get(id)
  return card?.theme === 'enemy' ? card : undefined
}

/**
 * Get effective card definition, applying upgrades if card is upgraded
 */
export function getEffectiveCardDef(card: CardInstance): CardDefinition | undefined {
  const base = cardRegistry.get(card.definitionId)
  if (!base) return undefined

  if (!card.upgraded || !base.upgradesTo) {
    return base
  }

  return {
    ...base,
    ...base.upgradesTo,
    id: base.id,
    upgraded: true,
  }
}

// ============================================
// STARTER DECK CARDS
// Basic cards for all heroes' starting decks.
// ============================================

registerCardUnsafe({
  id: 'strike',
  name: 'Strike',
  description: 'Deal 6 damage.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [{ type: 'damage', amount: 6 }],
  upgradesTo: {
    name: 'Strike+',
    description: 'Deal 9 damage.',
    effects: [{ type: 'damage', amount: 9 }],
  },
})

registerCardUnsafe({
  id: 'defend',
  name: 'Defend',
  description: 'Gain 5 Block.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  effects: [{ type: 'block', amount: 5 }],
  upgradesTo: {
    name: 'Defend+',
    description: 'Gain 8 Block.',
    effects: [{ type: 'block', amount: 8 }],
  },
})

registerCardUnsafe({
  id: 'bash',
  name: 'Bash',
  description: 'Deal 8 damage. Apply 2 Vulnerable.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [
    { type: 'damage', amount: 8 },
    { type: 'applyPower', powerId: 'vulnerable', amount: 2 },
  ],
  upgradesTo: {
    name: 'Bash+',
    description: 'Deal 10 damage. Apply 3 Vulnerable.',
    effects: [
      { type: 'damage', amount: 10 },
      { type: 'applyPower', powerId: 'vulnerable', amount: 3 },
    ],
  },
})

// ============================================
// STARTER HEROES
// Sensual anime heroines with elemental powers.
// All cards in their decks are AI-generated.
// ============================================

registerCardUnsafe({
  id: 'hero_sakura',
  name: 'Sakura',
  description:
    'A voluptuous fire mage with curves that rival her flames. Her revealing robes barely contain her ample assets as she commands infernal power.',
  energy: 0,
  theme: 'hero',
  target: 'none',
  rarity: 'rare',
  element: 'fire',
  image: '/cards/hero_sakura.webp',
  archetype: 'Fire Mage',
  heroStats: {
    health: 70,
    energy: 3,
    drawPerTurn: 5,
  },
  passive: [
    { type: 'applyPower', powerId: 'burning', amount: 2, target: 'allEnemies' },
  ],
  activated: {
    description: 'Ignite their desires. Deal 10 fire damage. Apply 2 Burning.',
    effects: [
      { type: 'damage', amount: 10, target: 'enemy', element: 'fire' },
      { type: 'applyPower', powerId: 'burning', amount: 2 },
    ],
    energyCost: 2,
  },
  ultimate: {
    description: 'Engulf them in passionate flames. Deal 30 fire damage to ALL. Apply 5 Burning.',
    effects: [
      { type: 'damage', amount: 30, target: 'allEnemies', element: 'fire' },
      { type: 'applyPower', powerId: 'burning', amount: 5, target: 'allEnemies' },
    ],
    chargesRequired: 4,
    chargeOn: 'cardPlayed',
  },
  effects: [],
})

registerCardUnsafe({
  id: 'hero_luna',
  name: 'Luna',
  description:
    'An elegant ice sorceress whose pale skin and generous figure are barely concealed by shimmering frost. Her cold beauty freezes hearts and foes alike.',
  energy: 0,
  theme: 'hero',
  target: 'none',
  rarity: 'rare',
  element: 'ice',
  image: '/cards/hero_luna.webp',
  archetype: 'Ice Sorceress',
  heroStats: {
    health: 75,
    energy: 3,
    drawPerTurn: 5,
  },
  passive: [
    { type: 'block', amount: 8, target: 'self' },
  ],
  activated: {
    description: 'Encase yourself in frigid allure. Gain 12 Block. Apply 1 Frozen.',
    effects: [
      { type: 'block', amount: 12, target: 'self' },
      { type: 'applyPower', powerId: 'frozen', amount: 1 },
    ],
    energyCost: 2,
  },
  ultimate: {
    description: 'Flash freeze with icy perfection. Gain 25 Block. Apply 3 Frozen to ALL.',
    effects: [
      { type: 'block', amount: 25, target: 'self' },
      { type: 'applyPower', powerId: 'frozen', amount: 3, target: 'allEnemies' },
    ],
    chargesRequired: 4,
    chargeOn: 'turnStart',
  },
  effects: [],
})

registerCardUnsafe({
  id: 'hero_aria',
  name: 'Aria',
  description:
    'A lithe storm knight whose tight bodysuit accentuates every curve. Electric energy crackles across her exposed skin as she moves with deadly grace.',
  energy: 0,
  theme: 'hero',
  target: 'none',
  rarity: 'rare',
  element: 'lightning',
  image: '/cards/hero_aria.webp',
  archetype: 'Storm Knight',
  heroStats: {
    health: 65,
    energy: 4,
    drawPerTurn: 6,
  },
  passive: [
    { type: 'draw', amount: 1 },
  ],
  activated: {
    description: 'Strike with electrifying speed. Deal 6 lightning damage twice.',
    effects: [
      { type: 'damage', amount: 6, target: 'enemy', element: 'lightning' },
      { type: 'damage', amount: 6, target: 'enemy', element: 'lightning' },
    ],
    energyCost: 1,
  },
  ultimate: {
    description: 'Unleash a storm of ecstasy. Deal 15 lightning damage to ALL enemies 3 times.',
    effects: [
      { type: 'damage', amount: 15, target: 'allEnemies', element: 'lightning' },
      { type: 'damage', amount: 15, target: 'allEnemies', element: 'lightning' },
      { type: 'damage', amount: 15, target: 'allEnemies', element: 'lightning' },
    ],
    chargesRequired: 5,
    chargeOn: 'cardPlayed',
  },
  effects: [],
})

// Test heroes for hero.test.ts
registerCardUnsafe({
  id: 'hero_pyromancer',
  name: 'Pyromancer',
  description: 'A fire mage for testing AoE mechanics.',
  energy: 0,
  theme: 'hero',
  target: 'none',
  rarity: 'rare',
  element: 'fire',
  image: '/cards/hero_pyromancer.webp',
  archetype: 'Fire Mage',
  heroStats: { health: 70, energy: 3, drawPerTurn: 5 },
  passive: [],
  activated: {
    description: 'Deal 8 fire damage to ALL enemies.',
    effects: [{ type: 'damage', amount: 8, target: 'allEnemies', element: 'fire' }],
    energyCost: 2,
  },
  ultimate: {
    description: 'Deal 25 fire damage to ALL enemies. Apply 5 Burning.',
    effects: [
      { type: 'damage', amount: 25, target: 'allEnemies', element: 'fire' },
      { type: 'applyPower', powerId: 'burning', amount: 5, target: 'allEnemies' },
    ],
    chargesRequired: 4,
    chargeOn: 'cardPlayed',
  },
  effects: [],
})

registerCardUnsafe({
  id: 'hero_ironclad',
  name: 'Ironclad',
  description: 'A stalwart warrior with balanced offense and defense.',
  energy: 0,
  theme: 'hero',
  target: 'none',
  rarity: 'rare',
  element: 'physical',
  image: '/cards/hero_ironclad.webp',
  archetype: 'Warrior',
  heroStats: {
    health: 80,
    energy: 3,
    drawPerTurn: 5,
  },
  passive: [],
  activated: {
    description: 'Gain 5 Block.',
    effects: [{ type: 'block', amount: 5, target: 'self' }],
    energyCost: 1,
  },
  ultimate: {
    description: 'Deal 20 damage to ALL enemies.',
    effects: [{ type: 'damage', amount: 20, target: 'allEnemies' }],
    chargesRequired: 4,
    chargeOn: 'turnStart',
  },
  effects: [],
})

// ============================================
// BOSS ENEMIES
// Seductive monster bosses with ultimates.
// ============================================

registerCardUnsafe({
  id: 'boss_necromancer',
  name: 'Necromancer Temptress',
  description: 'Seductive mistress of death who binds souls with dark desire.',
  theme: 'enemy',
  element: 'void',
  energy: 0,
  target: 'none',
  effects: [],
  image: '/cards/enemy_boss_necromancer.webp',
  enemyStats: {
    healthRange: [80, 100],
    baseDamage: 12,
    energy: 3,
    element: 'void',
    resistances: ['void'],
    vulnerabilities: ['fire', 'physical'],
  },
  enemyUltimate: {
    id: 'dark_ritual',
    name: 'Dark Ritual',
    description: 'At 50% HP: Gains massive power and weakens the player.',
    trigger: 'lowHealth',
    triggerValue: 50,
    effects: [
      { type: 'applyPower', powerId: 'strength', amount: 5, target: 'self' },
      { type: 'applyPower', powerId: 'ritualist', amount: 3, target: 'self' },
      { type: 'applyPower', powerId: 'vulnerable', amount: 3, target: 'player' },
      { type: 'applyPower', powerId: 'weak', amount: 2, target: 'player' },
    ],
  },
})

registerCardUnsafe({
  id: 'boss_heart',
  name: 'Heart of Chaos',
  description: 'The corrupted heart grows stronger each turn.',
  theme: 'enemy',
  element: 'void',
  energy: 0,
  target: 'none',
  effects: [],
  image: '/cards/enemy_boss_heart.webp',
  enemyStats: {
    healthRange: [120, 150],
    baseDamage: 8,
    energy: 4,
    element: 'void',
  },
  enemyAbility: {
    id: 'chaos_pulse',
    name: 'Chaos Pulse',
    description: 'Gains 2 Strength. Deals damage to player.',
    energyCost: 0,
    effects: [
      { type: 'applyPower', powerId: 'strength', amount: 2, target: 'self' },
      { type: 'damage', amount: 5, target: 'player' },
    ],
  },
  enemyUltimate: {
    id: 'corruption_wave',
    name: 'Corruption Wave',
    description: 'At 30% HP: Massive damage and applies curses.',
    trigger: 'lowHealth',
    triggerValue: 30,
    effects: [
      { type: 'damage', amount: 25, target: 'player' },
      { type: 'applyPower', powerId: 'vulnerable', amount: 5, target: 'player' },
      { type: 'applyPower', powerId: 'frail', amount: 5, target: 'player' },
    ],
  },
})
