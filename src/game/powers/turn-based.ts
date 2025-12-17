// ============================================
// TURN-BASED POWERS (LLM-Generated Support)
// ============================================
// These powers were commonly invented by the card generator LLM

import type { PowerDefinition } from '../../types'

export const TURN_BASED_POWERS: PowerDefinition[] = [
  {
    id: 'energizeNextTurn',
    name: 'Energize Next Turn',
    description: 'At the start of your turn, gain {amount} Energy.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
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
    id: 'drawPerTurn',
    name: 'Draw Per Turn',
    description: 'At the start of your turn, draw {amount} card(s).',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'draw',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          },
        ],
      },
    ],
  },
  {
    id: 'drawCard',
    name: 'Draw Card',
    description: 'At the start of your turn, draw {amount} card(s).',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'draw',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          },
        ],
      },
    ],
  },
  {
    id: 'eternalFlames',
    name: 'Eternal Flames',
    description: 'At the start of your turn, deal {amount} damage to ALL enemies.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'damage',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'allEnemies',
          },
        ],
      },
    ],
  },
  {
    id: 'noxiousFumes',
    name: 'Noxious Fumes',
    description: 'At the start of your turn, apply {amount} Poison to ALL enemies.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'applyPower',
            powerId: 'poison',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'allEnemies',
          },
        ],
      },
    ],
  },
  {
    id: 'temporalAnchor',
    name: 'Temporal Anchor',
    description: 'At the start of your turn, gain {amount} Energy and draw 1 card.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'energy',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            operation: 'gain',
          },
          {
            type: 'draw',
            amount: 1,
          },
        ],
      },
    ],
  },
]
