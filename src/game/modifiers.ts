// ============================================
// MODIFIER REGISTRY
// ============================================
// Registry pattern for dungeon deck modifiers (Catalysts, Omens, Edicts, Seals)
// Follows same pattern as relics.ts

import type { ModifierDefinition, ModifierRarity } from '../types'
import { getCardDefinition } from './cards'

// ============================================
// REGISTRY
// ============================================

const modifierRegistry = new Map<string, ModifierDefinition>()

export function registerModifier(modifier: ModifierDefinition): void {
  modifierRegistry.set(modifier.id, modifier)
}

export function getModifierDefinition(id: string): ModifierDefinition | undefined {
  return modifierRegistry.get(id)
}

export function getAllModifiers(): ModifierDefinition[] {
  return Array.from(modifierRegistry.values())
}

export function getModifiersByRarity(rarity: ModifierRarity): ModifierDefinition[] {
  return getAllModifiers().filter((m) => m.rarity === rarity)
}

export function getModifiersByCategory(
  category: ModifierDefinition['category']
): ModifierDefinition[] {
  return getAllModifiers().filter((m) => m.category === category)
}

// ============================================
// STARTER MODIFIERS - COMMON (Consumable)
// ============================================

// Catalyst: Active trade-offs, transmutation
registerModifier({
  id: 'copper_tithe',
  name: 'Copper Tithe',
  description: '+10% gold rewards. Enemies have +3% HP.',
  flavorText: 'The merchant god demands tribute.',
  category: 'catalyst',
  rarity: 'common',
  dangerValue: 4.8,
  rewardValue: 5,
  durability: { type: 'consumable' },
  effects: [
    { target: 'reward_scaling', scope: 'gold', multiplier: 1.1 },
    { target: 'enemy_stats', scope: 'all', stat: 'health', operation: 'multiply', value: 1.03 },
  ],
})

registerModifier({
  id: 'kindling',
  name: 'Kindling',
  description: '-1 campfire room. +1 treasure room.',
  flavorText: 'No rest for the wicked.',
  category: 'catalyst',
  rarity: 'common',
  dangerValue: 5,
  rewardValue: 4,
  durability: { type: 'consumable' },
  effects: [
    { target: 'room_distribution', roomType: 'campfire', operation: 'add', count: -1 },
    { target: 'room_distribution', roomType: 'treasure', operation: 'add', count: 1 },
  ],
})

registerModifier({
  id: 'blood_price',
  name: 'Blood Price',
  description: 'Start with -5 HP. +1 starting Strength.',
  flavorText: 'Power has a cost.',
  category: 'catalyst',
  rarity: 'common',
  dangerValue: 5,
  rewardValue: 5,
  durability: { type: 'consumable' },
  effects: [
    { target: 'player_stats', stat: 'startingHealth', operation: 'add', value: -5 },
    { target: 'player_stats', stat: 'strength', operation: 'add', value: 1 },
  ],
})

// Omen: Curses, prophecies, inevitable doom
registerModifier({
  id: 'dark_prophecy',
  name: 'Dark Prophecy',
  description: '+1 curse added to deck. Card rewards +1 rarity tier.',
  flavorText: 'The future is written in blood.',
  category: 'omen',
  rarity: 'common',
  dangerValue: 6,
  rewardValue: 6,
  durability: { type: 'consumable' },
  effects: [
    { target: 'curse_injection', count: 1 },
    { target: 'card_rewards', rarityBoost: 1 },
  ],
})

registerModifier({
  id: 'whispers_of_doom',
  name: 'Whispers of Doom',
  description: 'Enemies have +1 Strength. +15% gold rewards.',
  flavorText: 'They know you are coming.',
  category: 'omen',
  rarity: 'common',
  dangerValue: 6,
  rewardValue: 7.5,
  durability: { type: 'consumable' },
  effects: [
    { target: 'enemy_stats', scope: 'all', stat: 'strength', operation: 'add', value: 1 },
    { target: 'reward_scaling', scope: 'gold', multiplier: 1.15 },
  ],
})

// Edict: Rule changes, decrees from above
registerModifier({
  id: 'austerity_decree',
  name: 'Austerity Decree',
  description: '-1 energy per turn. +1 card draw per turn.',
  flavorText: 'The council demands efficiency.',
  category: 'edict',
  rarity: 'common',
  dangerValue: 7,
  rewardValue: 7,
  durability: { type: 'consumable' },
  effects: [
    { target: 'player_stats', stat: 'energy', operation: 'add', value: -1 },
    { target: 'player_stats', stat: 'draw', operation: 'add', value: 1 },
  ],
})

