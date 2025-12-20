// ============================================
// RUN LOCK STORE
// ============================================
// Zustand store with localStorage persistence for locked run state.
// Enables browser close recovery - players can resume locked runs.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  LockedRunState,
  LockedRunStatus,
  RunProgress,
  RunRecoveryInfo,
  RoomCard,
  ModifierInstance,
  RelicInstance,
  PlayerSnapshot,
  StreakState,
  HeatState,
} from '../types'
import { DEFAULT_RUN_PROGRESS, DEFAULT_STREAK_STATE, DEFAULT_HEAT_STATE } from '../types'
import { generateUid } from '../lib/utils'

// ============================================
// STORE STATE
// ============================================

interface RunLockStoreState {
  // Current locked run (null if no active run)
  lockedRun: LockedRunState | null

  // Streak tracking (persists across runs)
  streak: StreakState

  // Heat tracking (resets on death)
  heat: HeatState

  // Actions
  lockRun: (params: LockRunParams) => void
  updateProgress: (updates: Partial<RunProgress>) => void
  updateDeck: (roomChoices: RoomCard[], dungeonDeckCurrent: RoomCard[]) => void
  completeRun: () => void
  failRun: () => void
  abandonRun: (cost: number) => void
  clearRun: () => void

  // Streak actions
  incrementStreak: () => void
  breakStreak: () => void

  // Heat actions
  setHeat: (heat: HeatState) => void

  // Recovery
  getRecoveryInfo: () => RunRecoveryInfo | null
  hasActiveRun: () => boolean
}

interface LockRunParams {
  dungeonDeckId: string
  dungeonDeckSnapshot: RoomCard[]
  activeModifiers: ModifierInstance[]
  playerSnapshot: PlayerSnapshot
  currentRelics: RelicInstance[]
  currentDeck: string[]
  heatAtStart: number
  streakAtStart: number
  totalRooms: number
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useRunLockStore = create<RunLockStoreState>()(
  persist(
    (set, get) => ({
      lockedRun: null,
      streak: DEFAULT_STREAK_STATE,
      heat: DEFAULT_HEAT_STATE,

      // Lock in a new run
      lockRun: (params) => {
        const now = Date.now()
        const newRun: LockedRunState = {
          runId: generateUid(),
          dungeonDeckId: params.dungeonDeckId,
          dungeonDeckSnapshot: params.dungeonDeckSnapshot,
          dungeonDeckCurrent: [...params.dungeonDeckSnapshot],
          roomChoices: [],
          activeModifiers: params.activeModifiers,
          consumedModifiers: [],
          playerSnapshot: params.playerSnapshot,
          currentRelics: params.currentRelics,
          currentDeck: params.currentDeck,
          heatAtStart: params.heatAtStart,
          streakAtStart: params.streakAtStart,
          progress: {
            ...DEFAULT_RUN_PROGRESS,
            totalRooms: params.totalRooms,
            roomsRemaining: params.totalRooms,
          },
          status: 'active',
          lockedAt: now,
          lastUpdatedAt: now,
        }

        set({ lockedRun: newRun })
      },

      // Update run progress
      updateProgress: (updates) => {
        const { lockedRun } = get()
        if (!lockedRun) return

        set({
          lockedRun: {
            ...lockedRun,
            progress: { ...lockedRun.progress, ...updates },
            lastUpdatedAt: Date.now(),
          },
        })
      },

      // Update dungeon deck state after room selection
      updateDeck: (roomChoices, dungeonDeckCurrent) => {
        const { lockedRun } = get()
        if (!lockedRun) return

        set({
          lockedRun: {
            ...lockedRun,
            roomChoices,
            dungeonDeckCurrent,
            progress: {
              ...lockedRun.progress,
              roomsRemaining: dungeonDeckCurrent.length,
            },
            lastUpdatedAt: Date.now(),
          },
        })
      },

      // Complete run successfully
      completeRun: () => {
        const { lockedRun, incrementStreak } = get()
        if (!lockedRun) return

        set({
          lockedRun: {
            ...lockedRun,
            status: 'completed' as LockedRunStatus,
            endedAt: Date.now(),
            lastUpdatedAt: Date.now(),
          },
        })

        // Increment streak on successful completion
        incrementStreak()
      },

      // Fail run (death)
      failRun: () => {
        const { lockedRun, breakStreak } = get()
        if (!lockedRun) return

        set({
          lockedRun: {
            ...lockedRun,
            status: 'failed' as LockedRunStatus,
            endedAt: Date.now(),
            lastUpdatedAt: Date.now(),
          },
          heat: DEFAULT_HEAT_STATE, // Reset heat on death
        })

        // Break streak on death
        breakStreak()
      },

      // Abandon run (with gold cost)
      abandonRun: (cost) => {
        const { lockedRun, breakStreak } = get()
        if (!lockedRun) return

        set({
          lockedRun: {
            ...lockedRun,
            status: 'abandoned' as LockedRunStatus,
            abandonCost: cost,
            endedAt: Date.now(),
            lastUpdatedAt: Date.now(),
          },
        })

        // Breaking streak on abandon is optional (design decision)
        breakStreak()
      },

      // Clear run state (after rewards claimed)
      clearRun: () => {
        set({ lockedRun: null })
      },

      // Increment streak on successful deck clear
      incrementStreak: () => {
        set((state) => ({
          streak: {
            ...state.streak,
            currentStreak: state.streak.currentStreak + 1,
            bestStreak: Math.max(state.streak.bestStreak, state.streak.currentStreak + 1),
            lastClearAt: Date.now(),
            streakBrokenAt: null,
            totalClears: state.streak.totalClears + 1,
          },
        }))
      },

      // Break streak on death or abandon
      breakStreak: () => {
        set((state) => ({
          streak: {
            ...state.streak,
            currentStreak: 0,
            streakBrokenAt: Date.now(),
          },
        }))
      },

      // Set heat state
      setHeat: (heat) => {
        set({ heat })
      },

      // Get recovery info for UI
      getRecoveryInfo: () => {
        const { lockedRun } = get()
        if (!lockedRun || lockedRun.status !== 'active') return null

        return {
          runId: lockedRun.runId,
          dungeonName: lockedRun.dungeonDeckId, // TODO: Resolve to actual name
          dungeonDeckId: lockedRun.dungeonDeckId,
          heroId: lockedRun.playerSnapshot.heroId,
          difficulty: lockedRun.heatAtStart,
          floor: lockedRun.progress.floor,
          totalRooms: lockedRun.progress.totalRooms,
          roomsRemaining: lockedRun.progress.roomsRemaining,
          activeModifierCount: lockedRun.activeModifiers.length,
          lockedAt: lockedRun.lockedAt,
          lastUpdatedAt: lockedRun.lastUpdatedAt,
        }
      },

      // Check if there's an active run
      hasActiveRun: () => {
        const { lockedRun } = get()
        return lockedRun !== null && lockedRun.status === 'active'
      },
    }),
    {
      name: 'pandemonium-run-lock',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lockedRun: state.lockedRun,
        streak: state.streak,
        heat: state.heat,
      }),
    }
  )
)

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
 * | 3      | 1.9x       |
 * | 5      | 2.5x       |
 * | 7      | 3.3x       |
 * | 10     | 6.5x       |
 */
