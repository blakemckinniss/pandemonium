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
  name: 'Passionate Strike',
  description: 'Lash out with fervent intensity. Deal 6 damage.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'physical',
  effects: [{ type: 'damage', amount: 6 }],
  upgradesTo: {
    name: 'Passionate Strike+',
    description: 'An even fiercer blow. Deal 9 damage.',
    effects: [{ type: 'damage', amount: 9 }],
  },
})

registerCardUnsafe({
  id: 'defend',
  name: 'Alluring Guard',
  description: 'Deflect with graceful poise. Gain 5 Block.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  element: 'physical',
  effects: [{ type: 'block', amount: 5 }],
  upgradesTo: {
    name: 'Alluring Guard+',
    description: 'An impenetrable stance. Gain 8 Block.',
    effects: [{ type: 'block', amount: 8 }],
  },
})

registerCardUnsafe({
  id: 'bash',
  name: 'Ravishing Blow',
  description: 'A stunning strike that leaves them breathless. Deal 8 damage. Apply 2 Vulnerable.',
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
    name: 'Ravishing Blow+',
    description: 'Impossible to resist. Deal 10 damage. Apply 3 Vulnerable.',
    effects: [
      { type: 'damage', amount: 10 },
      { type: 'applyPower', powerId: 'vulnerable', amount: 3 },
    ],
  },
})

// ============================================
// STARTER HEROES
// Three anime heroines with distinct elemental identities.
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
    // Start combat with 2 Burning on all enemies
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
    // Start combat with 8 Block
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
    // Start combat with 1 extra energy and draw
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

// Test heroes used by hero.test.ts - simple abilities for predictable testing
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
// BASIC CARDS
// Common cards for testing and early gameplay.
// Most cards are AI-generated, but these provide
// a baseline for game mechanics.
// ============================================

// --- POWER CARDS ---

registerCardUnsafe({
  id: 'inflame',
  name: 'Burning Desire',
  description: 'Stoke the flames of passion within. Gain 2 Strength.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'fire',
  effects: [{ type: 'applyPower', powerId: 'strength', amount: 2, target: 'self' }],
})

registerCardUnsafe({
  id: 'demon_form',
  name: 'Succubus Form',
  description: 'Embrace your inner demon. At the start of each turn, gain 2 Strength.',
  energy: 3,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'fire',
  effects: [{ type: 'applyPower', powerId: 'demonForm', amount: 2, target: 'self' }],
})

registerCardUnsafe({
  id: 'metallicize',
  name: 'Armored Allure',
  description: 'Clad yourself in irresistible protection. At the end of your turn, gain 3 Block.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'physical',
  effects: [{ type: 'applyPower', powerId: 'metallicize', amount: 3, target: 'self' }],
})

registerCardUnsafe({
  id: 'noxious_fumes',
  name: 'Intoxicating Mist',
  description: 'Release an irresistible aroma. At the start of your turn, apply 2 Poison to ALL.',
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
  name: "Lover's Blow",
  description: 'A teasing strike that leaves them wanting more. Deal 9 damage. Draw 1 card.',
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
  name: 'Sweeping Caress',
  description: 'Touch them all at once. Deal 8 damage to ALL enemies.',
  energy: 1,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'common',
  element: 'physical',
  effects: [{ type: 'damage', amount: 8, target: 'allEnemies' }],
})

registerCardUnsafe({
  id: 'twin_strike',
  name: 'Double Tease',
  description: 'Two quick strikes that leave them flustered. Deal 5 damage twice.',
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
  name: 'Crushing Embrace',
  description: 'Overwhelm them with your full force. Deal 14 damage.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'physical',
  effects: [{ type: 'damage', amount: 14 }],
})

registerCardUnsafe({
  id: 'fireball',
  name: 'Blazing Passion',
  description: 'Unleash smoldering desire. Deal 12 damage. Apply 3 Burning.',
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
  name: 'Icy Kiss',
  description: 'A chilling touch that numbs the senses. Deal 8 damage. Apply 2 Frozen.',
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
  name: 'Electric Touch',
  description: 'Send shivers through their body. Deal 7 damage 3 times.',
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
  name: 'Dark Seduction',
  description: 'Drain their will to resist. Deal 10 damage. Apply 3 Weak.',
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
  name: 'Playful Dodge',
  description: 'Dance away with a teasing smile. Gain 8 Block. Draw 1 card.',
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
  name: 'Battle Lingerie',
  description: 'Enhance your outfit for combat. Gain 5 Block. Upgrade a card in your hand.',
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
  name: 'Steely Resolve',
  description: 'Harden your heart. Gain 7 Block. Exhaust a card in your hand.',
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
  name: 'Frigid Refusal',
  description: 'Become untouchable. Gain 12 Block. Apply 1 Frozen to yourself.',
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
  name: 'Breathless Recovery',
  description: 'Catch your breath after exertion. Gain 12 Block. Exhaust a card.',
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
  name: 'Crimson Sacrifice',
  description: 'Offer your essence for power. Lose 3 HP. Gain 2 Energy.',
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
  name: 'Hypnotic Focus',
  description: 'Enter a mesmerizing state. Draw 3 cards. Cannot draw more this turn.',
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
  name: 'Passionate Resurrection',
  description: 'Rise from the flames of desire. Deal 15 damage. Apply 5 Burning. Heal 8 HP.',
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
  name: 'Frigid Dominion',
  description: 'Become an untouchable ice queen. Gain 25 Block. Apply 3 Frozen to ALL enemies.',
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
  name: 'Tempest Goddess',
  description: 'Awaken divine fury within. Gain 3 Strength. Deal 24 damage to ALL enemies.',
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
  name: 'Abyssal Surrender',
  description: 'Let the darkness take you. Draw 5 cards. Apply 5 Vulnerable to an enemy.',
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
  name: 'Eternal Flame of Desire',
  description: 'Unleash the primal fire within your soul. Deal 50 damage. Apply 10 Burning.',
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
  name: "Oblivion's Kiss",
  description: 'The final embrace of the void consumes all. Deal 99 damage to an enemy.',
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

// ============================================
// SEDUCTIVE CARDS
// Charm/seduce themed cards using erotic powers
// ============================================

registerCardUnsafe({
  id: 'sultry_gaze',
  name: 'Sultry Gaze',
  description: 'Your eyes bewitch them. Apply 2 Charmed.',
  energy: 1,
  theme: 'skill',
  target: 'enemy',
  rarity: 'common',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'charmed', amount: 2 }],
})

