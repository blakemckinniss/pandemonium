// LARGE_FILE_OK: Card registry - data definitions, not logic
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
// ============================================

registerCard({
  id: 'strike',
  name: 'Strike',
  description: 'Deal 6 damage.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'starter',
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
  rarity: 'starter',
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
  rarity: 'starter',
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
// COMMON ATTACKS
// ============================================

registerCard({
  id: 'cleave',
  name: 'Cleave',
  description: 'Deal 8 damage to ALL enemies.',
  energy: 1,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'common',
  effects: [{ type: 'damage', amount: 8, target: 'allEnemies' }],
})

registerCard({
  id: 'pommel_strike',
  name: 'Pommel Strike',
  description: 'Deal 5 damage. Draw 1 card.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [
    { type: 'damage', amount: 5 },
    { type: 'draw', amount: 1 },
  ],
})

registerCard({
  id: 'twin_strike',
  name: 'Twin Strike',
  description: 'Deal 5 damage twice.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [
    { type: 'repeat', times: 2, effects: [{ type: 'damage', amount: 5 }] },
  ],
})

registerCard({
  id: 'anger',
  name: 'Anger',
  description: 'Deal 6 damage. Add a copy of this card to your discard pile.',
  energy: 0,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [
    { type: 'damage', amount: 6 },
    { type: 'addCard', cardId: 'anger', destination: 'discardPile' },
  ],
})

registerCard({
  id: 'heavy_blade',
  name: 'Heavy Blade',
  description: 'Deal 14 damage. Strength affects this card 3 times.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  tags: ['strength-scaling'],
  effects: [
    // Note: Strength scaling multiplier would need special handling
    { type: 'damage', amount: 14 },
  ],
})

// ============================================
// COMMON SKILLS
// ============================================

registerCard({
  id: 'shrug_it_off',
  name: 'Shrug It Off',
  description: 'Gain 8 Block. Draw 1 card.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  effects: [
    { type: 'block', amount: 8 },
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
  effects: [
    { type: 'block', amount: 5 },
    { type: 'upgrade', target: 'randomHand' },
  ],
})

registerCard({
  id: 'true_grit',
  name: 'True Grit',
  description: 'Gain 7 Block. Exhaust a random card from your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  effects: [
    { type: 'block', amount: 7 },
    { type: 'exhaust', target: 'randomHand', amount: 1 },
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
  effects: [
    { type: 'draw', amount: 3 },
    // No-draw debuff would need special power
  ],
})

// ============================================
// UNCOMMON ATTACKS
// ============================================

registerCard({
  id: 'carnage',
  name: 'Carnage',
  description: 'Ethereal. Deal 20 damage.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  tags: ['ethereal'],
  effects: [{ type: 'damage', amount: 20 }],
})

registerCard({
  id: 'uppercut',
  name: 'Uppercut',
  description: 'Deal 13 damage. Apply 1 Weak. Apply 1 Vulnerable.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  effects: [
    { type: 'damage', amount: 13 },
    { type: 'applyPower', powerId: 'weak', amount: 1 },
    { type: 'applyPower', powerId: 'vulnerable', amount: 1 },
  ],
})

registerCard({
  id: 'dropkick',
  name: 'Dropkick',
  description: 'Deal 5 damage. If the enemy is Vulnerable, gain 1 energy and draw 1 card.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  effects: [
    { type: 'damage', amount: 5 },
    {
      type: 'conditional',
      condition: { type: 'hasPower', target: 'enemy', powerId: 'vulnerable' },
      then: [
        { type: 'energy', amount: 1, operation: 'gain' },
        { type: 'draw', amount: 1 },
      ],
    },
  ],
})

registerCard({
  id: 'bloodletting',
  name: 'Bloodletting',
  description: 'Lose 3 HP. Gain 2 energy.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'damage', amount: 3, target: 'self', piercing: true },
    { type: 'energy', amount: 2, operation: 'gain' },
  ],
})

// ============================================
// CONDITIONAL / COMPLEX CARDS
// ============================================

registerCard({
  id: 'desperate_strike',
  name: 'Desperate Strike',
  description: 'Deal 8 damage. If HP < 50%, deal 15 instead.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  effects: [
    {
      type: 'conditional',
      condition: {
        type: 'health',
        target: 'self',
        compare: 'percent',
        op: '<',
        value: 50,
      },
      then: [{ type: 'damage', amount: 15 }],
      else: [{ type: 'damage', amount: 8 }],
    },
  ],
})

registerCard({
  id: 'execution',
  name: 'Execution',
  description: 'Deal 8 damage. +8 if enemy HP < 25%. +8 if Vulnerable.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'rare',
  tags: ['finisher'],
  effects: [
    { type: 'damage', amount: 8 },
    {
      type: 'conditional',
      condition: {
        type: 'health',
        target: 'enemy',
        compare: 'percent',
        op: '<',
        value: 25,
      },
      then: [{ type: 'damage', amount: 8 }],
    },
    {
      type: 'conditional',
      condition: { type: 'hasPower', target: 'enemy', powerId: 'vulnerable' },
      then: [{ type: 'damage', amount: 8 }],
    },
  ],
})

registerCard({
  id: 'searing_blow',
  name: 'Searing Blow',
  description: 'Deal 12 damage. Can be upgraded any number of times.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  tags: ['multi-upgrade'],
  effects: [{ type: 'damage', amount: 12 }],
})

// ============================================
// SCALING / X-COST CARDS
// ============================================

