// ============================================
// WIN REWARDS SYSTEM
// ============================================
// Generates rewards after successful dungeon deck completion.
// Tiered payouts based on streak, heat, and modifiers used.

import type {
  RunProgress,
  RunRewards,
  StreakMilestoneReward,
  ModifierInstance,
  HeatState,
  CardRarity,
  CardDefinition,
} from '../types'
import { calculateStreakMultiplier, checkMilestoneReached } from './streak'
import { getModifierDefinition } from './modifiers'
import { getCardDefinition } from './cards'
import { getUnlockedCollectionCardIds } from '../stores/db'

// ============================================
// BASE REWARD VALUES
// ============================================

const BASE_REWARDS = {
  // Gold rewards
  combatGold: 15,      // Per combat room cleared
  eliteGold: 40,       // Per elite defeated
  bossGold: 100,       // Boss kill bonus
  completionBonus: 75, // Dungeon completion bonus

  // Heat bonus multipliers
  heatBonusPerLevel: 0.01, // +1% gold per heat level

  // Modifier bonus (from reward value)
  modifierRewardMultiplier: 0.02, // 2% gold per point of total RV
} as const

// ============================================
// CARD REWARD POOL (Collection-Based)
// ============================================

/** Rarity tiers for floor gating */
const RARITY_TIERS: Record<string, CardRarity[]> = {
  early: ['common'],                                    // Floor 1-4
  mid: ['common', 'uncommon'],                          // Floor 5-9
  late: ['common', 'uncommon', 'rare', 'epic'],         // Floor 10-14
  endgame: ['common', 'uncommon', 'rare', 'epic', 'ultra-rare', 'legendary'], // Floor 15+
}

/**
 * Get allowed rarities based on current floor.
 * Higher floors unlock rarer cards as rewards.
 */
export function getAllowedRarities(floor: number): CardRarity[] {
  if (floor >= 15) return RARITY_TIERS.endgame
  if (floor >= 10) return RARITY_TIERS.late
  if (floor >= 5) return RARITY_TIERS.mid
  return RARITY_TIERS.early
}

/**
 * Get card reward pool from player's unlocked collection.
 * Filters by floor-appropriate rarity and excludes cards already in run deck.
 */
export async function getCardRewardPool(params: {
  runDeckCardIds: string[]
  floor: number
  dungeonId?: string
}): Promise<CardDefinition[]> {
  const { runDeckCardIds, floor, dungeonId } = params

  // Get all unlocked cards from collection
  const unlockedCardIds = await getUnlockedCollectionCardIds()

  // Get allowed rarities for this floor
  const allowedRarities = getAllowedRarities(floor)

  // Build set of cards already in deck for fast lookup
  const deckCardSet = new Set(runDeckCardIds)

  // Filter collection to valid reward pool
  const pool: CardDefinition[] = []

  for (const cardId of unlockedCardIds) {
    // Skip cards already in run deck
    if (deckCardSet.has(cardId)) continue

    const def = getCardDefinition(cardId)
    if (!def) continue

    // Skip non-collectible cards (hero, enemy, status, curse)
    if (['hero', 'enemy', 'status', 'curse'].includes(def.theme)) continue

    // Check rarity is allowed for this floor
    const cardRarity = def.rarity ?? 'common'
    if (!allowedRarities.includes(cardRarity)) continue

    // Optional: filter by dungeon theme affinity
    // Future: dungeonId could boost certain elements/themes

    pool.push(def)
  }

  return pool
}

/**
 * Generate card reward choices from the reward pool.
 * Returns N cards weighted by rarity (rarer = less likely).
 */