registerCardUnsafe({
  id: 'seductive_whisper',
  name: 'Seductive Whisper',
  description: 'Whisper sweet nothings. Apply 2 Flustered. Draw 1 card.',
  energy: 1,
  theme: 'skill',
  target: 'enemy',
  rarity: 'common',
  element: 'void',
  effects: [
    { type: 'applyPower', powerId: 'flustered', amount: 2 },
    { type: 'draw', amount: 1 },
  ],
})

registerCardUnsafe({
  id: 'bedroom_eyes',
  name: 'Bedroom Eyes',
  description: 'They cannot resist. Apply 3 Enthralled.',
  energy: 2,
  theme: 'skill',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'enthralled', amount: 3 }],
})

registerCardUnsafe({
  id: 'heartbreaker_strike',
  name: 'Heartbreaker',
  description: 'Break their heart. Deal 8 damage. Apply 1 Lovestruck.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'void',
  effects: [
    { type: 'damage', amount: 8 },
    { type: 'applyPower', powerId: 'lovestruck', amount: 1 },
  ],
})

registerCardUnsafe({
  id: 'captivating_dance',
  name: 'Captivating Dance',
  description: 'Your sensual movements mesmerize. Apply 1 Seduced to ALL enemies.',
  energy: 2,
  theme: 'skill',
  target: 'allEnemies',
  rarity: 'rare',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'seduced', amount: 1 }],
})

registerCardUnsafe({
  id: 'femme_fatale',
  name: 'Femme Fatale',
  description: 'Deadly allure. Gain 2 Allure. Gain 2 Seductress.',
  energy: 2,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'void',
  effects: [
    { type: 'applyPower', powerId: 'allure', amount: 2, target: 'self' },
    { type: 'applyPower', powerId: 'seductress', amount: 2, target: 'self' },
  ],
})

registerCardUnsafe({
  id: 'irresistible_charm',
  name: 'Irresistible Charm',
  description: 'None can resist your beauty. Gain Irresistible. Charm cards cost 1 less.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'irresistible', amount: 1, target: 'self' }],
})

registerCardUnsafe({
  id: 'aura_of_temptation',
  name: 'Aura of Temptation',
  description: 'Your presence intoxicates. Gain 1 Temptation. Each turn, charm a random enemy.',
  energy: 2,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'temptation', amount: 1, target: 'self' }],
})

registerCardUnsafe({
  id: 'dominating_presence',
  name: 'Dominating Presence',
  description: 'Assert your dominance. Gain 2 Domination. Charmed enemies take bonus damage.',
  energy: 2,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'domination', amount: 2, target: 'self' }],
})

registerCardUnsafe({
  id: 'passionate_kiss',
  name: 'Passionate Kiss',
  description: 'Steal their breath away. Deal 6 damage. Heal 4 HP.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'void',
  effects: [
    { type: 'damage', amount: 6 },
    { type: 'heal', amount: 4, target: 'self' },
  ],
})

registerCardUnsafe({
  id: 'love_drunk',
  name: 'Love Drunk',
  description: 'They stumble in a daze. Deal 12 damage to Charmed enemies. Otherwise, apply 2 Charmed.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'void',
  effects: [
    {
      type: 'conditional',
      condition: { type: 'hasPower', powerId: 'charmed', target: 'enemy' },
      then: [{ type: 'damage', amount: 12 }],
      else: [{ type: 'applyPower', powerId: 'charmed', amount: 2 }],
    },
  ],
})

registerCardUnsafe({
  id: 'succubus_embrace',
  name: 'Succubus Embrace',
  description: 'Drain their very essence. Deal 15 damage. Heal equal to damage dealt.',
  energy: 3,
  theme: 'attack',
  target: 'enemy',
  rarity: 'legendary',
  element: 'void',
  effects: [
    { type: 'damage', amount: 15 },
    { type: 'heal', amount: 15, target: 'self' },
  ],
})