registerCard({
  id: 'whirlwind',
  name: 'Whirlwind',
  description: 'Deal 5 damage to ALL enemies X times.',
  energy: { type: 'scaled', base: 0, perUnit: 1, source: 'energy' },
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'uncommon',
  tags: ['x-cost'],
  effects: [
    {
      type: 'repeat',
      times: { type: 'scaled', base: 0, perUnit: 1, source: 'energy' },
      effects: [{ type: 'damage', amount: 5, target: 'allEnemies' }],
    },
    { type: 'energy', amount: 0, operation: 'set' },
  ],
})

registerCard({
  id: 'pummel',
  name: 'Pummel',
  description: 'Deal 2 damage 4 times.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [
    { type: 'repeat', times: 4, effects: [{ type: 'damage', amount: 2 }] },
  ],
})

registerCard({
  id: 'finesse',
  name: 'Finesse',
  description: 'Gain 2 Block. Draw 1 card.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'block', amount: 2 },
    { type: 'draw', amount: 1 },
  ],
})

// ============================================
// POWER CARDS
// ============================================

registerCard({
  id: 'inflame',
  name: 'Inflame',
  description: 'Gain 2 Strength.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  effects: [{ type: 'applyPower', powerId: 'strength', amount: 2, target: 'self' }],
})

registerCard({
  id: 'demon_form',
  name: 'Demon Form',
  description: 'At the start of your turn, gain 2 Strength.',
  energy: 3,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  effects: [{ type: 'applyPower', powerId: 'ritual', amount: 2, target: 'self' }],
})

registerCard({
  id: 'metallicize',
  name: 'Metallicize',
  description: 'At the end of your turn, gain 3 Block.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'applyPower', powerId: 'metallicize', amount: 3, target: 'self' },
  ],
})

registerCard({
  id: 'combust',
  name: 'Combust',
  description: 'At the end of your turn, lose 1 HP and deal 5 damage to ALL enemies.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    // Would need a custom power for this
    { type: 'applyPower', powerId: 'combust', amount: 5, target: 'self' },
  ],
})

// ============================================
// RANDOM / CHAOS CARDS
// ============================================

registerCard({
  id: 'reckless_charge',
  name: 'Reckless Charge',
  description: 'Deal 7 damage. Shuffle a Dazed into your draw pile.',
  energy: 0,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [
    { type: 'damage', amount: 7 },
    { type: 'addCard', cardId: 'dazed', destination: 'drawPile', position: 'random' },
  ],
})

registerCard({
  id: 'wild_strike',
  name: 'Wild Strike',
  description: 'Deal 12 damage. Shuffle a Wound into your draw pile.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  effects: [
    { type: 'damage', amount: 12 },
    { type: 'addCard', cardId: 'wound', destination: 'drawPile', position: 'random' },
  ],
})

// ============================================
// STATUS / CURSE CARDS
// ============================================

registerCard({
  id: 'wound',
  name: 'Wound',
  description: 'Unplayable.',
  energy: 99,
  theme: 'status',
  target: 'self',
  effects: [],
})

registerCard({
  id: 'dazed',
  name: 'Dazed',
  description: 'Unplayable. Ethereal.',
  energy: 99,
  theme: 'status',
  target: 'self',
  tags: ['ethereal'],
  effects: [],
})

registerCard({
  id: 'slimed',
  name: 'Slimed',
  description: 'Exhaust.',
  energy: 1,
  theme: 'status',
  target: 'self',
  effects: [{ type: 'exhaust', target: 'thisCard' }],
})

// ============================================
// FOREACH / SCALING CARDS
// ============================================

registerCard({
  id: 'perfected_strike',
  name: 'Perfected Strike',
  description: 'Deal 6 damage. Deals +2 damage for each card in your hand.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  tags: ['strike'],
  effects: [
    {
      type: 'damage',
      amount: { type: 'scaled', base: 6, perUnit: 2, source: 'cardsInHand' },
    },
  ],
})

registerCard({
  id: 'sword_boomerang',
  name: 'Sword Boomerang',
  description: 'Deal 3 damage to a random enemy 3 times.',
  energy: 1,
  theme: 'attack',
  target: 'randomEnemy',
  rarity: 'common',
  effects: [
    {
      type: 'repeat',
      times: 3,
      effects: [{ type: 'damage', amount: 3, target: 'randomEnemy' }],
    },
  ],
})

// ============================================
// LIFESTEAL CARDS
// ============================================

registerCard({
  id: 'reaper',
  name: 'Reaper',
  description: 'Deal 4 damage to ALL enemies. Heal HP equal to unblocked damage.',
  energy: 2,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'rare',
  effects: [
    {
      type: 'forEach',
      target: 'allEnemies',
      effects: [
        { type: 'lifesteal', amount: 4, target: 'enemy', ratio: 1 },
      ],
    },
  ],
})

registerCard({
  id: 'feed',
  name: 'Feed',
  description: 'Deal 10 damage. If fatal, raise Max HP by 3.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'rare',
  tags: ['finisher'],
  effects: [
    { type: 'damage', amount: 10 },
    // Max HP increase on kill would need special handling
  ],
})

// ============================================
// SCRY / TUTOR CARDS
// ============================================

registerCard({
  id: 'foresight',
  name: 'Foresight',
  description: 'Scry 3. Draw 1 card.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'scry', amount: 3 },
    { type: 'draw', amount: 1 },
  ],
})

registerCard({
  id: 'third_eye',
  name: 'Third Eye',
  description: 'Scry 5.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  effects: [{ type: 'scry', amount: 5 }],
})

registerCard({
  id: 'battle_trance',
  name: 'Battle Trance',
  description: 'Search your draw pile for an Attack and add it to your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'tutor', from: 'drawPile', filter: { theme: 'attack' }, destination: 'hand' },
  ],
})

