import type { CardDefinition, CardInstance } from '../types'

// ============================================
// CARD REGISTRY
// ============================================

const cardRegistry = new Map<string, CardDefinition>()

export function registerCard(card: CardDefinition): void {
  cardRegistry.set(card.id, card)
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

registerCard({
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

registerCard({
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

registerCard({
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
// STARTER HERO
// The default hero given to every player.
// Additional heroes are AI-generated (~2% pack rate).
// ============================================

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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

registerCard({
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