export function calculateStreakMultiplier(streak: number): number {
  return 1 + 0.15 * streak + 0.05 * streak * streak
}

/**
 * Get streak milestone if any threshold is met.
 */
export function getStreakMilestone(streak: number): {
  label: string
  icon: string
  color: string
} | null {
  // Milestones from highest to lowest
  const milestones = [
    { threshold: 20, label: 'Transcendent', icon: '💎', color: '#22d3ee' },
    { threshold: 15, label: 'Mythic', icon: '👑', color: '#fbbf24' },
    { threshold: 10, label: 'Legendary', icon: '⭐', color: '#a855f7' },
    { threshold: 7, label: 'Inferno', icon: '🔥🔥🔥', color: '#f87171' },
    { threshold: 5, label: 'Burning', icon: '🔥🔥', color: '#fb923c' },
    { threshold: 3, label: 'Hot Streak', icon: '🔥', color: '#facc15' },
  ]

  for (const milestone of milestones) {
    if (streak >= milestone.threshold) {
      return milestone
    }
  }

  return null
}

// ============================================
// ABANDON PENALTY CALCULATION
// ============================================

/**
 * Calculate abandon penalty.
 * Cost = baseCost × difficulty × (1 - progressPercent)
 */
export function calculateAbandonPenalty(
  baseCost: number,
  difficulty: number,
  roomsCleared: number,
  totalRooms: number,
  currentGold: number
): {
  baseCost: number
  difficulty: number
  progressPercent: number
  finalCost: number
  canAfford: boolean
} {
  const progressPercent = totalRooms > 0 ? roomsCleared / totalRooms : 0
  const finalCost = Math.floor(baseCost * difficulty * (1 - progressPercent))

  return {
    baseCost,
    difficulty,
    progressPercent,
    finalCost,
    canAfford: currentGold >= finalCost,
  }
}