registerCard({
  id: 'seek',
  name: 'Seek',
  description: 'Search your draw pile and add a card to your hand. Shuffle.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'tutor', from: 'drawPile', destination: 'hand', shuffle: true },
    { type: 'exhaust', target: 'thisCard' },
  ],
})

registerCard({
  id: 'recycle',
  name: 'Recycle',
  description: 'Return a card from your discard pile to your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'tutor', from: 'discardPile', destination: 'hand' },
  ],
})

registerCard({
  id: 'armaments',
  name: 'Armaments',
  description: 'Gain 5 Block. Upgrade a random card in your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  effects: [
    { type: 'block', amount: 5 },
    { type: 'upgrade', target: 'randomHand' },
  ],
  upgradesTo: {
    name: 'Armaments+',
    description: 'Gain 5 Block. Upgrade ALL cards in your hand.',
    effects: [
      { type: 'block', amount: 5 },
      { type: 'upgrade', target: 'hand' },
    ],
  },
})

registerCard({
  id: 'apotheosis',
  name: 'Apotheosis',
  description: 'Upgrade ALL cards in your deck for the rest of combat. Exhaust.',
  energy: 2,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'upgrade', target: 'hand' },
    { type: 'upgrade', target: 'drawPile' },
    { type: 'upgrade', target: 'discardPile' },
    { type: 'exhaust', target: 'thisCard' },
  ],
  upgradesTo: {
    name: 'Apotheosis+',
    description: 'Upgrade ALL cards in your deck for the rest of combat. Exhaust.',
    energy: 1,
  },
})

// ============================================
// TRANSFORM CARDS
// ============================================

registerCard({
  id: 'transmutation',
  name: 'Transmutation',
  description: 'Transform a random card in your hand into a random card.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'transform', target: 'randomHand', toRandom: { pool: 'all' } },
  ],
  upgradesTo: {
    name: 'Transmutation+',
    description: 'Transform a random card in your hand into a random rare card.',
    effects: [
      { type: 'transform', target: 'randomHand', toRandom: { pool: 'rare' } },
    ],
  },
})

registerCard({
  id: 'chrysalis',
  name: 'Chrysalis',
  description: 'Transform all Skills in your hand into random cards.',
  energy: 2,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'transform', target: { from: 'hand', filter: { theme: 'skill' } }, toRandom: { pool: 'all' } },
  ],
  upgradesTo: {
    name: 'Chrysalis+',
    description: 'Transform all Skills in your hand into random rare cards.',
    effects: [
      { type: 'transform', target: { from: 'hand', filter: { theme: 'skill' } }, toRandom: { pool: 'rare' } },
    ],
  },
})

registerCard({
  id: 'metamorphosis',
  name: 'Metamorphosis',
  description: 'Add 3 random Attack cards to your hand. They cost 0 this turn.',
  energy: 2,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'addCard', cardId: 'strike', destination: 'hand', count: 3 },
    { type: 'transform', target: { from: 'hand', filter: { theme: 'attack' }, count: 3 }, toRandom: { filter: { theme: 'attack' } } },
  ],
  upgradesTo: {
    name: 'Metamorphosis+',
    description: 'Add 5 random Attack cards to your hand. They cost 0 this turn.',
    effects: [
      { type: 'addCard', cardId: 'strike', destination: 'hand', count: 5 },
      { type: 'transform', target: { from: 'hand', filter: { theme: 'attack' }, count: 5 }, toRandom: { filter: { theme: 'attack' } } },
    ],
  },
})

// ============================================
// ELEMENTAL CARDS
// ============================================

// --- FIRE ---
registerCard({
  id: 'ignite',
  name: 'Ignite',
  description: 'Deal 4 fire damage. Apply Burning equal to damage dealt.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'fire',
  effects: [{ type: 'damage', amount: 4, element: 'fire' }],
  upgradesTo: {
    name: 'Ignite+',
    description: 'Deal 6 fire damage. Apply Burning equal to damage dealt.',
    effects: [{ type: 'damage', amount: 6, element: 'fire' }],
  },
})

registerCard({
  id: 'fireball',
  name: 'Fireball',
  description: 'Deal 12 fire damage. If target is Oiled: Explosion (2x damage).',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'fire',
  effects: [{ type: 'damage', amount: 12, element: 'fire' }],
  upgradesTo: {
    name: 'Fireball+',
    description: 'Deal 16 fire damage. If target is Oiled: Explosion (2x damage).',
    effects: [{ type: 'damage', amount: 16, element: 'fire' }],
  },
})

registerCard({
  id: 'inferno',
  name: 'Inferno',
  description: 'Deal 8 fire damage to ALL enemies.',
  energy: 2,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'rare',
  element: 'fire',
  effects: [{ type: 'damage', amount: 8, element: 'fire', target: 'allEnemies' }],
  upgradesTo: {
    name: 'Inferno+',
    description: 'Deal 12 fire damage to ALL enemies.',
    effects: [{ type: 'damage', amount: 12, element: 'fire', target: 'allEnemies' }],
  },
})

// --- ICE ---
registerCard({
  id: 'frost_bolt',
  name: 'Frost Bolt',
  description: 'Deal 5 ice damage. Apply 2 Frozen.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'ice',
  effects: [{ type: 'damage', amount: 5, element: 'ice' }],
  upgradesTo: {
    name: 'Frost Bolt+',
    description: 'Deal 7 ice damage. Apply 2 Frozen.',
    effects: [{ type: 'damage', amount: 7, element: 'ice' }],
  },
})

