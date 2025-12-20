// ============================================
// DUNGEON FLOW HANDLERS
// ============================================
// Orchestrates dungeon run lifecycle with run-lock integration.
// Connects room handlers with streak/heat/rewards systems.

import type { RunState, RoomCard, ModifierInstance, RelicInstance } from '../../types'
import {
  lockInRun,
  drawRoomChoices,
  selectRoom,
  completeRoom,
  handleDeath,
  abandonRun,
  getAbandonPenalty,
  clearCompletedRun,
  getLockedRun,
  hasActiveRun,
  getCurrentStreak,
} from '../run-lock'
import { generateRunRewards, generateLossConsolation } from '../rewards'
import { useRunLockStore } from '../../stores/runLockStore'

// ============================================
// RUN LIFECYCLE
// ============================================

/**
 * Start a new dungeon run with lock-in mechanics.
 * Validates no active run exists before locking.
 */
export function startDungeonRun(params: {
  dungeonDeckId: string
  dungeonDeck: RoomCard[]
  modifiers: ModifierInstance[]
  player: {
    gold: number
    maxHealth: number
    currentHealth: number
    relics: RelicInstance[]
    deck: string[]
    heroId: string
  }
}): {
  success: boolean
  runId?: string
  error?: string
} {
  return lockInRun(params)
}

/**
 * Get room choices for current position in dungeon.
 * Returns up to 3 rooms from the locked dungeon deck.
 */
export function getDungeonRoomChoices(): {
  success: boolean
  choices?: RoomCard[]
  error?: string
} {
  return drawRoomChoices()
}

/**
 * Select a room from available choices.
 * Updates locked run state and returns selected room.
 */
export function selectDungeonRoom(roomUid: string): {
  success: boolean
  selectedRoom?: RoomCard
  error?: string
} {
  return selectRoom(roomUid)
}

// ============================================
// ROOM COMPLETION
// ============================================

/**
 * Record room completion with stats.
 * Automatically triggers dungeon completion if deck is empty.
 */
export function completeDungeonRoom(params: {
  roomUid: string
  goldEarned?: number
  enemiesKilled?: number
  cardsPlayed?: number
  damageDealt?: number
  damageTaken?: number
}): {
  success: boolean
  dungeonComplete: boolean
  rewards?: ReturnType<typeof generateRunRewards>
  error?: string
} {
  const result = completeRoom(params)

  if (!result.success) {
    return { success: false, dungeonComplete: false, error: result.error }
  }

  // Check if dungeon is complete
  const lockedRun = getLockedRun()
  if (lockedRun && lockedRun.status === 'completed') {
    const store = useRunLockStore.getState()
    const rewards = generateRunRewards({
      progress: lockedRun.progress,
      heat: store.heat,
      modifiers: lockedRun.activeModifiers,
      previousStreak: lockedRun.streakAtStart,
      newStreak: store.streak.currentStreak,
    })

    return {
      success: true,
      dungeonComplete: true,
      rewards,
    }
  }

  return { success: true, dungeonComplete: false }
}

// ============================================
// RUN END CONDITIONS
// ============================================

/**
 * Handle player death during run.
 * Breaks streak, resets heat, marks run as failed.
 */
export function handlePlayerDeath(): {
  success: boolean
  consolation?: { gold: number; message: string }
  error?: string
} {
  const lockedRun = getLockedRun()
  if (!lockedRun) {
    return { success: false, error: 'No active run' }
  }

  const store = useRunLockStore.getState()
  const consolation = generateLossConsolation({
    progress: lockedRun.progress,
    heat: store.heat,
  })

  const result = handleDeath()

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, consolation }
}

/**
 * Preview abandon cost without committing.
 */
export function previewAbandonCost(currentGold: number): {
  finalCost: number
  canAfford: boolean
  progressPercent: number
} {
  const penalty = getAbandonPenalty(currentGold)
  return {
    finalCost: penalty.finalCost,
    canAfford: penalty.canAfford,
    progressPercent: penalty.progressPercent,
  }
}

/**
 * Abandon current run with gold penalty.
 * Breaks streak, deducts gold, marks run as abandoned.
 */
export function abandonDungeonRun(currentGold: number): {
  success: boolean
  cost?: number
  error?: string
} {
  return abandonRun(currentGold)
}

// ============================================
// REWARD CLAIMING
// ============================================

/**
 * Claim rewards and clear completed run state.
 * Call after player has seen reward screen.
 */
export function claimRewardsAndClear(): void {
  clearCompletedRun()
}

// ============================================
// STATE QUERIES
// ============================================

/**
 * Check if there's an active locked run.
 */
export function hasLockedRun(): boolean {
  return hasActiveRun()
}

/**
 * Get current player streak.
 */
export function getPlayerStreak(): number {
  return getCurrentStreak()
}

/**
 * Get locked run info for UI display.
 */
export function getLockedRunInfo(): {
  runId: string
  floor: number
  roomsCleared: number
  totalRooms: number
  heatAtStart: number
  streakAtStart: number
  modifierCount: number
} | null {
  const run = getLockedRun()
  if (!run || run.status !== 'active') return null

  return {
    runId: run.runId,
    floor: run.progress.floor,
    roomsCleared: run.progress.roomsCleared.length,
    totalRooms: run.progress.totalRooms,
    heatAtStart: run.heatAtStart,
    streakAtStart: run.streakAtStart,
    modifierCount: run.activeModifiers.length,
  }
}

// ============================================
// RUN STATE SYNC
// ============================================

/**
 * Sync locked run state with RunState.
 * Used when recovering from browser close.
 */
export function syncLockedRunToState(
  currentState: RunState
): RunState {
  const lockedRun = getLockedRun()
  if (!lockedRun || lockedRun.status !== 'active') {
    return currentState
  }

  // Sync floor from locked run progress
  return {
    ...currentState,
    floor: lockedRun.progress.floor,
    dungeonDeckId: lockedRun.dungeonDeckId,
    // Dungeon deck from locked state
    dungeonDeck: lockedRun.dungeonDeckCurrent,
    // Room choices if any pending
    roomChoices: lockedRun.roomChoices,
  }
}
