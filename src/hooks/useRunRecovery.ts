// ============================================
// RUN RECOVERY HOOK
// ============================================
// Handles browser close recovery for locked dungeon runs.
// Checks localStorage on mount and prompts user to resume.

import { useEffect, useState, useCallback } from 'react'
import { useRunLockStore } from '../stores/runLockStore'
import type { RunRecoveryInfo } from '../types'

export interface RunRecoveryState {
  /** Whether we're checking for recoverable run */
  isChecking: boolean
  /** Recovery info if a run exists */
  recoveryInfo: RunRecoveryInfo | null
  /** Whether recovery prompt should be shown */
  showRecoveryPrompt: boolean
}

export interface RunRecoveryActions {
  /** Resume the locked run */
  resumeRun: () => void
  /** Abandon the locked run (user chose not to resume) */
  abandonRecovery: () => void
  /** Dismiss recovery prompt without action */
  dismissPrompt: () => void
}

/**
 * Hook for recovering locked runs after browser close.
 *
 * Usage:
 * Call this hook and check state.showRecoveryPrompt to determine
 * if a recovery modal should be shown. Use actions.resumeRun or
 * actions.abandonRecovery to handle user choice.
 */
export function useRunRecovery(options: {
  /** Called when user chooses to resume */
  onResume?: (info: RunRecoveryInfo) => void
  /** Called when user chooses to abandon recovery */
  onAbandon?: () => void
  /** Auto-check on mount (default: true) */
  autoCheck?: boolean
}): {
  state: RunRecoveryState
  actions: RunRecoveryActions
} {
  const { onResume, onAbandon, autoCheck = true } = options

  const [isChecking, setIsChecking] = useState(autoCheck)
  const [recoveryInfo, setRecoveryInfo] = useState<RunRecoveryInfo | null>(null)
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false)

  // Check for recoverable run on mount
  useEffect(() => {
    if (!autoCheck) return

    const checkRecovery = () => {
      const store = useRunLockStore.getState()
      const info = store.getRecoveryInfo()

      setIsChecking(false)

      if (info) {
        setRecoveryInfo(info)
        setShowRecoveryPrompt(true)
      }
    }

    // Small delay to ensure store is hydrated from localStorage
    const timer = setTimeout(checkRecovery, 100)
    return () => clearTimeout(timer)
  }, [autoCheck])

  const resumeRun = useCallback(() => {
    if (recoveryInfo && onResume) {
      onResume(recoveryInfo)
    }
    setShowRecoveryPrompt(false)
  }, [recoveryInfo, onResume])

  const abandonRecovery = useCallback(() => {
    // Clear the locked run without penalty (user chose not to resume)
    const store = useRunLockStore.getState()

    // Mark as abandoned with 0 cost since this is recovery abandonment
    if (store.lockedRun?.status === 'active') {
      store.abandonRun(0)
    }
    store.clearRun()

    if (onAbandon) {
      onAbandon()
    }
    setShowRecoveryPrompt(false)
    setRecoveryInfo(null)
  }, [onAbandon])

  const dismissPrompt = useCallback(() => {
    setShowRecoveryPrompt(false)
  }, [])

  return {
    state: {
      isChecking,
      recoveryInfo,
      showRecoveryPrompt,
    },
    actions: {
      resumeRun,
      abandonRecovery,
      dismissPrompt,
    },
  }
}

/**
 * Format recovery info for display.
 */
export function formatRecoveryInfo(info: RunRecoveryInfo): {
  title: string
  subtitle: string
  progress: string
  timeAgo: string
} {
  const progressPercent = info.totalRooms > 0
    ? Math.round((1 - info.roomsRemaining / info.totalRooms) * 100)
    : 0

  const timeDiff = Date.now() - info.lastUpdatedAt
  const minutes = Math.floor(timeDiff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let timeAgo: string
  if (days > 0) {
    timeAgo = days + ' day' + (days > 1 ? 's' : '') + ' ago'
  } else if (hours > 0) {
    timeAgo = hours + ' hour' + (hours > 1 ? 's' : '') + ' ago'
  } else if (minutes > 0) {
    timeAgo = minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago'
  } else {
    timeAgo = 'just now'
  }

  return {
    title: 'Continue Run?',
    subtitle: info.dungeonName,
    progress: 'Floor ' + info.floor + ' \u2022 ' + progressPercent + '% complete',
    timeAgo: 'Last played ' + timeAgo,
  }
}

/**
 * Check if there's a recoverable run without using the hook.
 * Useful for conditional rendering before component mount.
 */
export function hasRecoverableRun(): boolean {
  const store = useRunLockStore.getState()
  return store.hasActiveRun()
}