registerCard({
  id: 'drench',
  name: 'Drench',
  description: 'Apply 3 Wet to an enemy. Wet enemies are vulnerable to lightning and ice combos.',
  energy: 0,
  theme: 'skill',
  target: 'enemy',
  rarity: 'common',
  element: 'ice',
  effects: [{ type: 'applyPower', powerId: 'wet', amount: 3 }],
  upgradesTo: {
    name: 'Drench+',
    description: 'Apply 5 Wet to an enemy.',
    effects: [{ type: 'applyPower', powerId: 'wet', amount: 5 }],
  },
})

registerCard({
  id: 'flash_freeze',
  name: 'Flash Freeze',
  description: 'Deal 3 ice damage. If target is Wet: Freeze them permanently.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'ice',
  effects: [{ type: 'damage', amount: 3, element: 'ice' }],
  upgradesTo: {
    name: 'Flash Freeze+',
    description: 'Deal 5 ice damage. If target is Wet: Freeze them permanently.',
    effects: [{ type: 'damage', amount: 5, element: 'ice' }],
  },
})

registerCard({
  id: 'blizzard',
  name: 'Blizzard',
  description: 'Deal 4 ice damage to ALL enemies. Apply 2 Wet.',
  energy: 2,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'rare',
  element: 'ice',
  effects: [
    { type: 'damage', amount: 4, element: 'ice', target: 'allEnemies' },
    { type: 'applyPower', powerId: 'wet', amount: 2, target: 'allEnemies' },
  ],
  upgradesTo: {
    name: 'Blizzard+',
    description: 'Deal 6 ice damage to ALL enemies. Apply 3 Wet.',
    effects: [
      { type: 'damage', amount: 6, element: 'ice', target: 'allEnemies' },
      { type: 'applyPower', powerId: 'wet', amount: 3, target: 'allEnemies' },
    ],
  },
})

// --- LIGHTNING ---
registerCard({
  id: 'spark',
  name: 'Spark',
  description: 'Deal 4 lightning damage. Apply 2 Charged.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'lightning',
  effects: [{ type: 'damage', amount: 4, element: 'lightning' }],
  upgradesTo: {
    name: 'Spark+',
    description: 'Deal 6 lightning damage. Apply 2 Charged.',
    effects: [{ type: 'damage', amount: 6, element: 'lightning' }],
  },
})

registerCard({
  id: 'thunderbolt',
  name: 'Thunderbolt',
  description: 'Deal 10 lightning damage. If Wet: Chain to all enemies (1.5x).',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'lightning',
  effects: [{ type: 'damage', amount: 10, element: 'lightning' }],
  upgradesTo: {
    name: 'Thunderbolt+',
    description: 'Deal 14 lightning damage. If Wet: Chain to all enemies (1.5x).',
    effects: [{ type: 'damage', amount: 14, element: 'lightning' }],
  },
})

registerCard({
  id: 'chain_lightning',
  name: 'Chain Lightning',
  description: 'Deal 6 lightning damage to ALL enemies.',
  energy: 2,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'rare',
  element: 'lightning',
  effects: [{ type: 'damage', amount: 6, element: 'lightning', target: 'allEnemies' }],
  upgradesTo: {
    name: 'Chain Lightning+',
    description: 'Deal 9 lightning damage to ALL enemies.',
    effects: [{ type: 'damage', amount: 9, element: 'lightning', target: 'allEnemies' }],
  },
})

// --- VOID ---
registerCard({
  id: 'oil_slick',
  name: 'Oil Slick',
  description: 'Apply 3 Oiled to an enemy. Oiled enemies explode when hit with fire.',
  energy: 0,
  theme: 'skill',
  target: 'enemy',
  rarity: 'common',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'oiled', amount: 3 }],
  upgradesTo: {
    name: 'Oil Slick+',
    description: 'Apply 5 Oiled to an enemy.',
    effects: [{ type: 'applyPower', powerId: 'oiled', amount: 5 }],
  },
})

registerCard({
  id: 'void_touch',
  name: 'Void Touch',
  description: 'Deal 6 void damage. Apply 2 Oiled.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'common',
  element: 'void',
  effects: [{ type: 'damage', amount: 6, element: 'void' }],
  upgradesTo: {
    name: 'Void Touch+',
    description: 'Deal 9 void damage. Apply 2 Oiled.',
    effects: [{ type: 'damage', amount: 9, element: 'void' }],
  },
})

registerCard({
  id: 'void_eruption',
  name: 'Void Eruption',
  description: 'Deal 5 void damage to ALL enemies. Apply 2 Oiled to all.',
  energy: 2,
  theme: 'attack',
  target: 'allEnemies',
  rarity: 'rare',
  element: 'void',
  effects: [
    { type: 'damage', amount: 5, element: 'void', target: 'allEnemies' },
    { type: 'applyPower', powerId: 'oiled', amount: 2, target: 'allEnemies' },
  ],
  upgradesTo: {
    name: 'Void Eruption+',
    description: 'Deal 8 void damage to ALL enemies. Apply 3 Oiled to all.',
    effects: [
      { type: 'damage', amount: 8, element: 'void', target: 'allEnemies' },
      { type: 'applyPower', powerId: 'oiled', amount: 3, target: 'allEnemies' },
    ],
  },
})

// --- PHYSICAL COMBO ENABLERS ---
registerCard({
  id: 'shatter',
  name: 'Shatter',
  description: 'Deal 7 physical damage. If Frozen: 1.5x damage, execute below 15% HP.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'physical',
  effects: [{ type: 'damage', amount: 7, element: 'physical' }],
  upgradesTo: {
    name: 'Shatter+',
    description: 'Deal 10 physical damage. If Frozen: 1.5x damage, execute below 15% HP.',
    effects: [{ type: 'damage', amount: 10, element: 'physical' }],
  },
})

