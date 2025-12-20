// ============================================
// STREAK SYSTEM
// ============================================
// Parabolic streak multipliers and milestone tracking.
// Streaks provide meta-only rewards (gold, unlocks, modifiers).
// No in-run power boost to prevent snowballing.

import type {
  StreakState,
  StreakMultiplier,
  StreakMilestone,
  StreakMilestoneReward,
} from '../types'
import { STREAK_MILESTONES, DEFAULT_STREAK_STATE } from '../types'

// ============================================
// STREAK MULTIPLIER CALCULATION
// ============================================

/**
 * Calculate streak multiplier using parabolic formula:
 * M(s) = 1 + 0.15*s + 0.05*s²
 *
 * | Streak | Multiplier |
 * |--------|------------|
 * | 0      | 1.0x       |
 * | 1      | 1.2x       |
 * | 2      | 1.5x       |
 * | 3      | 1.9x       |
 * | 5      | 2.5x       |
 * | 7      | 3.3x       |
 * | 10     | 6.5x       |
 * | 15     | 14.0x      |
 * | 20     | 24.0x      |
 */
export function calculateStreakMultiplier(streak: number): number {
  if (streak <= 0) return 1
  return 1 + 0.15 * streak + 0.05 * streak * streak
}

/**
 * Calculate full streak multipliers for all reward types.
 */
export function getStreakMultipliers(streak: number): StreakMultiplier {
  const baseMultiplier = calculateStreakMultiplier(streak)

  return {
    gold: baseMultiplier,
    // Unlock chance scales slower than gold
    unlockChance: Math.min(0.5, 0.05 + streak * 0.03),
    // Rare modifier chance
    rareModifierChance: Math.min(0.3, streak * 0.02),
    // Legendary modifier chance (very rare)
    legendaryModifierChance: Math.min(0.1, Math.max(0, (streak - 10) * 0.01)),
  }
}

// ============================================
// MILESTONE DETECTION
// ============================================

/**
 * Get the current milestone for a streak value.
 * Returns the highest milestone reached.
 */
export function getCurrentMilestone(streak: number): StreakMilestone | null {
  // Milestones are sorted by threshold ascending, we want highest reached
  let reached: StreakMilestone | null = null

  for (const milestone of STREAK_MILESTONES) {
    if (streak >= milestone.threshold) {
      reached = milestone
    }
  }

  return reached
}

/**
 * Get the next milestone to reach.
 */
export function getNextMilestone(streak: number): StreakMilestone | null {
  for (const milestone of STREAK_MILESTONES) {
    if (streak < milestone.threshold) {
      return milestone
    }
  }
  return null // Already at max
}

/**
 * Check if a new milestone was just reached.
 */
export function checkMilestoneReached(
  previousStreak: number,
  newStreak: number
): StreakMilestone | null {
  for (const milestone of STREAK_MILESTONES) {
    if (previousStreak < milestone.threshold && newStreak >= milestone.threshold) {
      return milestone
    }
  }
  return null
}

/**
 * Get all milestones reached at or below a streak value.
 */
export function getMilestonesReached(streak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter((m) => streak >= m.threshold)
}

/**
 * Get all milestones not yet reached.
 */
export function getMilestonesRemaining(streak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter((m) => streak < m.threshold)
}

// ============================================
// STREAK STATE HELPERS
// ============================================

/**
 * Create a new streak state after a successful clear.
 */
export function incrementStreak(state: StreakState): StreakState {
  const newStreak = state.currentStreak + 1
  return {
    currentStreak: newStreak,
    bestStreak: Math.max(state.bestStreak, newStreak),
    lastClearAt: Date.now(),
    streakBrokenAt: null,
    totalClears: state.totalClears + 1,
  }
}

/**
 * Create a new streak state after death/abandon.
 */
export function breakStreak(state: StreakState): StreakState {
  return {
    ...state,
    currentStreak: 0,
    streakBrokenAt: Date.now(),
  }
}

/**
 * Create fresh streak state.
 */
export function createFreshStreakState(): StreakState {
  return { ...DEFAULT_STREAK_STATE }
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Format streak for display with milestone info.
 */
export function formatStreakDisplay(streak: number): {
  value: number
  multiplier: string
  milestone: StreakMilestone | null
  nextMilestone: StreakMilestone | null
  progressToNext: number
} {
  const milestone = getCurrentMilestone(streak)
  const nextMilestone = getNextMilestone(streak)
  const multiplier = calculateStreakMultiplier(streak)

  // Calculate progress to next milestone
  let progressToNext = 1
  if (nextMilestone) {
    const prevThreshold = milestone?.threshold ?? 0
    const range = nextMilestone.threshold - prevThreshold
    const current = streak - prevThreshold
    progressToNext = range > 0 ? current / range : 0
  }

  return {
    value: streak,
    multiplier: `${multiplier.toFixed(1)}x`,
    milestone,
    nextMilestone,
    progressToNext,
  }
}

/**
 * Get milestone reward description for UI.
 */
export function getRewardDescription(reward: StreakMilestoneReward): string {
  switch (reward.type) {
    case 'modifier':
      return `${reward.rarity ?? 'random'} modifier`
    case 'card_unlock':
      return 'card unlock'
    case 'hero_unlock':
      return 'hero unlock'
    case 'gold':
      return `${reward.amount ?? 0} gold`
    case 'cosmetic':
      return 'cosmetic item'
    default:
      return 'mystery reward'
  }
}

/**
 * Format multiplier for display (e.g., "2.5" instead of "2.500000")
 */
export function formatMultiplier(multiplier: number): string {
  return multiplier.toFixed(1).replace(/\.0$/, '')
}

/**
 * Get milestone info for streak display (alias for getCurrentMilestone).
 * Returns milestone with name and reward description.
 */
export function getStreakMilestone(streak: number): { name: string; reward: string } | null {
  const milestone = getCurrentMilestone(streak)
  if (!milestone) return null

  return {
    name: milestone.label,
    reward: getRewardDescription(milestone.reward),
  }
}
