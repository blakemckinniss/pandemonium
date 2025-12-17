// ============================================
// OFFENSIVE POWERS
// ============================================

import type { PowerDefinition } from '../../types'

export const OFFENSIVE_POWERS: PowerDefinition[] = [
  {
    id: 'strength',
    name: 'Strength',
    description: 'Deals {amount} additional damage.',
    stackBehavior: 'intensity',
    // Note: Strength is additive, handled specially in damage calc
  },
  {
    id: 'thorns',
    name: 'Thorns',
    description: 'When attacked, deal {amount} damage back.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onAttacked',
        effects: [
          {
            type: 'damage',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'source',
          },
        ],
      },
    ],
  },
  {
    id: 'anger',
    name: 'Anger',
    description: 'Gain {amount} Strength when attacked.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onAttacked',
        effects: [
          {
            type: 'applyPower',
            powerId: 'strength',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'self',
          },
        ],
      },
    ],
  },
  {
    id: 'blockRetaliation',
    name: 'Block Retaliation',
    description: 'When you gain Block, deal {amount} damage to a random enemy.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onBlock',
        effects: [
          {
            type: 'damage',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'randomEnemy',
          },
        ],
      },
    ],
  },
  {
    id: 'lifelink',
    name: 'Lifelink',
    description: 'When you attack, heal {amount} HP.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onAttack',
        effects: [
          {
            type: 'heal',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'self',
          },
        ],
      },
    ],
  },
  {
    id: 'energizeOnKill',
    name: 'Energize on Kill',
    description: 'When you kill an enemy, gain {amount} Energy.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onKill',
        effects: [
          {
            type: 'energy',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            operation: 'gain',
          },
        ],
      },
    ],
  },
  {
    id: 'drawOnKill',
    name: 'Draw on Kill',
    description: 'When you kill an enemy, draw {amount} card(s).',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onKill',
        effects: [
          {
            type: 'draw',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          },
        ],
      },
    ],
  },
]