registerCard({
  id: 'elemental_fury',
  name: 'Elemental Fury',
  description: 'Deal 3 damage of each element (physical, fire, ice, lightning, void).',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'rare',
  effects: [
    { type: 'damage', amount: 3, element: 'physical' },
    { type: 'damage', amount: 3, element: 'fire' },
    { type: 'damage', amount: 3, element: 'ice' },
    { type: 'damage', amount: 3, element: 'lightning' },
    { type: 'damage', amount: 3, element: 'void' },
  ],
  upgradesTo: {
    name: 'Elemental Fury+',
    description: 'Deal 5 damage of each element (physical, fire, ice, lightning, void).',
    effects: [
      { type: 'damage', amount: 5, element: 'physical' },
      { type: 'damage', amount: 5, element: 'fire' },
      { type: 'damage', amount: 5, element: 'ice' },
      { type: 'damage', amount: 5, element: 'lightning' },
      { type: 'damage', amount: 5, element: 'void' },
    ],
  },
})

// ============================================
// ELEMENTAL POWER CARDS
// ============================================

// --- FIRE POWERS ---
registerCard({
  id: 'combustion',
  name: 'Combustion',
  description: 'At the start of your turn, deal 3 fire damage to ALL enemies.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'fire',
  effects: [{ type: 'applyPower', powerId: 'eternalFlames', amount: 3, target: 'self' }],
  upgradesTo: {
    name: 'Combustion+',
    description: 'At the start of your turn, deal 5 fire damage to ALL enemies.',
    effects: [{ type: 'applyPower', powerId: 'eternalFlames', amount: 5, target: 'self' }],
  },
})

registerCard({
  id: 'pyromaniac',
  name: 'Pyromaniac',
  description: 'Whenever you deal fire damage, apply 1 Burning.',
  energy: 2,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'fire',
  effects: [{ type: 'applyPower', powerId: 'pyromaniac', amount: 1, target: 'self' }],
  upgradesTo: {
    name: 'Pyromaniac+',
    description: 'Whenever you deal fire damage, apply 2 Burning.',
    effects: [{ type: 'applyPower', powerId: 'pyromaniac', amount: 2, target: 'self' }],
  },
})

// --- ICE POWERS ---
registerCard({
  id: 'frost_aura',
  name: 'Frost Aura',
  description: 'Whenever you gain Block, apply 1 Frozen to a random enemy.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'ice',
  effects: [{ type: 'applyPower', powerId: 'frostAura', amount: 1, target: 'self' }],
  upgradesTo: {
    name: 'Frost Aura+',
    description: 'Whenever you gain Block, apply 2 Frozen to a random enemy.',
    effects: [{ type: 'applyPower', powerId: 'frostAura', amount: 2, target: 'self' }],
  },
})

registerCard({
  id: 'permafrost',
  name: 'Permafrost',
  description: 'At the start of your turn, apply 2 Wet to ALL enemies.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'ice',
  effects: [{ type: 'applyPower', powerId: 'permafrost', amount: 2, target: 'self' }],
  upgradesTo: {
    name: 'Permafrost+',
    description: 'At the start of your turn, apply 3 Wet to ALL enemies.',
    effects: [{ type: 'applyPower', powerId: 'permafrost', amount: 3, target: 'self' }],
  },
})

// --- LIGHTNING POWERS ---
registerCard({
  id: 'static_charge',
  name: 'Static Charge',
  description: 'Whenever you play a card, apply 1 Charged to a random enemy.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'lightning',
  effects: [{ type: 'applyPower', powerId: 'staticCharge', amount: 1, target: 'self' }],
  upgradesTo: {
    name: 'Static Charge+',
    description: 'Whenever you play a card, apply 2 Charged to a random enemy.',
    effects: [{ type: 'applyPower', powerId: 'staticCharge', amount: 2, target: 'self' }],
  },
})

registerCard({
  id: 'storm_conduit',
  name: 'Storm Conduit',
  description: 'Lightning damage chains to 1 additional enemy.',
  energy: 2,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'lightning',
  effects: [{ type: 'applyPower', powerId: 'stormConduit', amount: 1, target: 'self' }],
  upgradesTo: {
    name: 'Storm Conduit+',
    description: 'Lightning damage chains to 2 additional enemies.',
    effects: [{ type: 'applyPower', powerId: 'stormConduit', amount: 2, target: 'self' }],
  },
})

// --- VOID POWERS ---
registerCard({
  id: 'entropy',
  name: 'Entropy',
  description: 'At the start of your turn, apply 2 Oiled to a random enemy.',
  energy: 1,
  theme: 'power',
  target: 'self',
  rarity: 'uncommon',
  element: 'void',
  effects: [{ type: 'applyPower', powerId: 'entropy', amount: 2, target: 'self' }],
  upgradesTo: {
    name: 'Entropy+',
    description: 'At the start of your turn, apply 3 Oiled to a random enemy.',
    effects: [{ type: 'applyPower', powerId: 'entropy', amount: 3, target: 'self' }],
  },
})

registerCard({
  id: 'void_embrace',
  name: 'Void Embrace',
  description: 'Whenever an enemy dies, gain 1 Energy and draw 1 card.',
  energy: 2,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'void',
  effects: [
    { type: 'applyPower', powerId: 'energizeOnKill', amount: 1, target: 'self' },
    { type: 'applyPower', powerId: 'drawOnKill', amount: 1, target: 'self' },
  ],
  upgradesTo: {
    name: 'Void Embrace+',
    description: 'Whenever an enemy dies, gain 2 Energy and draw 2 cards.',
    effects: [
      { type: 'applyPower', powerId: 'energizeOnKill', amount: 2, target: 'self' },
      { type: 'applyPower', powerId: 'drawOnKill', amount: 2, target: 'self' },
    ],
  },
})

