// ============================================
// SEDUCTIVE POWERS - Erotic Fantasy Theme
// ============================================

import type { PowerDefinition } from '../../types'

export const SEDUCTIVE_POWERS: PowerDefinition[] = [
  // ============================================
  // DEBUFFS (applied to enemies)
  // ============================================
  {
    id: 'charmed',
    name: 'Charmed',
    description: 'Deals 50% less damage. {amount} turn(s).',
    stackBehavior: 'duration',
    modifiers: { outgoingDamage: 0.5 },
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'flustered',
    name: 'Flustered',
    description: 'Too distracted to block. Gains 50% less block. {amount} turn(s).',
    stackBehavior: 'duration',
    modifiers: { outgoingBlock: 0.5 },
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'enthralled',
    name: 'Enthralled',
    description: 'Hopelessly smitten. Takes {amount} damage at turn start.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'damage',
            amount: { type: 'scaled', base: 0, perUnit: 2, source: 'powerStacks' },
            target: 'self',
            piercing: true,
          },
        ],
      },
    ],
    decayOn: 'turnStart',
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'lovestruck',
    name: 'Lovestruck',
    description: 'So infatuated they hurt themselves. Takes {amount} damage when attacking.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onAttack',
        effects: [
          {
            type: 'damage',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'self',
            piercing: true,
          },
        ],
      },
    ],
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'seduced',
    name: 'Seduced',
    description: 'Completely captivated. Cannot attack for {amount} turn(s).',
    stackBehavior: 'duration',
    // Note: Intent skip handled in enemy AI when this power is present
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
  },

  // ============================================
  // BUFFS (applied to player/heroes)
  // ============================================
  {
    id: 'allure',
    name: 'Allure',
    description: 'Your beauty distracts. Draw {amount} card(s) when attacked.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onAttacked',
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
    id: 'seductress',
    name: 'Seductress',
    description: 'Your charm is a shield. Gain {amount} Block when attacked.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onAttacked',
        effects: [
          {
            type: 'block',
            amount: { type: 'scaled', base: 0, perUnit: 2, source: 'powerStacks' },
            target: 'self',
          },
        ],
      },
    ],
  },
  {
    id: 'heartbreaker',
    name: 'Heartbreaker',
    description: 'When you Charm an enemy, deal {amount} damage to them.',
    stackBehavior: 'intensity',
    // Note: Triggered when 'charmed' is applied, handled in power application
  },
  {
    id: 'irresistible',
    name: 'Irresistible',
    description: 'Cards that apply Charm cost 1 less Energy.',
    stackBehavior: 'intensity',
    // Note: Energy reduction handled in card cost calculation
  },
  {
    id: 'temptation',
    name: 'Temptation',
    description: 'At turn start, apply {amount} Charmed to a random enemy.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'applyPower',
            powerId: 'charmed',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'randomEnemy',
          },
        ],
      },
    ],
  },
  {
    id: 'domination',
    name: 'Domination',
    description: 'Charmed enemies take {amount}% more damage from all sources.',
    stackBehavior: 'intensity',
    // Note: Bonus damage applied when target has 'charmed' power
  },
]
