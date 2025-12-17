// ============================================
// UTILITY POWERS
// ============================================

import type { PowerDefinition } from '../../types'

export const UTILITY_POWERS: PowerDefinition[] = [
  {
    id: 'ritual',
    name: 'Ritual',
    description: 'Gain {amount} Strength at turn end.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnEnd',
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
    id: 'doubleTap',
    name: 'Double Tap',
    description: 'Your next {amount} Attack(s) are played twice.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onAttackPlayed',
        effects: [
          {
            type: 'replayCard',
            target: 'lastPlayed',
          },
          {
            type: 'removePower',
            powerId: 'doubleTap',
            amount: 1,
            target: 'self',
          },
        ],
      },
    ],
    removeAtZero: true,
  },
  {
    id: 'burst',
    name: 'Burst',
    description: 'Your next {amount} Skill(s) are played twice.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onSkillPlayed',
        effects: [
          {
            type: 'replayCard',
            target: 'lastPlayed',
          },
          {
            type: 'removePower',
            powerId: 'burst',
            amount: 1,
            target: 'self',
          },
        ],
      },
    ],
    removeAtZero: true,
  },
  {
    id: 'echoForm',
    name: 'Echo Form',
    description: 'The first card you play each turn is played twice.',
    stackBehavior: 'intensity',
    // Note: Each stack grants one echo per turn. Simplified to check cardsPlayed <= stacks.
    triggers: [
      {
        event: 'onCardPlayed',
        effects: [
          {
            type: 'conditional',
            condition: { type: 'cardsPlayed', op: '<=', value: 1 },
            then: [{ type: 'replayCard', target: 'lastPlayed' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mayhem',
    name: 'Mayhem',
    description: 'At the start of your turn, play the top {amount} card(s) of your draw pile.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [
          {
            type: 'playTopCard',
            pile: 'drawPile',
            count: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          },
        ],
      },
    ],
  },
  {
    id: 'echoShield',
    name: 'Echo Shield',
    description: 'Next time you play a card, gain {amount} Block. Then remove this power.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onCardPlayed',
        effects: [
          {
            type: 'block',
            amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
            target: 'self',
          },
          {
            type: 'removePower',
            powerId: 'echoShield',
            target: 'self',
          },
        ],
      },
    ],
  },
]