registerModifier({
  id: 'conscription_order',
  name: 'Conscription Order',
  description: '+1 combat room. Remove 1 basic card from rewards.',
  flavorText: 'All must serve.',
  category: 'edict',
  rarity: 'common',
  dangerValue: 4,
  rewardValue: 3,
  durability: { type: 'consumable' },
  effects: [
    { target: 'room_distribution', roomType: 'combat', operation: 'add', count: 1 },
    { target: 'card_rewards', removeBasics: 1 },
  ],
})

// ============================================
// STARTER MODIFIERS - UNCOMMON (Fragile 3 uses)
// ============================================

registerModifier({
  id: 'gauntlet_decree',
  name: 'Gauntlet Decree',
  description: '+2 elite rooms. -1 treasure room. +40% gold rewards.',
  flavorText: 'The strong shall be rewarded.',
  category: 'edict',
  rarity: 'uncommon',
  dangerValue: 20,
  rewardValue: 20,
  durability: { type: 'fragile', uses: 3, maxUses: 3 },
  effects: [
    { target: 'room_distribution', roomType: 'elite', operation: 'add', count: 2 },
    { target: 'room_distribution', roomType: 'treasure', operation: 'add', count: -1 },
    { target: 'reward_scaling', scope: 'gold', multiplier: 1.4 },
  ],
})

registerModifier({
  id: 'ember_pact',
  name: 'Ember Pact',
  description: '+25% fire damage dealt. +25% fire damage taken. Fire cards more common.',
  flavorText: 'Embrace the flame.',
  category: 'seal',
  rarity: 'uncommon',
  dangerValue: 8,
  rewardValue: 10,
  durability: { type: 'fragile', uses: 3, maxUses: 3 },
  effects: [
    { target: 'element_affinity', element: 'fire', damageMultiplier: 1.25, resistanceMultiplier: 0.75, cardChance: 1.5 },
  ],
})

registerModifier({
  id: 'frost_binding',
  name: 'Frost Binding',
  description: '+25% ice damage dealt. -10% max HP. Ice cards more common.',
  flavorText: 'Cold preserves.',
  category: 'seal',
  rarity: 'uncommon',
  dangerValue: 10,
  rewardValue: 12,
  durability: { type: 'fragile', uses: 3, maxUses: 3 },
  effects: [
    { target: 'element_affinity', element: 'ice', damageMultiplier: 1.25, cardChance: 1.5 },
    { target: 'player_stats', stat: 'maxHealth', operation: 'multiply', value: 0.9 },
  ],
})

registerModifier({
  id: 'fortune_hunters_mark',
  name: "Fortune Hunter's Mark",
  description: '+1 treasure room. +1 elite room. +20% gold rewards.',
  flavorText: 'Risk and reward, hand in hand.',
  category: 'catalyst',
  rarity: 'uncommon',
  dangerValue: 12,
  rewardValue: 14,
  durability: { type: 'fragile', uses: 3, maxUses: 3 },
  effects: [
    { target: 'room_distribution', roomType: 'treasure', operation: 'add', count: 1 },
    { target: 'room_distribution', roomType: 'elite', operation: 'add', count: 1 },
    { target: 'reward_scaling', scope: 'gold', multiplier: 1.2 },
  ],
})

// ============================================
// STARTER MODIFIERS - RARE (Fragile 5 uses)
// ============================================

registerModifier({
  id: 'crucible_run',
  name: 'Crucible Run',
  description: '+3 elite rooms. No treasure rooms. +100% gold. Relics +1 rarity tier.',
  flavorText: 'Only the worthy emerge.',
  category: 'catalyst',
  rarity: 'rare',
  dangerValue: 28,
  rewardValue: 32,
  durability: { type: 'fragile', uses: 5, maxUses: 5 },
  effects: [
    { target: 'room_distribution', roomType: 'elite', operation: 'add', count: 3 },
    { target: 'room_distribution', roomType: 'treasure', operation: 'set', count: 0 },
    { target: 'reward_scaling', scope: 'gold', multiplier: 2.0 },
    { target: 'relic_rewards', rarityBoost: 1 },
  ],
})

registerModifier({
  id: 'desolation_seal',
  name: 'Desolation Seal',
  description: 'No campfire rooms. +30% gold. All rewards +1 rarity tier.',
  flavorText: 'There is no sanctuary.',
  category: 'seal',
  rarity: 'rare',
  dangerValue: 23,
  rewardValue: 25,
  durability: { type: 'fragile', uses: 5, maxUses: 5 },
  effects: [
    { target: 'room_distribution', roomType: 'campfire', operation: 'set', count: 0 },
    { target: 'reward_scaling', scope: 'gold', multiplier: 1.3 },
    { target: 'card_rewards', rarityBoost: 1 },
    { target: 'relic_rewards', rarityBoost: 1 },
  ],
})

