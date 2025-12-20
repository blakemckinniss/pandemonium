// ============================================
// RUN LOCK MANAGER
// ============================================
// Business logic for locked-in dungeon runs.
// Wraps runLockStore with validation and game flow logic.

import type {
  LockedRunState,
  RoomCard,
  ModifierInstance,
  RelicInstance,
  PlayerSnapshot,
  RunProgress,
  AbandonPenalty,
  RunState,
} from '../types'
import { useRunLockStore } from '../stores/runLockStore'
import { calculateTotalHeat } from './heat'
import { createCardInstance } from './actions'

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that a run can be locked (no active run exists).
 */
export function canLockNewRun(): { valid: boolean; reason?: string } {
  const store = useRunLockStore.getState()

  if (store.hasActiveRun()) {
    return { valid: false, reason: 'An active run is already in progress' }
  }

  return { valid: true }
}

/**
 * Validate that the current run can continue.
 */
export function validateActiveRun(): { valid: boolean; run?: LockedRunState; reason?: string } {
  const { lockedRun } = useRunLockStore.getState()

  if (!lockedRun) {
    return { valid: false, reason: 'No active run' }
  }

  if (lockedRun.status !== 'active') {
    return { valid: false, reason: `Run is ${lockedRun.status}` }
  }

  return { valid: true, run: lockedRun }
}

// ============================================
// RUN LIFECYCLE
// ============================================

/**
 * Lock in a new dungeon run.
 * This commits the player to completing or failing the run.
 */
export function lockInRun(params: {
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
}): { success: boolean; runId?: string; error?: string } {
  const validation = canLockNewRun()
  if (!validation.valid) {
    return { success: false, error: validation.reason }
  }

  const { dungeonDeckId, dungeonDeck, modifiers, player } = params
  const store = useRunLockStore.getState()

  // Calculate starting heat from modifiers
  const heat = calculateTotalHeat(modifiers)
  store.setHeat(heat)

  // Create player snapshot
  const playerSnapshot: PlayerSnapshot = {
    gold: player.gold,
    maxHealth: player.maxHealth,
    currentHealth: player.currentHealth,
    relicIds: player.relics.map((r) => r.definitionId),
    deckCardIds: player.deck,
    heroId: player.heroId,
  }

  // Lock the run
  store.lockRun({
    dungeonDeckId,
    dungeonDeckSnapshot: dungeonDeck,
    activeModifiers: modifiers,
    playerSnapshot,
    currentRelics: player.relics,
    currentDeck: player.deck,
    heatAtStart: heat.current,
    streakAtStart: store.streak.currentStreak,
    totalRooms: dungeonDeck.length,
  })

  const newState = useRunLockStore.getState()
  return { success: true, runId: newState.lockedRun?.runId }
}

/**
 * Draw room choices from the dungeon deck.
 * Returns 3 rooms (or fewer if deck is nearly empty).
 */
export function drawRoomChoices(): {
  success: boolean
  choices?: RoomCard[]
  error?: string
} {
  const validation = validateActiveRun()
  if (!validation.valid || !validation.run) {
    return { success: false, error: validation.reason }
  }

  const { dungeonDeckCurrent } = validation.run

  if (dungeonDeckCurrent.length === 0) {
    return { success: false, error: 'Dungeon deck is empty' }
  }

  // Draw up to 3 cards
  const drawCount = Math.min(3, dungeonDeckCurrent.length)
  const choices = dungeonDeckCurrent.slice(0, drawCount)

  // Update store with current choices
  const store = useRunLockStore.getState()
  store.updateDeck(choices, dungeonDeckCurrent)

  return { success: true, choices }
}

/**
 * Select a room from the current choices.
 * Removes selected room from deck.
 */
export function selectRoom(roomUid: string): {
  success: boolean
  selectedRoom?: RoomCard
  error?: string
} {
  const validation = validateActiveRun()
  if (!validation.valid || !validation.run) {
    return { success: false, error: validation.reason }
  }

  const { roomChoices, dungeonDeckCurrent } = validation.run

  const selectedRoom = roomChoices.find((r) => r.uid === roomUid)
  if (!selectedRoom) {
    return { success: false, error: 'Room not in current choices' }
  }

  // Remove selected room from deck
  const newDeck = dungeonDeckCurrent.filter((r) => r.uid !== roomUid)

  // Clear choices (will be redrawn after room completion)
  const store = useRunLockStore.getState()
  store.updateDeck([], newDeck)

  return { success: true, selectedRoom }
}

/**
 * Record room completion and update progress.
 */
