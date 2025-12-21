// ============================================
// EVERGREEN POOL MANAGEMENT
// ============================================
// Manages the available pool of evergreen cards based on unlock status.

import {
  getAllEvergreenCardIds,
  getBasePoolCardIds,
  getUnlockedEvergreenCardIds,
} from '../evergreen-cards'

/**
 * Get the available evergreen card pool based on player progress.
 * Combines base pool with any unlocked cards.
 */
export function getAvailableEvergreenPool(context: {
  totalWins: number
  currentStreak: number
  clearedDungeons: string[]
  heroAffections: Record<string, number>
  achievements: string[]
}): string[] {
  return getUnlockedEvergreenCardIds(context)
}

/**
 * Get the base evergreen pool (no unlocks required).
 * Used for brand new players with no progression.
 */
export function getBaseEvergreenPool(): string[] {
  return getBasePoolCardIds()
}

/**
 * Get all evergreen card IDs regardless of unlock status.
 * Used for display/collection purposes.
 */
export function getFullEvergreenPool(): string[] {
  return getAllEvergreenCardIds()
}

/**
 * Select random cards from a pool.
 * Does not allow duplicates.
 */
export function selectRandomCards(pool: string[], count: number): string[] {
  if (pool.length === 0) return []
  if (count >= pool.length) return [...pool]

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Select random cards with possible duplicates.
 * Allows the same card to appear multiple times.
 */
export function selectRandomCardsWithDuplicates(
  pool: string[],
  count: number,
  maxCopiesPerCard: number = 4
): string[] {
  if (pool.length === 0) return []

  const result: string[] = []
  const copies: Record<string, number> = {}

  // Create a mutable pool that respects max copies
  const availablePool = [...pool]

  for (let i = 0; i < count && availablePool.length > 0; i++) {
    const idx = Math.floor(Math.random() * availablePool.length)
    const cardId = availablePool[idx]

    result.push(cardId)
    copies[cardId] = (copies[cardId] || 0) + 1

    // Remove from available if max copies reached
    if (copies[cardId] >= maxCopiesPerCard) {
      availablePool.splice(idx, 1)
    }
  }

  return result
}
