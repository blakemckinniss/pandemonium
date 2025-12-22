// ============================================
// EVERGREEN CARD SET
// ============================================
// 24 foundational cards showcasing atomic effects.
// These form the core card pool for all starter decks.
//
// Distribution:
// - Base Pool (12): Always available
// - Unlock Pool (12): Progressive unlocks via wins, streaks, dungeons

import type { CardDefinition } from '../types'
import type { CollectionCardMeta, UnlockCondition } from '../types/deck-builder'

// ============================================
// EVERGREEN METADATA REGISTRY
// ============================================

const evergreenRegistry = new Map<string, CollectionCardMeta>()

/** Pending registrations - deferred until initializeEvergreenCards() is called */
interface PendingRegistration {
  card: CardDefinition
  category: CollectionCardMeta['category']
  complexity: CollectionCardMeta['complexity']
  unlockCondition: UnlockCondition
}

const pendingRegistrations: PendingRegistration[] = []
let initialized = false

function queueEvergreen(
  card: CardDefinition,
  category: CollectionCardMeta['category'],
  complexity: CollectionCardMeta['complexity'],
  unlockCondition: UnlockCondition = { type: 'always' }
): void {
  pendingRegistrations.push({ card, category, complexity, unlockCondition })
}

/**
 * Initialize all evergreen cards by registering them with the card registry.
 * Must be called after the card registry is set up.
 */
export function initializeEvergreenCards(
  registerFn: (card: CardDefinition) => void
): void {
  if (initialized) return
  initialized = true

  for (const { card, category, complexity, unlockCondition } of pendingRegistrations) {
    // Register the card with the main registry
    registerFn(card)

    // Track evergreen metadata
    evergreenRegistry.set(card.id, {
      cardId: card.id,
      category,
      complexity,
      unlockCondition,
    })
  }
}

// ============================================
// BASE POOL (12 cards - always available)
// ============================================

// --- ATTACK BASIC (3) ---

queueEvergreen(
  {
    id: 'eg_strike',
    name: 'Swift Strike',
    description: 'A quick, precise blow. Deal 6 damage.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'damage', amount: 6 }],
    upgradesTo: {
      name: 'Swift Strike+',
      description: 'Deal 9 damage.',
      effects: [{ type: 'damage', amount: 9 }],
    },
  },
  'attack_basic',
  1
)

queueEvergreen(
  {
    id: 'eg_pierce',
    name: 'Piercing Thrust',
    description: 'Bypass their defenses. Deal 4 piercing damage.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'damage', amount: 4, piercing: true }],
    upgradesTo: {
      name: 'Piercing Thrust+',
      description: 'Deal 6 piercing damage.',
      effects: [{ type: 'damage', amount: 6, piercing: true }],
    },
  },
  'attack_basic',
  1
)

queueEvergreen(
  {
    id: 'eg_twin_slash',
    name: 'Twin Slash',
    description: 'Strike twice in rapid succession. Deal 3 damage twice.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'damage', amount: 3 },
      { type: 'damage', amount: 3 },
    ],
    upgradesTo: {
      name: 'Twin Slash+',
      description: 'Deal 4 damage twice.',
      effects: [
        { type: 'damage', amount: 4 },
        { type: 'damage', amount: 4 },
      ],
    },
  },
  'attack_basic',
  1
)

// --- ATTACK UTILITY (1 base, 2 unlock) ---

queueEvergreen(
  {
    id: 'eg_quick_slash',
    name: 'Quick Slash',
    description: 'A nimble strike that flows into your next move. Deal 5 damage. Draw 1 card.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'damage', amount: 5 },
      { type: 'draw', amount: 1 },
    ],
    upgradesTo: {
      name: 'Quick Slash+',
      description: 'Deal 7 damage. Draw 1 card.',
      effects: [
        { type: 'damage', amount: 7 },
        { type: 'draw', amount: 1 },
      ],
    },
  },
  'attack_utility',
  1
)

