import type { CardDefinition, CardInstance } from '../types'
import { logger } from '../lib/logger'

// ============================================
// CARD REGISTRY
// ============================================

const cardRegistry = new Map<string, CardDefinition>()

// Required fields for each card theme
const REQUIRED_FIELDS_BY_THEME: Record<string, (keyof CardDefinition)[]> = {
  attack: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects', 'image', 'element'],
  skill: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects', 'image', 'element'],
  power: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects', 'image', 'element'],
  curse: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects', 'element'],
  status: ['id', 'name', 'description', 'energy', 'theme', 'target', 'effects', 'element'],
  hero: ['id', 'name', 'description', 'theme', 'image', 'heroStats', 'element'],
  enemy: ['id', 'name', 'description', 'theme', 'image', 'enemyStats', 'element'],
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
 * Force-register a card without validation (use sparingly).
 * For AI-generated cards still awaiting image generation.
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
 * Get starter card IDs for initializing player collection.
 */
export function getStarterCardIds(): string[] {
  return ['strike', 'defend', 'bash']
}

/**
 * Get the default starter hero ID.
 */
export function getStarterHeroId(): string {
  return 'hero_ironclad'
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
 * Use this when displaying cards or resolving effects
 */
export function getEffectiveCardDef(card: CardInstance): CardDefinition | undefined {
  const base = cardRegistry.get(card.definitionId)
  if (!base) return undefined

  if (!card.upgraded || !base.upgradesTo) {
    return base
  }

  // Merge upgraded properties over base
  return {
    ...base,
    ...base.upgradesTo,
    // Preserve id from base
    id: base.id,
    // Mark as upgraded
    upgraded: true,
  }
}

// ============================================
// STARTER CARDS
// These are the free cards given to every player.
// All other cards are generated via AI and stored
// in the player's collection (IndexedDB).
// ============================================

// Built-in cards use registerCardUnsafe - they're developer-curated, not AI-generated
// The validated registerCard() is for AI-generated cards that must have images
registerCardUnsafe({
  id: 'strike',
  name: 'Strike',
  description: 'Deal 6 damage.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'physical',
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
  element: 'physical',
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
  element: 'physical',
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
// STARTER HERO
// The default hero given to every player.
// Additional heroes are AI-generated (~2% pack rate).
// ============================================

registerCardUnsafe({
  id: 'hero_ironclad',
  name: 'Ironclad',
  description: 'A battle-hardened warrior who draws strength from combat.',
  energy: 0, // Heroes don't cost energy to "play" - they're your character
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
  passive: [
    // Start combat with 1 Strength
    { type: 'applyPower', powerId: 'strength', amount: 1, target: 'self' },
  ],
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
  effects: [], // Heroes don't have normal card effects
})

registerCardUnsafe({
  id: 'hero_pyromancer',
  name: 'Pyromancer',
  description: 'A master of flames who burns enemies over time.',
  energy: 0,
  theme: 'hero',
  target: 'none',
  rarity: 'rare',
  element: 'fire',
  image: '/cards/hero_pyromancer.webp',
  archetype: 'Mage',
  heroStats: {
    health: 70,
    energy: 3,
    drawPerTurn: 5,
  },
  passive: [
    // Apply 2 burning to all enemies at combat start
    { type: 'applyPower', powerId: 'burning', amount: 2, target: 'allEnemies' },
  ],
  activated: {
    description: 'Deal 8 fire damage to all enemies.',
    effects: [{ type: 'damage', amount: 8, target: 'allEnemies', element: 'fire' }],
    energyCost: 2,
  },
  ultimate: {
    description: 'Deal 25 damage and apply 5 burning to ALL enemies.',
    effects: [
      { type: 'damage', amount: 25, target: 'allEnemies', element: 'fire' },
      { type: 'applyPower', powerId: 'burning', amount: 5, target: 'allEnemies' },
    ],
    chargesRequired: 4,
    chargeOn: 'cardPlayed',
  },
  effects: [],
})

// ============================================
// BASIC CARDS
// Common cards for testing and early gameplay.
// Most cards are AI-generated, but these provide
// a baseline for game mechanics.
// ============================================

// --- POWER CARDS ---

registerCardUnsafe({
  id: 'inflame',
  name: 'Inflame',
  description: 'Gain 2 Strength.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'fire',
  effects: [{ type: 'applyPower', powerId: 'strength', amount: 2, target: 'self' }],
})

registerCardUnsafe({
  id: 'demon_form',
  name: 'Demon Form',
  description: 'At the start of each turn, gain 2 Strength.',
  energy: 3,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'fire',
  effects: [{ type: 'applyPower', powerId: 'demonForm', amount: 2, target: 'self' }],
})

registerCardUnsafe({
  id: 'metallicize',
  name: 'Metallicize',
  description: 'At the end of your turn, gain 3 Block.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'physical',
  effects: [{ type: 'applyPower', powerId: 'metallicize', amount: 3, target: 'self' }],
})

registerCardUnsafe({
  id: 'noxious_fumes',
  name: 'Noxious Fumes',
  description: 'At the start of your turn, apply 2 Poison to ALL enemies.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'noxiousFumes', amount: 2, target: 'self' }],
})

// --- ATTACK CARDS ---

registerCardUnsafe({
  id: 'pommel_strike',
  name: 'Pommel Strike',
  description: 'Deal 9 damage. Draw 1 card.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'physical',
  effects: [
    { type: 'damage', amount: 9 },
    { type: 'draw', amount: 1 },
  ],
})

registerCardUnsafe({
  id: 'cleave',
  name: 'Cleave',
  description: 'Deal 8 damage to ALL enemies.',
  energy: 1,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'common',
  element: 'physical',
  effects: [{ type: 'damage', amount: 8, target: 'allEnemies' }],
})

registerCardUnsafe({
  id: 'twin_strike',
  name: 'Twin Strike',
  description: 'Deal 5 damage twice.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'physical',
  effects: [
    { type: 'damage', amount: 5 },
    { type: 'damage', amount: 5 },
  ],
})

registerCardUnsafe({
  id: 'heavy_blade',
  name: 'Heavy Blade',
  description: 'Deal 14 damage.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'physical',
  effects: [{ type: 'damage', amount: 14 }],
})

registerCardUnsafe({
  id: 'fireball',
  name: 'Fireball',
  description: 'Deal 12 damage. Apply 3 Burning.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'fire',
  effects: [
    { type: 'damage', amount: 12, element: 'fire' },
    { type: 'applyPower', powerId: 'burning', amount: 3 },
  ],
})

registerCardUnsafe({
  id: 'frost_bolt',
  name: 'Frost Bolt',
  description: 'Deal 8 damage. Apply 2 Frozen.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'ice',
  effects: [
    { type: 'damage', amount: 8, element: 'ice' },
    { type: 'applyPower', powerId: 'frozen', amount: 2 },
  ],
})

registerCardUnsafe({
  id: 'lightning_strike',
  name: 'Lightning Strike',
  description: 'Deal 7 damage to a random enemy 3 times.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'lightning',
  effects: [
    { type: 'damage', amount: 7, element: 'lightning' },
    { type: 'damage', amount: 7, element: 'lightning' },
    { type: 'damage', amount: 7, element: 'lightning' },
  ],
})

registerCardUnsafe({
  id: 'void_rend',
  name: 'Void Rend',
  description: 'Deal 10 damage. Apply 3 Weak.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'void',
  effects: [
    { type: 'damage', amount: 10, element: 'void' },
    { type: 'applyPower', powerId: 'weak', amount: 3 },
  ],
})

// --- SKILL CARDS ---

registerCardUnsafe({
  id: 'shrug_it_off',
  name: 'Shrug It Off',
  description: 'Gain 8 Block. Draw 1 card.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  element: 'physical',
  effects: [
    { type: 'block', amount: 8, target: 'self' },
    { type: 'draw', amount: 1 },
  ],
})

registerCardUnsafe({
  id: 'armaments',
  name: 'Armaments',
  description: 'Gain 5 Block. Upgrade a card in your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  element: 'physical',
  effects: [
    { type: 'block', amount: 5, target: 'self' },
    { type: 'upgrade', target: { from: 'hand', count: 1 } },
  ],
})

registerCardUnsafe({
  id: 'true_grit',
  name: 'True Grit',
  description: 'Gain 7 Block. Exhaust a card in your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  element: 'physical',
  effects: [
    { type: 'block', amount: 7, target: 'self' },
    { type: 'exhaust', target: { from: 'hand', count: 1 } },
  ],
})

registerCardUnsafe({
  id: 'ice_barrier',
  name: 'Ice Barrier',
  description: 'Gain 12 Block. Apply 1 Frozen to yourself.',
  energy: 2,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  element: 'ice',
  effects: [
    { type: 'block', amount: 12, target: 'self' },
    { type: 'applyPower', powerId: 'frozen', amount: 1, target: 'self' },
  ],
})

registerCardUnsafe({
  id: 'second_wind',
  name: 'Second Wind',
  description: 'Gain 12 Block. Exhaust a card in your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  element: 'physical',
  effects: [
    { type: 'block', amount: 12, target: 'self' },
    { type: 'exhaust', target: { from: 'hand', count: 1 } },
  ],
})

registerCardUnsafe({
  id: 'bloodletting',
  name: 'Bloodletting',
  description: 'Lose 3 HP. Gain 2 Energy.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  element: 'void',
  effects: [
    { type: 'damage', amount: 3, target: 'self', piercing: true },
    { type: 'energy', amount: 2, operation: 'gain' },
  ],
})

registerCardUnsafe({
  id: 'battle_trance',
  name: 'Battle Trance',
  description: 'Draw 3 cards. You cannot draw additional cards this turn.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  element: 'physical',
  effects: [
    { type: 'draw', amount: 3 },
    { type: 'applyPower', powerId: 'noDraw', amount: 1, target: 'self' },
  ],
})

// ============================================
// PREMIUM RARITY SHOWCASE CARDS
// Legendary, Mythic, and Ancient tier cards
// featuring enhanced WebGL holographic effects
// ============================================

registerCardUnsafe({
  id: 'phoenix_rebirth',
  name: 'Phoenix Rebirth',
  description: 'Deal 15 damage. Apply 5 Burning. Heal 8 HP.',
  energy: 3,
  theme: 'attack',
  target: 'enemy',
  rarity: 'legendary',
  element: 'fire',
  effects: [
    { type: 'damage', amount: 15 },
    { type: 'applyPower', powerId: 'burning', amount: 5 },
    { type: 'heal', amount: 8, target: 'self' },
  ],
})

registerCardUnsafe({
  id: 'glacial_fortress',
  name: 'Glacial Fortress',
  description: 'Gain 25 Block. Apply 3 Frozen to ALL enemies.',
  energy: 3,
  theme: 'skill',
  target: 'self',
  rarity: 'legendary',
  element: 'ice',
  effects: [
    { type: 'block', amount: 25, target: 'self' },
    { type: 'applyPower', powerId: 'frozen', amount: 3, target: 'allEnemies' },
  ],
})

registerCardUnsafe({
  id: 'storm_avatar',
  name: 'Storm Avatar',
  description: 'Gain 3 Strength. Deal 24 damage to ALL enemies.',
  energy: 4,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'mythic',
  element: 'lightning',
  effects: [
    { type: 'applyPower', powerId: 'strength', amount: 3, target: 'self' },
    { type: 'damage', amount: 24 },
  ],
})

registerCardUnsafe({
  id: 'void_embrace',
  name: 'Void Embrace',
  description: 'Draw 5 cards. Apply 5 Vulnerable to an enemy.',
  energy: 2,
  theme: 'skill',
  target: 'enemy',
  rarity: 'mythic',
  element: 'void',
  effects: [
    { type: 'draw', amount: 5 },
    { type: 'applyPower', powerId: 'vulnerable', amount: 5 },
  ],
})

registerCardUnsafe({
  id: 'primordial_inferno',
  name: 'Primordial Inferno',
  description: 'Deal 50 damage. Apply 10 Burning.',
  energy: 5,
  theme: 'attack',
  target: 'enemy',
  rarity: 'ancient',
  element: 'fire',
  effects: [
    { type: 'damage', amount: 50 },
    { type: 'applyPower', powerId: 'burning', amount: 10 },
  ],
})

registerCardUnsafe({
  id: 'cosmic_singularity',
  name: 'Cosmic Singularity',
  description: 'Deal 99 damage to an enemy.',
  energy: 6,
  theme: 'attack',
  target: 'enemy',
  rarity: 'ancient',
  element: 'void',
  effects: [{ type: 'damage', amount: 99 }],
})

// ============================================
// BOSS ENEMY CARDS
// Special enemy cards with ultimates that trigger at low health
// ============================================

registerCardUnsafe({
  id: 'boss_necromancer',
  name: 'Shadow Lord',
  description: 'Master of death and darkness.',
  theme: 'enemy',
  element: 'void',
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