// --- COMBO ENABLER CARDS ---
registerCard({
  id: 'catalyst',
  name: 'Catalyst',
  description: 'Apply 5 Burning to target enemy.',
  energy: 1,
  theme: 'skill',
  target: 'enemy',
  rarity: 'uncommon',
  element: 'fire',
  effects: [{ type: 'applyPower', powerId: 'burning', amount: 5 }],
  upgradesTo: {
    name: 'Catalyst+',
    description: 'Apply 8 Burning to target enemy.',
    effects: [{ type: 'applyPower', powerId: 'burning', amount: 8 }],
  },
})

registerCard({
  id: 'elemental_mastery',
  name: 'Elemental Mastery',
  description: 'Your elemental combos deal 50% more damage this combat.',
  energy: 3,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  element: 'physical',
  effects: [{ type: 'applyPower', powerId: 'elementalMastery', amount: 50, target: 'self' }],
  upgradesTo: {
    name: 'Elemental Mastery+',
    description: 'Your elemental combos deal 100% more damage this combat.',
    effects: [{ type: 'applyPower', powerId: 'elementalMastery', amount: 100, target: 'self' }],
  },
})

// ============================================
// NEW ATOMIC EFFECT CARDS
// ============================================

// --- MAX HEALTH / SET HEALTH ---
registerCard({
  id: 'feed',
  name: 'Feed',
  description: 'Deal 10 damage. If this kills, gain 3 Max HP permanently.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'rare',
  tags: ['finisher'],
  effects: [
    { type: 'damage', amount: 10, triggerOnHit: [
      {
        type: 'conditional',
        condition: { type: 'health', target: 'enemy', compare: 'current', op: '<=', value: 0 },
        then: [{ type: 'maxHealth', amount: 3, target: 'self', operation: 'gain' }],
      },
    ]},
  ],
  upgradesTo: {
    name: 'Feed+',
    description: 'Deal 12 damage. If this kills, gain 4 Max HP permanently.',
    effects: [
      { type: 'damage', amount: 12, triggerOnHit: [
        {
          type: 'conditional',
          condition: { type: 'health', target: 'enemy', compare: 'current', op: '<=', value: 0 },
          then: [{ type: 'maxHealth', amount: 4, target: 'self', operation: 'gain' }],
        },
      ]},
    ],
  },
})

registerCard({
  id: 'offering',
  name: 'Offering',
  description: 'Lose 6 HP. Gain 2 Energy. Draw 3 cards.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'maxHealth', amount: 6, target: 'self', operation: 'lose' },
    { type: 'energy', amount: 2, operation: 'gain' },
    { type: 'draw', amount: 3 },
  ],
})

registerCard({
  id: 'blood_pact',
  name: 'Blood Pact',
  description: 'Set your HP to 1. Draw 5 cards. Gain 3 Energy.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'setHealth', amount: 1, target: 'self' },
    { type: 'draw', amount: 5 },
    { type: 'energy', amount: 3, operation: 'gain' },
  ],
})

// --- DESTROY BLOCK ---
registerCard({
  id: 'sunder',
  name: 'Sunder',
  description: 'Remove all Block from an enemy. Deal 8 damage.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  effects: [
    { type: 'destroyBlock', target: 'enemy' },
    { type: 'damage', amount: 8 },
  ],
  upgradesTo: {
    name: 'Sunder+',
    description: 'Remove all Block from an enemy. Deal 12 damage.',
    effects: [
      { type: 'destroyBlock', target: 'enemy' },
      { type: 'damage', amount: 12 },
    ],
  },
})

registerCard({
  id: 'shatter_guard',
  name: 'Shatter Guard',
  description: 'Remove 10 Block from an enemy. Gain Block equal to amount removed.',
  energy: 1,
  theme: 'skill',
  target: 'enemy',
  rarity: 'uncommon',
  effects: [
    { type: 'destroyBlock', target: 'enemy', amount: 10 },
    { type: 'block', amount: 10, target: 'self' },
  ],
})

// --- COPY CARD ---
registerCard({
  id: 'duplicate',
  name: 'Duplicate',
  description: 'Copy a card from your discard pile to your hand.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'copyCard', target: 'randomDiscard', destination: 'hand' },
  ],
  upgradesTo: {
    name: 'Duplicate+',
    description: 'Copy 2 cards from your discard pile to your hand.',
    effects: [
      { type: 'copyCard', target: 'randomDiscard', destination: 'hand', count: 2 },
    ],
  },
})

registerCard({
  id: 'echo',
  name: 'Echo',
  description: 'Copy the top card of your draw pile to your hand.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'common',
  effects: [
    { type: 'copyCard', target: 'topDraw', destination: 'hand' },
  ],
})

// --- PUT ON DECK ---
registerCard({
  id: 'setup',
  name: 'Setup',
  description: 'Put a card from your hand on top of your draw pile. Draw 1 card.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'putOnDeck', target: 'leftmostHand', position: 'top' },
    { type: 'draw', amount: 1 },
  ],
})

registerCard({
  id: 'headstart',
  name: 'Headstart',
  description: 'Put 2 cards from your hand on top of your draw pile. Gain 1 Energy.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'putOnDeck', target: { from: 'hand', count: 2 }, position: 'top' },
    { type: 'energy', amount: 1, operation: 'gain' },
  ],
})