// --- ATTACK DEBUFF (2 base, 1 unlock) ---

queueEvergreen(
  {
    id: 'eg_expose',
    name: 'Expose Weakness',
    description: 'Find their opening. Deal 5 damage. Apply 1 Vulnerable.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'damage', amount: 5 },
      { type: 'applyPower', powerId: 'vulnerable', amount: 1 },
    ],
    upgradesTo: {
      name: 'Expose Weakness+',
      description: 'Deal 7 damage. Apply 2 Vulnerable.',
      effects: [
        { type: 'damage', amount: 7 },
        { type: 'applyPower', powerId: 'vulnerable', amount: 2 },
      ],
    },
  },
  'attack_debuff',
  1
)

queueEvergreen(
  {
    id: 'eg_enfeeble',
    name: 'Enfeebling Strike',
    description: 'Sap their strength. Deal 5 damage. Apply 1 Weak.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'void',
    effects: [
      { type: 'damage', amount: 5, element: 'void' },
      { type: 'applyPower', powerId: 'weak', amount: 1 },
    ],
    upgradesTo: {
      name: 'Enfeebling Strike+',
      description: 'Deal 7 damage. Apply 2 Weak.',
      effects: [
        { type: 'damage', amount: 7, element: 'void' },
        { type: 'applyPower', powerId: 'weak', amount: 2 },
      ],
    },
  },
  'attack_debuff',
  1
)

// --- DEFENSE BASIC (2) ---

queueEvergreen(
  {
    id: 'eg_guard',
    name: 'Guard',
    description: 'Raise your defenses. Gain 5 Block.',
    energy: 1,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'block', amount: 5 }],
    upgradesTo: {
      name: 'Guard+',
      description: 'Gain 8 Block.',
      effects: [{ type: 'block', amount: 8 }],
    },
  },
  'defense_basic',
  1
)

queueEvergreen(
  {
    id: 'eg_iron_wall',
    name: 'Iron Wall',
    description: 'Brace for impact. Gain 12 Block.',
    energy: 2,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'block', amount: 12 }],
    upgradesTo: {
      name: 'Iron Wall+',
      description: 'Gain 16 Block.',
      effects: [{ type: 'block', amount: 16 }],
    },
  },
  'defense_basic',
  2
)

// --- DEFENSE UTILITY (1 base, 2 unlock) ---

queueEvergreen(
  {
    id: 'eg_tactical_retreat',
    name: 'Tactical Retreat',
    description: 'Fall back and regroup. Gain 4 Block. Draw 1 card.',
    energy: 1,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'block', amount: 4 },
      { type: 'draw', amount: 1 },
    ],
    upgradesTo: {
      name: 'Tactical Retreat+',
      description: 'Gain 6 Block. Draw 1 card.',
      effects: [
        { type: 'block', amount: 6 },
        { type: 'draw', amount: 1 },
      ],
    },
  },
  'defense_utility',
  1
)

// --- UTILITY DRAW (1 base, 2 unlock) ---

queueEvergreen(
  {
    id: 'eg_concentrate',
    name: 'Concentrate',
    description: 'Focus your mind. Draw 2 cards.',
    energy: 1,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'draw', amount: 2 }],
    upgradesTo: {
      name: 'Concentrate+',
      description: 'Draw 3 cards.',
      effects: [{ type: 'draw', amount: 3 }],
    },
  },
  'utility_draw',
  1
)

// --- UTILITY ENERGY (1 base, 1 unlock) ---

queueEvergreen(
  {
    id: 'eg_meditation',
    name: 'Meditation',
    description: 'Center yourself. Gain 2 Energy.',
    energy: 0,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'energy', amount: 2, operation: 'gain' }],
    upgradesTo: {
      name: 'Meditation+',
      description: 'Gain 3 Energy.',
      effects: [{ type: 'energy', amount: 3, operation: 'gain' }],
    },
  },
  'utility_energy',
  1
)

// --- POWER BUFF (1 base, 1 unlock) ---