registerModifier({
  id: 'doom_harbinger',
  name: 'Doom Harbinger',
  description: '+2 curses. +50% gold. +2 extra card choices. Cards +1 rarity.',
  flavorText: 'The end draws near, but not for you.',
  category: 'omen',
  rarity: 'rare',
  dangerValue: 20,
  rewardValue: 24,
  durability: { type: 'fragile', uses: 5, maxUses: 5 },
  effects: [
    { target: 'curse_injection', count: 2 },
    { target: 'reward_scaling', scope: 'gold', multiplier: 1.5 },
    { target: 'card_rewards', extraChoices: 2, rarityBoost: 1 },
  ],
})

// ============================================
// STARTER MODIFIERS - LEGENDARY (Permanent, achievement unlock only)
// ============================================

registerModifier({
  id: 'chaos_engine',
  name: 'Chaos Engine',
  description: 'All room counts random (±3). Gold ×2. Boss has 2 phases.',
  flavorText: 'Order is an illusion.',
  category: 'catalyst',
  rarity: 'legendary',
  dangerValue: 45,
  rewardValue: 50,
  durability: { type: 'permanent' },
  effects: [
    // Room randomization handled specially in dungeon generation
    { target: 'reward_scaling', scope: 'gold', multiplier: 2.0 },
    // Boss phase 2 handled in heat effects
  ],
})

registerModifier({
  id: 'eternal_vigil',
  name: 'Eternal Vigil',
  description: 'No healing ever. +4 Strength. +100% gold.',
  flavorText: 'Rest is for the dead.',
  category: 'seal',
  rarity: 'legendary',
  dangerValue: 50,
  rewardValue: 55,
  durability: { type: 'permanent' },
  effects: [
    // No healing handled specially in effect engine
    { target: 'player_stats', stat: 'strength', operation: 'add', value: 4 },
    { target: 'reward_scaling', scope: 'gold', multiplier: 2.0 },
  ],
})

// ============================================
// DECK HOOK MODIFIERS
// ============================================
// These modifiers influence starter deck composition via the deck builder pipeline.

// Elemental Focus: Filter pool to fire element cards only
registerModifier({
  id: 'elemental_focus_fire',
  name: 'Elemental Focus: Fire',
  description: 'Starter deck only contains fire-element cards. +25% fire damage.',
  flavorText: 'Burn everything.',
  category: 'edict',
  rarity: 'uncommon',
  dangerValue: 8,
  rewardValue: 10,
  durability: { type: 'fragile', uses: 3, maxUses: 3 },
  effects: [{ target: 'element_affinity', element: 'fire', damageMultiplier: 1.25 }],
  deckHook: {
    id: 'elemental_focus_fire_hook',
    phase: 'filter',
    priority: 10,
    source: 'modifier',
    sourceId: 'elemental_focus_fire',
    description: 'Filter pool to fire element cards only',
    apply: (cards, _context) => {
      const fireCards = cards.filter((cardId) => {
        const def = getCardDefinition(cardId)
        return def?.element === 'fire'
      })
      // If no fire cards available, return original pool
      return { cards: fireCards.length > 0 ? fireCards : cards }
    },
  },
})

// Lightweight Training: Only low-cost cards
registerModifier({
  id: 'lightweight_training',
  name: 'Lightweight Training',
  description: 'Starter deck only contains 0-1 cost cards. +1 energy per turn.',
  flavorText: 'Speed over power.',
  category: 'edict',
  rarity: 'uncommon',
  dangerValue: 6,
  rewardValue: 8,
  durability: { type: 'fragile', uses: 3, maxUses: 3 },
  effects: [{ target: 'player_stats', stat: 'energy', operation: 'add', value: 1 }],
  deckHook: {
    id: 'lightweight_training_hook',
    phase: 'filter',
    priority: 10,
    source: 'modifier',
    sourceId: 'lightweight_training',
    description: 'Filter pool to 0-1 cost cards only',
    apply: (cards, _context) => {
      const lowCostCards = cards.filter((cardId) => {
        const def = getCardDefinition(cardId)
        if (!def) return false
        const cost = typeof def.energy === 'number' ? def.energy : 0
        return cost <= 1
      })
      // If no low-cost cards, return original pool
      return { cards: lowCostCards.length > 0 ? lowCostCards : cards }
    },
  },
})

// Battle Ready: Bonus attack cards
registerModifier({
  id: 'battle_ready',
  name: 'Battle Ready',
  description: 'Start with 2 extra attack cards in your deck.',
  flavorText: 'Strike first, strike hard.',
  category: 'catalyst',
  rarity: 'common',
  dangerValue: 2,
  rewardValue: 4,
  durability: { type: 'consumable' },
  effects: [],
  deckHook: {
    id: 'battle_ready_hook',
    phase: 'bonus',
    priority: 50,
    source: 'modifier',
    sourceId: 'battle_ready',
    description: 'Add 2 attack cards to starter deck',
    apply: (cards, _context) => {
      // Add basic attacks from evergreen pool
      return {
        cards,
        bonuses: ['eg_strike', 'eg_pierce'],
      }
    },
  },
})