// --- MODIFY COST ---
registerCard({
  id: 'enlightenment',
  name: 'Enlightenment',
  description: 'All cards in your hand cost 1 less this turn.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'modifyCost', target: 'hand', amount: -1, duration: 'turn' },
  ],
  upgradesTo: {
    name: 'Enlightenment+',
    description: 'All cards in your hand cost 1 less for the rest of combat.',
    effects: [
      { type: 'modifyCost', target: 'hand', amount: -1, duration: 'combat' },
    ],
  },
})

registerCard({
  id: 'madness',
  name: 'Madness',
  description: 'A random card in your hand costs 0 for the rest of combat. Exhaust.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'modifyCost', target: 'randomHand', amount: -99, duration: 'combat' },
    { type: 'exhaust', target: 'thisCard' },
  ],
})

// --- TRANSFER POWER ---
registerCard({
  id: 'steal_strength',
  name: 'Steal Strength',
  description: 'Transfer all Strength from an enemy to yourself.',
  energy: 1,
  theme: 'skill',
  target: 'enemy',
  rarity: 'rare',
  effects: [
    { type: 'transferPower', powerId: 'strength', from: 'enemy', to: 'self' },
  ],
})

registerCard({
  id: 'dark_embrace',
  name: 'Dark Embrace',
  description: 'Transfer 2 Vulnerable from yourself to an enemy.',
  energy: 1,
  theme: 'skill',
  target: 'enemy',
  rarity: 'uncommon',
  effects: [
    { type: 'transferPower', powerId: 'vulnerable', from: 'self', to: 'enemy', amount: 2 },
  ],
})

// ============================================
// REPLAY / RECURSION CARDS
// ============================================

registerCard({
  id: 'double_tap',
  name: 'Double Tap',
  description: 'This turn, your next Attack is played twice.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'applyPower', powerId: 'doubleTap', amount: 1, target: 'self' },
  ],
  upgradesTo: {
    name: 'Double Tap+',
    description: 'This turn, your next 2 Attacks are played twice.',
    effects: [
      { type: 'applyPower', powerId: 'doubleTap', amount: 2, target: 'self' },
    ],
  },
})

registerCard({
  id: 'havoc',
  name: 'Havoc',
  description: 'Play the top card of your draw pile and Exhaust it.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'playTopCard', pile: 'drawPile', exhaust: true },
  ],
  upgradesTo: {
    name: 'Havoc+',
    description: 'Play the top card of your draw pile and Exhaust it.',
    energy: 0,
  },
})

registerCard({
  id: 'mayhem',
  name: 'Mayhem',
  description: 'At the start of your turn, play the top card of your draw pile.',
  energy: 2,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'applyPower', powerId: 'mayhem', amount: 1, target: 'self' },
  ],
  upgradesTo: {
    name: 'Mayhem+',
    description: 'At the start of your turn, play the top 2 cards of your draw pile.',
    effects: [
      { type: 'applyPower', powerId: 'mayhem', amount: 2, target: 'self' },
    ],
  },
})

registerCard({
  id: 'encore',
  name: 'Encore',
  description: 'Replay the last card you played this turn.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'replayCard', target: 'lastPlayed' },
  ],
  upgradesTo: {
    name: 'Encore+',
    description: 'Replay the last card you played this turn twice.',
    effects: [
      { type: 'replayCard', target: 'lastPlayed', times: 2 },
    ],
  },
})

registerCard({
  id: 'flashback',
  name: 'Flashback',
  description: 'Play the top card of your discard pile. Exhaust it.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'playTopCard', pile: 'discardPile', exhaust: true },
  ],
  upgradesTo: {
    name: 'Flashback+',
    description: 'Play the top 2 cards of your discard pile. Exhaust them.',
    effects: [
      { type: 'playTopCard', pile: 'discardPile', count: 2, exhaust: true },
    ],
  },
})

registerCard({
  id: 'echo_form',
  name: 'Echo Form',
  description: 'Ethereal. The first card you play each turn is played twice.',
  energy: 3,
  theme: 'power',
  target: 'self',
  rarity: 'rare',
  tags: ['ethereal'],
  effects: [
    { type: 'applyPower', powerId: 'echoForm', amount: 1, target: 'self' },
  ],
  upgradesTo: {
    name: 'Echo Form+',
    description: 'The first card you play each turn is played twice.',
    tags: [],
  },
})

registerCard({
  id: 'burst',
  name: 'Burst',
  description: 'This turn, your next Skill is played twice.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'applyPower', powerId: 'burst', amount: 1, target: 'self' },
  ],
  upgradesTo: {
    name: 'Burst+',
    description: 'This turn, your next 2 Skills are played twice.',
    effects: [
      { type: 'applyPower', powerId: 'burst', amount: 2, target: 'self' },
    ],
  },
})

// ============================================
// GOLD & DISCOVERY CARDS
// ============================================

registerCard({
  id: 'hand_of_greed',
  name: 'Hand of Greed',
  description: 'Deal 20 damage. If this kills an enemy, gain 25 Gold.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'rare',
  effects: [
    {
      type: 'conditional',
      condition: { type: 'health', target: 'enemy', compare: 'current', op: '<=', value: 20 },
      then: [
        { type: 'damage', amount: 20 },
        { type: 'gold', amount: 25, operation: 'gain' },
      ],
      else: [
        { type: 'damage', amount: 20 },
      ],
    },
  ],
  upgradesTo: {
    name: 'Hand of Greed+',
    description: 'Deal 25 damage. If this kills an enemy, gain 30 Gold.',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'health', target: 'enemy', compare: 'current', op: '<=', value: 25 },
        then: [
          { type: 'damage', amount: 25 },
          { type: 'gold', amount: 30, operation: 'gain' },
        ],
        else: [
          { type: 'damage', amount: 25 },
        ],
      },
    ],
  },
})