queueEvergreen(
  {
    id: 'eg_flex',
    name: 'Flex',
    description: 'Pump yourself up. Gain 2 Strength this turn.',
    energy: 0,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'applyPower', powerId: 'strengthTemp', amount: 2, target: 'self' }],
    upgradesTo: {
      name: 'Flex+',
      description: 'Gain 3 Strength this turn.',
      effects: [{ type: 'applyPower', powerId: 'strengthTemp', amount: 3, target: 'self' }],
    },
  },
  'power_buff',
  1
)

// ============================================
// UNLOCK POOL (12 cards - progressive unlocks)
// ============================================

// --- ATTACK UTILITY (2 unlock) ---

queueEvergreen(
  {
    id: 'eg_power_surge',
    name: 'Power Surge',
    description: 'Channel raw energy. Deal 7 damage. Gain 1 Energy.',
    energy: 2,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'lightning',
    effects: [
      { type: 'damage', amount: 7, element: 'lightning' },
      { type: 'energy', amount: 1, operation: 'gain' },
    ],
    upgradesTo: {
      name: 'Power Surge+',
      description: 'Deal 10 damage. Gain 1 Energy.',
      effects: [
        { type: 'damage', amount: 10, element: 'lightning' },
        { type: 'energy', amount: 1, operation: 'gain' },
      ],
    },
  },
  'attack_utility',
  2,
  { type: 'totalWins', count: 3 }
)

queueEvergreen(
  {
    id: 'eg_wild_swing',
    name: 'Wild Swing',
    description: 'Reckless but powerful. Discard 1 card. Deal 10 damage.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'discard', target: { from: 'hand', count: 1 } },
      { type: 'damage', amount: 10 },
    ],
    upgradesTo: {
      name: 'Wild Swing+',
      description: 'Discard 1 card. Deal 14 damage.',
      effects: [
        { type: 'discard', target: { from: 'hand', count: 1 } },
        { type: 'damage', amount: 14 },
      ],
    },
  },
  'attack_utility',
  2,
  { type: 'totalWins', count: 5 }
)

// --- ATTACK DEBUFF (1 unlock) ---

queueEvergreen(
  {
    id: 'eg_toxic_stab',
    name: 'Toxic Stab',
    description: 'A venomous strike. Deal 4 damage. Apply 3 Poison.',
    energy: 1,
    theme: 'attack',
    target: 'enemy',
    rarity: 'common',
    element: 'void',
    effects: [
      { type: 'damage', amount: 4, element: 'void' },
      { type: 'applyPower', powerId: 'poison', amount: 3 },
    ],
    upgradesTo: {
      name: 'Toxic Stab+',
      description: 'Deal 6 damage. Apply 4 Poison.',
      effects: [
        { type: 'damage', amount: 6, element: 'void' },
        { type: 'applyPower', powerId: 'poison', amount: 4 },
      ],
    },
  },
  'attack_debuff',
  2,
  { type: 'totalWins', count: 3 }
)

// --- DEFENSE UTILITY (2 unlock) ---

queueEvergreen(
  {
    id: 'eg_second_wind',
    name: 'Second Wind',
    description: 'Catch your breath. Gain 6 Block. Gain 1 Energy.',
    energy: 2,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'block', amount: 6 },
      { type: 'energy', amount: 1, operation: 'gain' },
    ],
    upgradesTo: {
      name: 'Second Wind+',
      description: 'Gain 9 Block. Gain 1 Energy.',
      effects: [
        { type: 'block', amount: 9 },
        { type: 'energy', amount: 1, operation: 'gain' },
      ],
    },
  },
  'defense_utility',
  2,
  { type: 'totalWins', count: 5 }
)

queueEvergreen(
  {
    id: 'eg_bandage',
    name: 'Bandage',
    description: 'Tend to your wounds. Heal 4 HP.',
    energy: 1,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'heal', amount: 4, target: 'self' }],
    upgradesTo: {
      name: 'Bandage+',
      description: 'Heal 6 HP.',
      effects: [{ type: 'heal', amount: 6, target: 'self' }],
    },
  },
  'defense_heal',
  1,
  { type: 'totalWins', count: 1 }
)

