// Room and dungeon handlers
import type { RunState, ModifierInstance } from '../../types'
import {
  completeDungeonDeck,
  updateOwnedDungeonDeck,
  getOwnedDungeonDeck,
} from '../../stores/db'
import { applyGoldMultiplier } from '../modifier-resolver'

export function handleSelectRoom(draft: RunState, roomUid: string): void {
  const room = draft.roomChoices.find((r) => r.uid === roomUid)
  if (!room) return

  draft.roomChoices = []
  draft.gamePhase = 'combat'
}

export function handleDealRoomChoices(draft: RunState): void {
  const choices: typeof draft.roomChoices = []

  for (let i = 0; i < 3 && draft.dungeonDeck.length > 0; i++) {
    const room = draft.dungeonDeck.pop()
    if (room) {
      room.revealed = true
      choices.push(room)
    }
  }

  draft.roomChoices = choices
  draft.gamePhase = 'roomSelect'
}

// ============================================
// ROGUELIKE DUNGEON OWNERSHIP MECHANICS
// ============================================

/**
 * Calculate gold reward for beating a dungeon based on difficulty.
 * Higher difficulty = better rewards.
 */
function calculateDungeonReward(difficulty: number, floor: number): number {
  const baseReward = 50
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.5 // 1x, 1.5x, 2x, 2.5x, 3x
  const floorBonus = floor * 5
  return Math.floor((baseReward + floorBonus) * difficultyMultiplier)
}

/**
 * Calculate gold cost for abandoning a dungeon.
 * Early abandon = expensive, late abandon = cheaper.
 * Formula: baseCost * difficulty * (1 - progressPercent)
 */
function calculateAbandonCost(
  difficulty: number,
  currentFloor: number,
  totalFloors: number
): number {
  const baseCost = 25
  const progressPercent = totalFloors > 0 ? currentFloor / totalFloors : 0
  const cost = baseCost * difficulty * (1 - progressPercent)
  return Math.floor(Math.max(0, cost))
}

/**
 * Handle when player defeats the final boss and beats the dungeon.
 * - Awards gold based on difficulty
 * - Marks dungeon as 'beaten' in player's collection
 * - Returns the gold reward amount (with modifier multipliers applied)
 */
export async function handleDungeonBeaten(
  state: RunState,
  difficulty: number = 3,
  modifiers: ModifierInstance[] = []
): Promise<{ goldReward: number }> {
  const baseReward = calculateDungeonReward(difficulty, state.floor)
  const goldReward = applyGoldMultiplier(baseReward, modifiers)

  // Update dungeon ownership status if tracking
  if (state.dungeonDeckId) {
    await completeDungeonDeck(state.dungeonDeckId, 'beaten', state.floor)
  }

  return { goldReward }
}

/**
 * Handle when player chooses to abandon a dungeon run.
 * - Deducts gold based on difficulty and progress
 * - Marks dungeon as 'abandoned' in player's collection
 * - Returns the gold cost (may be 0 if player has no gold)
 */
export async function handleDungeonAbandoned(
  state: RunState,
  difficulty: number = 3,
  totalFloors: number = 15
): Promise<{ goldCost: number; actualDeducted: number }> {
  const goldCost = calculateAbandonCost(difficulty, state.floor, totalFloors)
  const actualDeducted = Math.min(goldCost, state.gold)

  // Update dungeon ownership status if tracking
  if (state.dungeonDeckId) {
    await completeDungeonDeck(state.dungeonDeckId, 'abandoned', state.floor)
  }

  return { goldCost, actualDeducted }
}

/**
 * Handle when player dies during a dungeon run.
 * - Marks dungeon as 'lost' in player's collection (deck is removed)
 * - Returns death penalty info
 *
 * Note: Additional death penalties (card destruction, gold loss) are
 * applied by the calling code based on game mode/difficulty.
 */
export async function handlePlayerDeath(
  state: RunState
): Promise<{ deckLost: boolean; finalFloor: number }> {
  // Update dungeon ownership status if tracking
  if (state.dungeonDeckId) {
    await completeDungeonDeck(state.dungeonDeckId, 'lost', state.floor)
  }

  return {
    deckLost: !!state.dungeonDeckId,
    finalFloor: state.floor,
  }
}

/**
 * Start a dungeon run - marks the dungeon as 'active' and increments attempt count.
 */
export async function handleStartDungeonRun(dungeonDeckId: string): Promise<void> {
  const owned = await getOwnedDungeonDeck(dungeonDeckId)
  if (!owned) return

  await updateOwnedDungeonDeck(dungeonDeckId, {
    status: 'active',
    attemptsCount: owned.attemptsCount + 1,
  })
}

/**
 * Get abandon cost preview without actually abandoning.
 * Useful for showing player the cost before confirming.
 */
export function getAbandonCostPreview(
  currentFloor: number,
  difficulty: number = 3,
  totalFloors: number = 15
): number {
  return calculateAbandonCost(difficulty, currentFloor, totalFloors)
}