export async function generateCardRewards(params: {
  runDeckCardIds: string[]
  floor: number
  count?: number
  dungeonId?: string
}): Promise<CardDefinition[]> {
  const { runDeckCardIds, floor, count = 3, dungeonId } = params

  const pool = await getCardRewardPool({ runDeckCardIds, floor, dungeonId })

  if (pool.length === 0) return []
  if (pool.length <= count) return pool

  // Weight by rarity (common more likely than rare)
  const weights = pool.map(card => {
    const rarity = card.rarity ?? 'common'
    return getRarityWeight(rarity)
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const selected: CardDefinition[] = []
  const usedIndices = new Set<number>()

  // Weighted random selection without replacement
  for (let i = 0; i < count && usedIndices.size < pool.length; i++) {
    let roll = Math.random() * totalWeight

    for (let j = 0; j < pool.length; j++) {
      if (usedIndices.has(j)) continue

      roll -= weights[j]
      if (roll <= 0) {
        selected.push(pool[j])
        usedIndices.add(j)
        break
      }
    }
  }

  return selected
}

/** Rarity weight for reward selection (higher = more common in rewards) */
function getRarityWeight(rarity: CardRarity): number {
  switch (rarity) {
    case 'common': return 100
    case 'uncommon': return 60
    case 'rare': return 30
    case 'epic': return 15
    case 'ultra-rare': return 8
    case 'legendary': return 4
    case 'mythic': return 2
    case 'ancient': return 1
    default: return 50
  }
}

// ============================================
// REWARD CALCULATION
// ============================================

/**
 * Calculate base gold from run progress.
 */
export function calculateBaseGold(progress: RunProgress): number {
  // Estimate combat types from rooms cleared
  // This is simplified - in practice we'd track room types
  const roomsCleared = progress.roomsCleared.length
  const estimatedCombats = Math.floor(roomsCleared * 0.6)
  const estimatedElites = Math.floor(roomsCleared * 0.15)
  const bossDefeated = progress.roomsRemaining === 0 ? 1 : 0

  const combatGold = estimatedCombats * BASE_REWARDS.combatGold
  const eliteGold = estimatedElites * BASE_REWARDS.eliteGold
  const bossGold = bossDefeated * BASE_REWARDS.bossGold
  const completionBonus = bossDefeated * BASE_REWARDS.completionBonus

  // Add gold earned during run
  return progress.goldEarned + combatGold + eliteGold + bossGold + completionBonus
}

/**
 * Calculate heat bonus multiplier.
 * Higher heat = more gold reward for taking on difficulty.
 */
export function calculateHeatBonus(heat: HeatState): number {
  return 1 + heat.current * BASE_REWARDS.heatBonusPerLevel
}

/**
 * Calculate modifier bonus from total reward value.
 */
export function calculateModifierBonus(modifiers: ModifierInstance[]): number {
  let totalRV = 0

  for (const instance of modifiers) {
    const definition = getModifierDefinition(instance.definitionId)
    if (definition) {
      totalRV += definition.rewardValue
    }
  }

  return 1 + totalRV * BASE_REWARDS.modifierRewardMultiplier
}

/**
 * Generate complete rewards for a successful run.
 */
export function generateRunRewards(params: {
  progress: RunProgress
  heat: HeatState
  modifiers: ModifierInstance[]
  previousStreak: number
  newStreak: number
}): RunRewards {
  const { progress, heat, modifiers, previousStreak, newStreak } = params

  // Calculate gold with all multipliers
  const baseGold = calculateBaseGold(progress)
  const streakMultiplier = calculateStreakMultiplier(newStreak)
  const heatBonus = calculateHeatBonus(heat)
  const modifierBonus = calculateModifierBonus(modifiers)

  const totalMultiplier = streakMultiplier * heatBonus * modifierBonus
  const totalGold = Math.floor(baseGold * totalMultiplier)

  // Check for milestone rewards
  const milestoneRewards: RunRewards['milestoneRewards'] = []
  const reachedMilestone = checkMilestoneReached(previousStreak, newStreak)

  if (reachedMilestone) {
    milestoneRewards.push({
      milestone: reachedMilestone.label,
      reward: formatMilestoneReward(reachedMilestone.reward),
    })
  }

  // Determine unlocks based on streak
  const cardUnlocks = rollCardUnlocks(newStreak)
  const modifierUnlocks = rollModifierUnlocks(newStreak)
  const heroUnlocks = rollHeroUnlocks(newStreak)

  return {
    baseGold,
    streakMultiplier,
    totalGold,
    cardUnlocks,
    modifierUnlocks,
    heroUnlocks,
    milestoneRewards,
  }
}

// ============================================
// UNLOCK ROLLS
// ============================================

/**
 * Roll for potential card unlocks based on streak.
 */
function rollCardUnlocks(streak: number): string[] {
  const unlocks: string[] = []

  // Base 5% chance + 3% per streak
  const chance = 0.05 + streak * 0.03

  if (Math.random() < chance) {
    // In practice, this would pick from a pool of unlockable cards
    // For now, return empty - will be wired up in Phase 8
  }

  return unlocks
}

/**
 * Roll for potential modifier unlocks based on streak.
 */
function rollModifierUnlocks(streak: number): string[] {
  const unlocks: string[] = []

  // Higher streak = better modifier rarity chances
  const rareChance = streak * 0.02
  const legendaryChance = Math.max(0, (streak - 10) * 0.01)

  if (streak >= 5 && Math.random() < rareChance) {
    // Would unlock a rare modifier
  }

  if (streak >= 10 && Math.random() < legendaryChance) {
    // Would unlock a legendary modifier
  }

  return unlocks
}

/**
 * Roll for potential hero unlocks (very rare, milestone-based).
 */
function rollHeroUnlocks(streak: number): string[] {
  const unlocks: string[] = []

  // Heroes only unlock at specific milestones (15+)
  if (streak >= 15 && Math.random() < 0.1) {
    // Would unlock a new hero
  }

  return unlocks
}

/**
 * Format milestone reward for display.
 */
function formatMilestoneReward(reward: StreakMilestoneReward): string {
  switch (reward.type) {
    case 'modifier':
      return `${reward.rarity ?? 'random'} modifier unlocked`
    case 'card_unlock':
      return 'new card unlocked'
    case 'hero_unlock':
      return 'new hero unlocked'
    case 'gold':
      return `${reward.amount ?? 0} bonus gold`
    case 'cosmetic':
      return 'cosmetic unlocked'
    default:
      return 'mystery reward'
  }
}

// ============================================
// LOSS REWARDS (Consolation)
// ============================================

/**
 * Generate consolation rewards for a failed run.
 * Much smaller than win rewards, but acknowledges effort.
 */
export function generateLossConsolation(params: {
  progress: RunProgress
  heat: HeatState
}): { gold: number; message: string } {
  const { progress, heat } = params

  // Get ~20% of what would have been earned
  const baseGold = Math.floor(progress.goldEarned * 0.2)
  const heatBonus = 1 + heat.current * 0.005 // Smaller heat bonus

  const gold = Math.floor(baseGold * heatBonus)

  // Encouraging message based on progress
  const progressPercent = progress.totalRooms > 0
    ? (progress.roomsCleared.length / progress.totalRooms) * 100
    : 0

  let message: string
  if (progressPercent >= 80) {
    message = 'So close! The dungeon remembers your courage.'
  } else if (progressPercent >= 50) {
    message = 'A valiant effort. The path grows clearer.'
  } else if (progressPercent >= 25) {
    message = 'Every attempt teaches something new.'
  } else {
    message = 'The dungeon claims another. Rise again.'
  }

  return { gold, message }
}

// ============================================
// ABANDON COST
// ============================================

/**
 * Calculate the cost to abandon an active run.
 * Cost = baseCost × heatLevel × (1 - progressPercent)
 */
export function calculateAbandonCost(params: {
  heat: HeatState
  roomsCleared: number
  totalRooms: number
  baseCost?: number
}): {
  cost: number
  progressDiscount: number
  heatPenalty: number
} {
  const { heat, roomsCleared, totalRooms, baseCost = 50 } = params

  const progressPercent = totalRooms > 0 ? roomsCleared / totalRooms : 0
  const progressDiscount = progressPercent // 0-1

  // Heat adds to cost (1% per heat level)
  const heatPenalty = 1 + heat.current * 0.01

  const cost = Math.floor(baseCost * heatPenalty * (1 - progressDiscount))

  return {
    cost: Math.max(0, cost),
    progressDiscount,
    heatPenalty,
  }
}
