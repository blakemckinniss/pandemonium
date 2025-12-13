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