export function completeRoom(params: {
  roomUid: string
  goldEarned?: number
  enemiesKilled?: number
  cardsPlayed?: number
  damageDealt?: number
  damageTaken?: number
}): { success: boolean; progress?: RunProgress; error?: string } {
  const validation = validateActiveRun()
  if (!validation.valid || !validation.run) {
    return { success: false, error: validation.reason }
  }

  const { progress } = validation.run
  const store = useRunLockStore.getState()

  // Update progress
  const newProgress: Partial<RunProgress> = {
    floor: progress.floor + 1,
    roomsCleared: [...progress.roomsCleared, params.roomUid],
    goldEarned: progress.goldEarned + (params.goldEarned ?? 0),
    enemiesKilled: progress.enemiesKilled + (params.enemiesKilled ?? 0),
    cardsPlayed: progress.cardsPlayed + (params.cardsPlayed ?? 0),
    damageDealt: progress.damageDealt + (params.damageDealt ?? 0),
    damageTaken: progress.damageTaken + (params.damageTaken ?? 0),
  }

  store.updateProgress(newProgress)

  // Check for dungeon completion
  const updatedRun = useRunLockStore.getState().lockedRun
  if (updatedRun && updatedRun.dungeonDeckCurrent.length === 0) {
    store.completeRun()
  }

  return { success: true, progress: { ...progress, ...newProgress } }
}

/**
 * Handle player death during a run.
 */
export function handleDeath(): { success: boolean; error?: string } {
  const validation = validateActiveRun()
  if (!validation.valid) {
    return { success: false, error: validation.reason }
  }

  const store = useRunLockStore.getState()
  store.failRun()

  return { success: true }
}

/**
 * Calculate abandon penalty and check if player can afford it.
 */
export function getAbandonPenalty(currentGold: number): AbandonPenalty {
  const validation = validateActiveRun()
  if (!validation.valid || !validation.run) {
    return {
      baseCost: 0,
      difficulty: 0,
      progressPercent: 0,
      finalCost: 0,
      canAfford: true,
    }
  }

  const { progress, heatAtStart } = validation.run
  const progressPercent =
    progress.totalRooms > 0 ? progress.roomsCleared.length / progress.totalRooms : 0

  // Base cost scales with difficulty (heat)
  const baseCost = 50
  const difficulty = 1 + heatAtStart * 0.01
  const finalCost = Math.floor(baseCost * difficulty * (1 - progressPercent))

  return {
    baseCost,
    difficulty,
    progressPercent,
    finalCost: Math.max(0, finalCost),
    canAfford: currentGold >= finalCost,
  }
}

/**
 * Abandon the current run (with gold cost).
 */
export function abandonRun(currentGold: number): {
  success: boolean
  cost?: number
  error?: string
} {
  const penalty = getAbandonPenalty(currentGold)

  if (!penalty.canAfford) {
    return { success: false, error: 'Not enough gold to abandon' }
  }

  const store = useRunLockStore.getState()
  store.abandonRun(penalty.finalCost)

  return { success: true, cost: penalty.finalCost }
}

/**
 * Clear completed/failed run state (after rewards claimed).
 */
export function clearCompletedRun(): void {
  const store = useRunLockStore.getState()
  const { lockedRun } = store

  if (lockedRun && lockedRun.status !== 'active') {
    store.clearRun()
  }
}

// ============================================
// GETTERS
// ============================================

/**
 * Get current locked run state.
 */
export function getLockedRun(): LockedRunState | null {
  return useRunLockStore.getState().lockedRun
}

/**
 * Check if there's an active run.
 */
export function hasActiveRun(): boolean {
  return useRunLockStore.getState().hasActiveRun()
}

/**
 * Get current streak.
 */
export function getCurrentStreak(): number {
  return useRunLockStore.getState().streak.currentStreak
}

// ============================================
// RUN RESTORATION
// ============================================

/**
 * Restore a RunState from a locked run.
 * Used for browser recovery after close/refresh.
 */
export function restoreRunFromLocked(): RunState | null {
  const { lockedRun } = useRunLockStore.getState()

  if (!lockedRun || lockedRun.status !== 'active') {
    return null
  }

  const { playerSnapshot, progress, currentRelics, currentDeck, dungeonDeckCurrent, roomChoices, dungeonDeckId } =
    lockedRun

  // Reconstruct deck as CardInstance[]
  const deck = currentDeck.map((cardId) => createCardInstance(cardId))

  // Reconstruct hero state
  const hero = {
    heroCardId: playerSnapshot.heroId,
    currentHealth: playerSnapshot.currentHealth,
    maxHealth: playerSnapshot.maxHealth,
    id: playerSnapshot.heroId,
  }

  // Reconstruct run stats from progress
  const stats = {
    cardsPlayed: progress.cardsPlayed,
    damageDealt: progress.damageDealt,
    damageTaken: progress.damageTaken,
    enemiesKilled: progress.enemiesKilled,
    goldEarned: progress.goldEarned,
    floorsCleared: progress.floor - 1,
    relicsCollected: currentRelics.length,
  }

  // Build the RunState
  const runState: RunState = {
    gamePhase: 'roomSelect',
    floor: progress.floor,
    hero,
    deck,
    relics: currentRelics,
    combat: null,
    dungeonDeck: dungeonDeckCurrent,
    roomChoices: roomChoices.length > 0 ? roomChoices : dungeonDeckCurrent.slice(0, Math.min(3, dungeonDeckCurrent.length)),
    gold: playerSnapshot.gold + progress.goldEarned,
    stats,
    dungeonDeckId,
  }

  // If we restored with no room choices, draw them now
  if (roomChoices.length === 0 && dungeonDeckCurrent.length > 0) {
    const drawResult = drawRoomChoices()
    if (drawResult.success && drawResult.choices) {
      runState.roomChoices = drawResult.choices
    }
  }

  return runState
}
