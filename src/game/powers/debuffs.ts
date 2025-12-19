// ============================================
// DEBUFF POWERS
// ============================================

import type { PowerDefinition } from '../../types'

export const DEBUFF_POWERS: PowerDefinition[] = [
  {
    id: 'vulnerable',
    name: 'Vulnerable',
    description: 'Takes 50% more damage. {amount} turn(s).',
    stackBehavior: 'duration',
    modifiers: { incomingDamage: 1.5 },
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'weak',
    name: 'Weak',
    description: 'Deals 25% less damage. {amount} turn(s).',
    stackBehavior: 'duration',
    modifiers: { outgoingDamage: 0.75 },
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'frail',
    name: 'Frail',
    description: 'Block gained is 25% less effective. {amount} turn(s).',
    stackBehavior: 'duration',
    modifiers: { outgoingBlock: 0.75 },
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'poison',
    name: 'Poison',
    description: 'Takes {amount} damage at turn start. Loses 1 stack.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
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
    decayOn: 'turnStart',
    removeAtZero: true,
    isDebuff: true,
  },
  {
    id: 'marked',
    name: 'Marked',
    description: 'Takes {amount}% more damage from attacks. {duration} turn(s).',
    stackBehavior: 'intensity',
    // Note: Damage bonus calculated specially based on amount (stored as percentage)
    // Applied via applyIncomingDamageModifiers when checking for 'marked' power
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
  },
]
