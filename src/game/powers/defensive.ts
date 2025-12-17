// ============================================
// DEFENSIVE POWERS
// ============================================

import type { PowerDefinition } from '../../types'

export const DEFENSIVE_POWERS: PowerDefinition[] = [
  {
    id: 'dexterity',
    name: 'Dexterity',
    description: 'Gains {amount} additional Block.',
    stackBehavior: 'intensity',
    // Note: Dexterity is additive, handled specially in block calc
  },
  {
    id: 'regen',
    name: 'Regeneration',
    description: 'Heal {amount} HP at turn end.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnEnd',
        effects: [
          {
            type: 'heal',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'self',
          },
        ],
      },
    ],
    decayOn: 'turnEnd',
    removeAtZero: true,
  },
  {
    id: 'metallicize',
    name: 'Metallicize',
    description: 'Gain {amount} Block at turn end.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnEnd',
        effects: [
          {
            type: 'block',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'self',
          },
        ],
      },
    ],
  },
  {
    id: 'platedArmor',
    name: 'Plated Armor',
    description: 'Gain {amount} Block at turn end. Lose 1 when taking unblocked damage.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnEnd',
        effects: [
          {
            type: 'block',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'self',
          },
        ],
      },
      {
        event: 'onDamaged',
        effects: [
          {
            type: 'removePower',
            powerId: 'platedArmor',
            amount: 1,
            target: 'self',
          },
        ],
      },
    ],
    removeAtZero: true,
  },
  {
    id: 'intangible',
    name: 'Intangible',
    description: 'Reduce ALL damage taken to 1. {amount} turn(s).',
    stackBehavior: 'duration',
    // Note: Damage reduction handled specially in damage calc
    decayOn: 'turnEnd',
    removeAtZero: true,
  },
  {
    id: 'barricade',
    name: 'Barricade',
    description: 'Block is not removed at the start of your turn.',
    stackBehavior: 'intensity',
    // Note: Block preservation handled in turn start logic
  },
]