// --- UTILITY DRAW (2 unlock) ---

queueEvergreen(
  {
    id: 'eg_foresight',
    name: 'Foresight',
    description: 'Peer into possibilities. Scry 3. Draw 1 card.',
    energy: 1,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'void',
    effects: [
      { type: 'scry', amount: 3 },
      { type: 'draw', amount: 1 },
    ],
    upgradesTo: {
      name: 'Foresight+',
      description: 'Scry 4. Draw 2 cards.',
      effects: [
        { type: 'scry', amount: 4 },
        { type: 'draw', amount: 2 },
      ],
    },
  },
  'utility_draw',
  2,
  { type: 'totalWins', count: 5 }
)

queueEvergreen(
  {
    id: 'eg_recall',
    name: 'Recall',
    description: 'Retrieve a forgotten technique. Put a card from discard on top of deck.',
    energy: 0,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'void',
    effects: [
      {
        type: 'tutor',
        from: 'discardPile',
        amount: 1,
        destination: 'drawPile',
        position: 'top',
      },
    ],
    upgradesTo: {
      name: 'Recall+',
      description: 'Put a card from discard into your hand.',
      effects: [
        {
          type: 'tutor',
          from: 'discardPile',
          amount: 1,
          destination: 'hand',
        },
      ],
    },
  },
  'utility_draw',
  3,
  { type: 'dungeonClear', dungeonId: 'shadow_crypt' }
)

// --- UTILITY ENERGY (1 unlock) ---

queueEvergreen(
  {
    id: 'eg_efficiency',
    name: 'Efficiency',
    description: 'Maximize your resources. Draw 1 card. Gain 1 Energy.',
    energy: 0,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'draw', amount: 1 },
      { type: 'energy', amount: 1, operation: 'gain' },
    ],
    upgradesTo: {
      name: 'Efficiency+',
      description: 'Draw 2 cards. Gain 1 Energy.',
      effects: [
        { type: 'draw', amount: 2 },
        { type: 'energy', amount: 1, operation: 'gain' },
      ],
    },
  },
  'utility_energy',
  2,
  { type: 'totalWins', count: 2 }
)

// --- UTILITY DISCARD (2 unlock) ---

queueEvergreen(
  {
    id: 'eg_gambit',
    name: 'Gambit',
    description: 'Risk for reward. Discard 1 card. Draw 2 cards.',
    energy: 0,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [
      { type: 'discard', target: { from: 'hand', count: 1 } },
      { type: 'draw', amount: 2 },
    ],
    upgradesTo: {
      name: 'Gambit+',
      description: 'Discard 1 card. Draw 3 cards.',
      effects: [
        { type: 'discard', target: { from: 'hand', count: 1 } },
        { type: 'draw', amount: 3 },
      ],
    },
  },
  'utility_discard',
  2,
  { type: 'streakReached', streak: 2 }
)

queueEvergreen(
  {
    id: 'eg_sacrifice',
    name: 'Sacrifice',
    description: 'Burn for power. Exhaust 1 card. Gain 2 Energy.',
    energy: 0,
    theme: 'skill',
    target: 'self',
    rarity: 'common',
    element: 'void',
    effects: [
      { type: 'exhaust', target: { from: 'hand', count: 1 } },
      { type: 'energy', amount: 2, operation: 'gain' },
    ],
    upgradesTo: {
      name: 'Sacrifice+',
      description: 'Exhaust 1 card. Gain 3 Energy.',
      effects: [
        { type: 'exhaust', target: { from: 'hand', count: 1 } },
        { type: 'energy', amount: 3, operation: 'gain' },
      ],
    },
  },
  'utility_discard',
  2,
  { type: 'streakReached', streak: 3 }
)

