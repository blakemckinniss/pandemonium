import { memo, useRef, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'
import type { LockedRunState } from '../../types'
import { formatRecoveryInfo } from '../../hooks/useRunRecovery'

interface RunLockIndicatorProps {
  run: LockedRunState | null
  variant?: 'badge' | 'card' | 'banner'
  onResume?: () => void
  onAbandon?: () => void
}

// Status styling
const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  active: { icon: 'game-icons:locked-chest', color: 'text-energy', label: 'In Progress' },
  completed: { icon: 'game-icons:laurel-crown', color: 'text-heal', label: 'Completed' },
  failed: { icon: 'game-icons:skull-crossed-bones', color: 'text-damage', label: 'Failed' },
  abandoned: { icon: 'game-icons:flag-white', color: 'text-warm-400', label: 'Abandoned' },
}

export const RunLockIndicator = memo(function RunLockIndicator({
  run,
  variant = 'badge',
  onResume,
  onAbandon,
}: RunLockIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)

  const status = run?.status ?? 'active'
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active

  // Pulse animation for active run
  useEffect(() => {
    if (!containerRef.current || status !== 'active') return

    gsap.to(containerRef.current, {
      boxShadow: '0 0 15px oklch(0.7 0.18 85 / 0.4)',
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    return () => {
      if (containerRef.current) {
        gsap.killTweensOf(containerRef.current)
      }
    }
  }, [status])

  if (!run) {
    // No locked run
    if (variant === 'badge') {
      return (
        <div className="RunLockIndicator--empty inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/30 border border-warm-700">
          <Icon icon="game-icons:unlocked" className="w-4 h-4 text-warm-500" />
          <span className="text-sm text-warm-400">No active run</span>
        </div>
      )
    }
    return null
  }

  // Calculate recovery info for display
  const recoveryInfo = {
    runId: run.runId,
    dungeonName: run.dungeonDeckId,
    dungeonDeckId: run.dungeonDeckId,
    heroId: run.playerSnapshot.heroId,
    difficulty: 1,
    floor: run.progress.floor,
    totalRooms: run.progress.totalRooms,
    roomsRemaining: run.progress.roomsRemaining,
    activeModifierCount: run.activeModifiers.length,
    lockedAt: run.lockedAt,
    lastUpdatedAt: Date.now(),
  }
  const displayInfo = formatRecoveryInfo(recoveryInfo)

  if (variant === 'badge') {
    return (
      <div
        ref={containerRef}
        className={`
          RunLockIndicator--badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-surface/50 border border-energy/50
          ${status === 'active' ? 'cursor-pointer hover:bg-surface/70 transition-colors' : ''}
        `}
        onClick={status === 'active' ? onResume : undefined}
      >
        <Icon icon={config.icon} className={`w-4 h-4 ${config.color}`} />
        <span className="text-sm text-warm-200">
          Floor {run.progress.floor} • {run.progress.roomsRemaining} left
        </span>
        {status === 'active' && (
          <Icon icon="game-icons:play-button" className="w-3 h-3 text-energy" />
        )}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        ref={containerRef}
        className={`
          RunLockIndicator--card p-4 rounded-xl
          bg-gradient-to-b from-surface/50 to-surface/30
          border ${status === 'active' ? 'border-energy/50' : 'border-warm-700'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon icon={config.icon} className={`w-5 h-5 ${config.color}`} />
            <span className={`font-medium ${config.color}`}>{config.label}</span>
          </div>
          <span className="text-xs text-warm-500">{displayInfo.timeAgo}</span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-warm-300">{displayInfo.title}</span>
            <span className="text-warm-400">{displayInfo.progress}</span>
          </div>
          <div className="h-2 bg-warm-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-energy to-heal rounded-full transition-all"
              style={{ width: `${run.progress.totalRooms > 0 ? ((run.progress.totalRooms - run.progress.roomsRemaining) / run.progress.totalRooms) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center justify-between text-xs text-warm-500 mb-3">
          <span>{run.activeModifiers.length} modifier{run.activeModifiers.length !== 1 ? 's' : ''}</span>
          <span>Rooms cleared: {run.progress.roomsCleared.length}</span>
        </div>

        {/* Actions */}
        {status === 'active' && (
          <div className="flex gap-2">
            <button
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-energy/20 text-energy hover:bg-energy/30 transition-colors"
            >
              <Icon icon="game-icons:play-button" className="w-4 h-4" />
              Resume
            </button>
            {showAbandonConfirm ? (
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    onAbandon?.()
                    setShowAbandonConfirm(false)
                  }}
                  className="px-3 py-2 rounded-lg bg-damage/20 text-damage hover:bg-damage/30 transition-colors text-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="px-3 py-2 rounded-lg bg-surface text-warm-400 hover:text-warm-200 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAbandonConfirm(true)}
                className="px-4 py-2 rounded-lg bg-surface text-warm-400 hover:text-damage hover:bg-damage/10 transition-colors"
                title="Abandon run"
              >
                <Icon icon="game-icons:exit-door" className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Banner variant
  return (
    <div
      ref={containerRef}
      className={`
        RunLockIndicator--banner flex items-center gap-4 px-6 py-4 rounded-xl
        bg-gradient-to-r from-energy/10 via-surface/50 to-surface/30
        border border-energy/30
      `}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-energy/20 flex items-center justify-center">
        <Icon icon={config.icon} className={`w-7 h-7 ${config.color}`} />
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-warm-100">{displayInfo.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'active' ? 'bg-energy/20 text-energy' : 'bg-warm-700 text-warm-400'}`}>
            {config.label}
          </span>
        </div>
        <div className="text-sm text-warm-400">{displayInfo.subtitle}</div>
      </div>

      {/* Progress */}
      <div className="flex flex-col items-center px-4">
        <span className="text-2xl font-bold text-white">{displayInfo.progress}</span>
        <span className="text-xs text-warm-500">Progress</span>
      </div>

      {/* Actions */}
      {status === 'active' && (
        <div className="flex gap-2">
          <button
            onClick={onResume}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-energy text-warm-900 font-medium hover:bg-energy/90 transition-colors"
          >
            <Icon icon="game-icons:play-button" className="w-4 h-4" />
            Resume Run
          </button>
          <button
            onClick={onAbandon}
            className="p-2.5 rounded-lg bg-surface border border-warm-600 text-warm-400 hover:text-damage hover:border-damage/50 transition-colors"
            title="Abandon run"
          >
            <Icon icon="game-icons:exit-door" className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
})

export default RunLockIndicator
