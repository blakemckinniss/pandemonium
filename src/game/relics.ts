// ============================================
// RELIC SYSTEM - Registry & Definitions
// ============================================

import type { RelicDefinition, RelicRarity } from '../types'

const relicRegistry = new Map<string, RelicDefinition>()

export function registerRelic(relic: RelicDefinition): void {
  relicRegistry.set(relic.id, relic)
}

export function getRelicDefinition(id: string): RelicDefinition | undefined {
  return relicRegistry.get(id)
}

export function getAllRelics(): RelicDefinition[] {
  return Array.from(relicRegistry.values())
}

export function getRelicsByRarity(rarity: RelicRarity): RelicDefinition[] {
  return getAllRelics().filter((r) => r.rarity === rarity)
}

// ============================================
// STARTER RELICS
// ============================================

registerRelic({
  id: 'burning_blood',
  name: 'Burning Blood',
  description: 'At the end of combat, heal 6 HP.',
  rarity: 'common',
  trigger: 'onCombatEnd',
  effects: [{ type: 'heal', amount: 6, target: 'self' }],
})

// ============================================
// COMMON RELICS
// ============================================

registerRelic({
  id: 'anchor',
  name: 'Anchor',
  description: 'Start each combat with 10 Block.',
  rarity: 'common',
  trigger: 'onCombatStart',
  effects: [{ type: 'block', amount: 10, target: 'self' }],
})

registerRelic({
  id: 'lantern',
  name: 'Lantern',
  description: 'Gain 1 Energy at the start of each combat.',
  rarity: 'common',
  trigger: 'onCombatStart',
  effects: [{ type: 'energy', amount: 1, operation: 'gain' }],
})

registerRelic({
  id: 'bag_of_marbles',
  name: 'Bag of Marbles',
  description: 'At the start of combat, apply 1 Vulnerable to ALL enemies.',
  rarity: 'common',
  trigger: 'onCombatStart',
  effects: [{ type: 'applyPower', powerId: 'vulnerable', amount: 1, target: 'allEnemies' }],
})

registerRelic({
  id: 'bronze_scales',
  name: 'Bronze Scales',
  description: 'Start combat with 3 Thorns.',
  rarity: 'common',
  trigger: 'onCombatStart',
  effects: [{ type: 'applyPower', powerId: 'thorns', amount: 3, target: 'self' }],
})

registerRelic({
  id: 'orichalcum',
  name: 'Orichalcum',
  description: 'If you end your turn without Block, gain 6 Block.',
  rarity: 'common',
  trigger: 'onTurnEnd',
  effects: [
    {
      type: 'conditional',
      condition: { type: 'block', op: '==', value: 0 },
      then: [{ type: 'block', amount: 6, target: 'self' }],
    },
  ],
})

// ============================================
// UNCOMMON RELICS
// ============================================

registerRelic({
  id: 'blood_vial',
  name: 'Blood Vial',
  description: 'At the start of each combat, heal 2 HP.',
  rarity: 'uncommon',
  trigger: 'onCombatStart',
  effects: [{ type: 'heal', amount: 2, target: 'self' }],
})

registerRelic({
  id: 'pen_nib',
  name: 'Pen Nib',
  description: 'Every 10th Attack deals double damage.',
  rarity: 'uncommon',
  trigger: 'onAttack',
  // Note: Would need counter logic in execution
  effects: [],
})

registerRelic({
  id: 'meat_on_bone',
  name: 'Meat on the Bone',
  description: 'If your HP is at 50% or less at end of combat, heal 12 HP.',
  rarity: 'uncommon',
  trigger: 'onCombatEnd',
  effects: [
    {
      type: 'conditional',
      condition: { type: 'health', op: '<=', value: 0.5, percentage: true },
      then: [{ type: 'heal', amount: 12, target: 'self' }],
    },
  ],
})

registerRelic({
  id: 'eternal_feather',
  name: 'Eternal Feather',
  description: 'Whenever you enter a rest site, heal an additional 3 HP for each card in your deck.',
  rarity: 'uncommon',
  trigger: 'passive',
  // Note: Handled specially at rest sites
  effects: [],
})

registerRelic({
  id: 'war_paint',
  name: 'War Paint',
  description: 'Start each combat with 1 Strength.',
  rarity: 'uncommon',
  trigger: 'onCombatStart',
  effects: [{ type: 'applyPower', powerId: 'strength', amount: 1, target: 'self' }],
})

// ============================================
// RARE RELICS
// ============================================

registerRelic({
  id: 'captains_wheel',
  name: "Captain's Wheel",
  description: 'At the start of your 3rd turn, gain 18 Block.',
  rarity: 'rare',
  trigger: 'onTurnStart',
  effects: [
    {
      type: 'conditional',
      condition: { type: 'turn', op: '==', value: 3 },
      then: [{ type: 'block', amount: 18, target: 'self' }],
    },
  ],
})

registerRelic({
  id: 'paper_krane',
  name: 'Paper Krane',
  description: 'Enemies with Weak deal 40% less damage instead of 25%.',
  rarity: 'rare',
  trigger: 'passive',
  // Note: Modifier handled in damage calculation
  effects: [],
})

registerRelic({
  id: 'tungsten_rod',
  name: 'Tungsten Rod',
  description: 'Whenever you would lose HP, lose 1 less.',
  rarity: 'rare',
  trigger: 'passive',
  // Note: Modifier handled in damage application
  effects: [],
})

registerRelic({
  id: 'ice_cream',
  name: 'Ice Cream',
  description: 'Energy is conserved between turns.',
  rarity: 'rare',
  trigger: 'passive',
  // Note: Handled in turn logic
  effects: [],
})

registerRelic({
  id: 'runic_pyramid',
  name: 'Runic Pyramid',
  description: 'At the end of your turn, do not discard your hand.',
  rarity: 'rare',
  trigger: 'passive',
  // Note: Handled in end turn logic
  effects: [],
})