registerCard({
  id: 'discovery',
  name: 'Discovery',
  description: 'Add a random card to your hand. It costs 0 this turn. Exhaust.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'discover', count: 3, destination: 'hand' },
    { type: 'exhaust', target: 'thisCard' },
  ],
  upgradesTo: {
    name: 'Discovery+',
    description: 'Add 2 random cards to your hand. They cost 0 this turn. Exhaust.',
    effects: [
      { type: 'discover', count: 3, destination: 'hand', copies: 2 },
      { type: 'exhaust', target: 'thisCard' },
    ],
  },
})

registerCard({
  id: 'jack_of_all_trades',
  name: 'Jack of All Trades',
  description: 'Add a random Uncommon card to your hand. Exhaust.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'discover', count: 1, pool: 'uncommon', destination: 'hand' },
    { type: 'exhaust', target: 'thisCard' },
  ],
  upgradesTo: {
    name: 'Jack of All Trades+',
    description: 'Add a random Rare card to your hand. Exhaust.',
    effects: [
      { type: 'discover', count: 1, pool: 'rare', destination: 'hand' },
      { type: 'exhaust', target: 'thisCard' },
    ],
  },
})

// --- BANISH CARDS ---

registerCard({
  id: 'void_sacrifice',
  name: 'Void Sacrifice',
  description: 'Deal 30 damage. Banish (removed from combat entirely).',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  rarity: 'rare',
  effects: [
    { type: 'damage', amount: 30 },
    { type: 'banish', target: 'thisCard' },
  ],
  upgradesTo: {
    name: 'Void Sacrifice+',
    description: 'Deal 45 damage. Banish.',
    effects: [
      { type: 'damage', amount: 45 },
      { type: 'banish', target: 'thisCard' },
    ],
  },
})

registerCard({
  id: 'dark_pact',
  name: 'Dark Pact',
  description: 'Gain 3 Energy. Banish a random card from your draw pile.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'energy', amount: 3, operation: 'gain' },
    { type: 'banish', target: { from: 'randomDraw', count: 1 } },
  ],
  upgradesTo: {
    name: 'Dark Pact+',
    description: 'Gain 4 Energy. Banish a random card from your draw pile.',
    effects: [
      { type: 'energy', amount: 4, operation: 'gain' },
      { type: 'banish', target: { from: 'randomDraw', count: 1 } },
    ],
  },
})

// ============================================
// ETHEREAL CARDS
// ============================================

registerCard({
  id: 'apparition',
  name: 'Apparition',
  description: 'Gain 1 Intangible. Ethereal.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  ethereal: true,
  effects: [{ type: 'applyPower', powerId: 'intangible', amount: 1 }],
  upgradesTo: {
    name: 'Apparition+',
    description: 'Gain 1 Intangible. (No longer Ethereal)',
    ethereal: false,
    effects: [{ type: 'applyPower', powerId: 'intangible', amount: 1 }],
  },
})

registerCard({
  id: 'ghostly_strike',
  name: 'Ghostly Strike',
  description: 'Deal 14 damage. Ethereal.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  rarity: 'uncommon',
  ethereal: true,
  effects: [{ type: 'damage', amount: 14 }],
  upgradesTo: {
    name: 'Ghostly Strike+',
    description: 'Deal 18 damage. Ethereal.',
    ethereal: true,
    effects: [{ type: 'damage', amount: 18 }],
  },
})

registerCard({
  id: 'fleeting_barrier',
  name: 'Fleeting Barrier',
  description: 'Gain 12 Block. Ethereal.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  ethereal: true,
  effects: [{ type: 'block', amount: 12 }],
  upgradesTo: {
    name: 'Fleeting Barrier+',
    description: 'Gain 16 Block. Ethereal.',
    ethereal: true,
    effects: [{ type: 'block', amount: 16 }],
  },
})

// ============================================
// PLAYER-CHOICE BANISH
// ============================================

registerCard({
  id: 'purge',
  name: 'Purge',
  description: 'Choose a card in your hand to Banish.',
  energy: 0,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'banish', target: 'hand', amount: 1, playerChoice: true },
  ],
  upgradesTo: {
    name: 'Purge+',
    description: 'Choose up to 2 cards in your hand to Banish.',
    effects: [
      { type: 'banish', target: 'hand', amount: 2, playerChoice: true },
    ],
  },
})

// ============================================
// RETAIN CARDS
// ============================================

registerCard({
  id: 'well_laid_plans',
  name: 'Well-Laid Plans',
  description: 'Retain a random card in your hand. Draw 1 card.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'uncommon',
  effects: [
    { type: 'retain', target: { from: 'hand', count: 1 } },
    { type: 'draw', amount: 1 },
  ],
  upgradesTo: {
    name: 'Well-Laid Plans+',
    description: 'Retain 2 random cards in your hand. Draw 1 card.',
    effects: [
      { type: 'retain', target: { from: 'hand', count: 2 } },
      { type: 'draw', amount: 1 },
    ],
  },
})

registerCard({
  id: 'runic_pyramid',
  name: 'Runic Pyramid',
  description: 'Retain your entire hand. Exhaust.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  rarity: 'rare',
  effects: [
    { type: 'retain', target: 'hand' },
    { type: 'exhaust', target: 'thisCard' },
  ],
  upgradesTo: {
    name: 'Runic Pyramid+',
    description: 'Retain your entire hand.',
    energy: 0,
    effects: [
      { type: 'retain', target: 'hand' },
    ],
  },
})
