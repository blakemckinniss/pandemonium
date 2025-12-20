// ============================================
// RUN LOCK STATE
// ============================================
// Tracks locked-in run state for browser persistence.
// Players commit to a run and can't retreat - ride or die.

import type { RoomCard } from './rooms'
import type { ModifierInstance } from './modifiers'
import type { RelicInstance } from './relics'

// ============================================
// RUN LOCK STATUS
// ============================================

/**
 * Status of a locked run:
 * - active: Player is currently in this run
 * - completed: Player cleared all rooms successfully
 * - failed: Player died during the run
 * - abandoned: Player force-quit (with penalty)
 */
export type LockedRunStatus = 'active' | 'completed' | 'failed' | 'abandoned'

// ============================================
// PLAYER SNAPSHOT
// ============================================

/**
 * Snapshot of player state at run lock-in.
 * Used for recovery and analytics.
 */
export interface PlayerSnapshot {
  gold: number
  maxHealth: number
  currentHealth: number
  relicIds: string[]
  deckCardIds: string[]
  heroId: string
}

// ============================================
// RUN PROGRESS
// ============================================

/**
 * Progress tracking within a locked run.
 */
export interface RunProgress {
  /** Current floor number (1-based) */
  floor: number

  /** Room UIDs that have been cleared */
  roomsCleared: string[]

  /** Number of rooms remaining in deck */
  roomsRemaining: number

  /** Total rooms in this deck (for progress bar) */
  totalRooms: number

  /** Gold earned this run */
  goldEarned: number

  /** Enemies killed this run */
  enemiesKilled: number

  /** Cards played this run */
  cardsPlayed: number

  /** Damage dealt this run */
  damageDealt: number

  /** Damage taken this run */
  damageTaken: number
}

// ============================================
// LOCKED RUN STATE
// ============================================

/**
 * Complete state of a locked-in run.
 * Persisted to localStorage for browser close recovery.
 */
export interface LockedRunState {
  /** Unique run identifier */
  runId: string

  /** Reference to dungeon deck definition */
  dungeonDeckId: string

  /** Snapshot of dungeon deck cards at run start */
  dungeonDeckSnapshot: RoomCard[]

  /** Current remaining dungeon deck */
  dungeonDeckCurrent: RoomCard[]

  /** Current room choices (draw 3) */
  roomChoices: RoomCard[]

  /** Modifiers active for this run */
  activeModifiers: ModifierInstance[]

  /** Modifier IDs consumed (for consumables) */
  consumedModifiers: string[]

  /** Player snapshot at run start */
  playerSnapshot: PlayerSnapshot

  /** Current player relics */
  currentRelics: RelicInstance[]

  /** Current player deck (card IDs) */
  currentDeck: string[]

  /** Heat level at run start */
  heatAtStart: number

  /** Streak count at run start */
  streakAtStart: number

  /** Progress tracking */
  progress: RunProgress

  /** Run status */
  status: LockedRunStatus

  /** Timestamp when run was locked in */
  lockedAt: number

  /** Timestamp of last state update */
  lastUpdatedAt: number

  /** Timestamp when run ended (if completed/failed/abandoned) */
  endedAt?: number

  /** If abandoned, the gold cost paid */
  abandonCost?: number
}

// ============================================
// RUN RECOVERY
// ============================================

/**
 * Information for run recovery UI when browser reopens.
 */
export interface RunRecoveryInfo {
  runId: string
  dungeonName: string
  dungeonDeckId: string
  heroId: string
  difficulty: number
  floor: number
  totalRooms: number
  roomsRemaining: number
  activeModifierCount: number
  lockedAt: number
  lastUpdatedAt: number
}

// ============================================
// RUN RESULTS
// ============================================

/**
 * Results after completing or failing a run.
 */
export interface RunResult {
  runId: string
  status: LockedRunStatus
  dungeonDeckId: string
  difficulty: number

  // Progress at end
  finalFloor: number
  roomsCleared: number
  totalRooms: number

  // Stats
  goldEarned: number
  enemiesKilled: number
  cardsPlayed: number
  damageDealt: number
  damageTaken: number

  // Modifiers used
  modifiersUsed: string[]
  heatLevel: number

  // Streak impact
  streakBefore: number
  streakAfter: number

  // Timing
  startedAt: number
  endedAt: number
  durationMs: number
}

/**
 * Rewards earned from a successful run.
 */
export interface RunRewards {
  // Gold (with streak multiplier applied)
  baseGold: number
  streakMultiplier: number
  totalGold: number

  // Unlocks earned
  cardUnlocks: string[]
  modifierUnlocks: string[]
  heroUnlocks: string[]

  // Streak milestone rewards
  milestoneRewards: {
    milestone: string
    reward: string
  }[]
}

/**
 * UI-friendly rewards for dungeon complete screen.
 * Extends RunRewards with additional display fields.
 */
export interface DungeonRewards {
  // Gold breakdown
  gold: number
  baseGold: number
  multiplier: number

  // Progress stats
  cardsUnlocked: number
  xp: number
  heatReduced: number

  // Bonus rewards
  bonusModifier?: {
    name: string
    rarity: string
  }
}

// ============================================
// ABANDON PENALTY
// ============================================

/**
 * Penalty calculation for abandoning a run.
 * Cost = baseCost × difficulty × (1 - progressPercent)
 */
export interface AbandonPenalty {
  baseCost: number
  difficulty: number
  progressPercent: number
  finalCost: number
  canAfford: boolean
}

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_RUN_PROGRESS: RunProgress = {
  floor: 0,
  roomsCleared: [],
  roomsRemaining: 0,
  totalRooms: 0,
  goldEarned: 0,
  enemiesKilled: 0,
  cardsPlayed: 0,
  damageDealt: 0,
  damageTaken: 0,
}