// --- POWER BUFF (1 unlock) ---

queueEvergreen(
  {
    id: 'eg_fortify',
    name: 'Fortify',
    description: 'Steel yourself. Gain 1 Dexterity.',
    energy: 1,
    theme: 'power',
    target: 'self',
    rarity: 'common',
    element: 'physical',
    effects: [{ type: 'applyPower', powerId: 'dexterity', amount: 1, target: 'self' }],
    upgradesTo: {
      name: 'Fortify+',
      description: 'Gain 2 Dexterity.',
      effects: [{ type: 'applyPower', powerId: 'dexterity', amount: 2, target: 'self' }],
    },
  },
  'power_buff',
  2,
  { type: 'totalWins', count: 2 }
)

// --- POWER DEBUFF (1 unlock) ---

queueEvergreen(
  {
    id: 'eg_intimidate',
    name: 'Intimidate',
    description: 'Crush their spirit. Apply 1 Weak to ALL enemies.',
    energy: 1,
    theme: 'skill',
    target: 'allEnemies',
    rarity: 'common',
    element: 'void',
    effects: [{ type: 'applyPower', powerId: 'weak', amount: 1, target: 'allEnemies' }],
    upgradesTo: {
      name: 'Intimidate+',
      description: 'Apply 2 Weak to ALL enemies.',
      effects: [{ type: 'applyPower', powerId: 'weak', amount: 2, target: 'allEnemies' }],
    },
  },
  'power_debuff',
  2,
  { type: 'totalWins', count: 1 }
)

// ============================================
// EXPORTS
// ============================================

/**
 * Get all evergreen card IDs.
 * Note: Returns empty until initializeEvergreenCards() is called.
 */
export function getAllEvergreenCardIds(): string[] {
  return Array.from(evergreenRegistry.keys())
}

/**
 * Get evergreen card metadata.
 */
export function getEvergreenMeta(cardId: string): CollectionCardMeta | undefined {
  return evergreenRegistry.get(cardId)
}

/**
 * Get all evergreen card metadata.
 */
export function getAllEvergreenMeta(): CollectionCardMeta[] {
  return Array.from(evergreenRegistry.values())
}

/**
 * Get base pool card IDs (always unlocked).
 */
export function getBasePoolCardIds(): string[] {
  return Array.from(evergreenRegistry.entries())
    .filter(([_, meta]) => meta.unlockCondition.type === 'always')
    .map(([id]) => id)
}

/**
 * Get unlock pool card IDs (require unlock conditions).
 */
export function getUnlockPoolCardIds(): string[] {
  return Array.from(evergreenRegistry.entries())
    .filter(([_, meta]) => meta.unlockCondition.type !== 'always')
    .map(([id]) => id)
}

/**
 * Check if an unlock condition is satisfied.
 */
export function isUnlockConditionMet(
  condition: UnlockCondition,
  context: {
    totalWins: number
    currentStreak: number
    clearedDungeons: string[]
    heroAffections: Record<string, number>
    achievements: string[]
  }
): boolean {
  switch (condition.type) {
    case 'always':
      return true
    case 'totalWins':
      return context.totalWins >= condition.count
    case 'streakReached':
      return context.currentStreak >= condition.streak
    case 'dungeonClear':
      return context.clearedDungeons.includes(condition.dungeonId)
    case 'heroAffection':
      return (context.heroAffections[condition.heroId] ?? 0) >= condition.level
    case 'achievement':
      return context.achievements.includes(condition.achievementId)
    default:
      return false
  }
}

/**
 * Get all unlocked collection card IDs based on player progress.
 */
export function getUnlockedCollectionCardIds(context: {
  totalWins: number
  currentStreak: number
  clearedDungeons: string[]
  heroAffections: Record<string, number>
  achievements: string[]
}): string[] {
  return Array.from(evergreenRegistry.entries())
    .filter(([_, meta]) => isUnlockConditionMet(meta.unlockCondition, context))
    .map(([id]) => id)
}
