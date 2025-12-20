// ============================================
// STREAK & HEAT SYSTEM
// ============================================
// Tracks consecutive dungeon deck wins and accumulated difficulty.

// ============================================
// STREAK STATE
// ============================================

/**
 * Tracks player's streak of consecutive dungeon deck clears.
 * Streaks provide meta-only rewards (gold, unlocks, modifiers).
 * No in-run power boost to prevent snowballing.
 */
export interface StreakState {
  /** Current consecutive deck clears without death */
  currentStreak: number

  /** Best streak ever achieved (all-time record) */
  bestStreak: number

  /** Timestamp of last successful deck clear */
  lastClearAt: number | null

  /** Timestamp when streak was broken (for UI feedback) */
  streakBrokenAt: number | null

  /** Total deck clears lifetime */
  totalClears: number
}

/**
 * Multipliers applied based on current streak.
 * Calculated using parabolic formula: M(s) = 1 + 0.15*s + 0.05*s²
 */
export interface StreakMultiplier {
  /** Gold reward multiplier */
  gold: number

  /** Chance for unlock drops (0-1) */
  unlockChance: number

  /** Chance for rare modifier drops (0-1) */
  rareModifierChance: number

  /** Chance for legendary modifier drops (0-1) */
  legendaryModifierChance: number
}

/**
 * Streak milestone definition.
 * Reached when currentStreak >= threshold.
 */
export interface StreakMilestone {
  threshold: number
  label: string
  reward: StreakMilestoneReward
  icon?: string
  color?: string
}

/**
 * Reward granted when reaching a streak milestone
 */
export interface StreakMilestoneReward {
  type: 'modifier' | 'card_unlock' | 'hero_unlock' | 'gold' | 'cosmetic'
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary'
  id?: string    // Specific unlock ID
  amount?: number // For gold rewards
}

// ============================================
// HEAT STATE
// ============================================

/**
 * Heat is accumulated difficulty that scales with modifier use.
 * Prevents runaway "juicing" by making heavily modified runs harder.
 * Resets on death (along with deck reset).
 */
export interface HeatState {
  /** Current heat level (0-100 scale) */
  current: number

  /** Highest heat reached this session */
  maxReached: number

  /** Base heat from modifier DV contributions */
  baseHeat: number

  /** Breakdown of heat by modifier */
  modifierContributions: Record<string, number>
}

/**
 * Effects applied based on current heat level.
 * Scales enemy stats and reduces safe outcomes.
 */
export interface HeatEffects {
  /** Enemy HP multiplier (1.0 = no change) */
  enemyHealthMultiplier: number

  /** Enemy damage multiplier */
  enemyDamageMultiplier: number

  /** Enemy starting strength bonus */
  enemyStrengthBonus: number

  /** Additional elite encounter chance (0-1) */
  eliteChanceBoost: number

  /** Campfire rooms to remove */
  campfireReduction: number

  /** Treasure rooms to remove */
  treasureReduction: number

  /** Whether boss gains phase 2 */
  bossPhaseTwo: boolean
}

/**
 * Heat tier thresholds and labels
 */
export interface HeatTier {
  min: number
  max: number
  label: string
  color: string
  effects: Partial<HeatEffects>
}

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  bestStreak: 0,
  lastClearAt: null,
  streakBrokenAt: null,
  totalClears: 0,
}

export const DEFAULT_HEAT_STATE: HeatState = {
  current: 0,
  maxReached: 0,
  baseHeat: 0,
  modifierContributions: {},
}

/**
 * Heat tier definitions
 */
export const HEAT_TIERS: HeatTier[] = [
  {
    min: 0,
    max: 20,
    label: 'Safe',
    color: '#4ade80', // green-400
    effects: {},
  },
  {
    min: 21,
    max: 40,
    label: 'Warm',
    color: '#facc15', // yellow-400
    effects: {
      enemyHealthMultiplier: 1.05,
    },
  },
  {
    min: 41,
    max: 60,
    label: 'Hot',
    color: '#fb923c', // orange-400
    effects: {
      enemyHealthMultiplier: 1.10,
      enemyStrengthBonus: 1,
    },
  },
  {
    min: 61,
    max: 80,
    label: 'Blazing',
    color: '#f87171', // red-400
    effects: {
      enemyHealthMultiplier: 1.15,
      enemyStrengthBonus: 2,
      campfireReduction: 1,
    },
  },
  {
    min: 81,
    max: 100,
    label: 'Infernal',
    color: '#dc2626', // red-600
    effects: {
      enemyHealthMultiplier: 1.25,
      enemyStrengthBonus: 3,
      campfireReduction: 1,
      treasureReduction: 1,
      bossPhaseTwo: true,
    },
  },
]

/**
 * Streak milestone definitions
 */
export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    threshold: 3,
    label: 'Hot Streak',
    icon: '🔥',
    color: '#facc15',
    reward: { type: 'modifier', rarity: 'common' },
  },
  {
    threshold: 5,
    label: 'Burning',
    icon: '🔥🔥',
    color: '#fb923c',
    reward: { type: 'modifier', rarity: 'uncommon' },
  },
  {
    threshold: 7,
    label: 'Inferno',
    icon: '🔥🔥🔥',
    color: '#f87171',
    reward: { type: 'card_unlock' },
  },
  {
    threshold: 10,
    label: 'Legendary',
    icon: '⭐',
    color: '#a855f7',
    reward: { type: 'modifier', rarity: 'rare' },
  },
  {
    threshold: 15,
    label: 'Mythic',
    icon: '👑',
    color: '#fbbf24',
    reward: { type: 'hero_unlock' },
  },
  {
    threshold: 20,
    label: 'Transcendent',
    icon: '💎',
    color: '#22d3ee',
    reward: { type: 'modifier', rarity: 'legendary' },
  },
]
