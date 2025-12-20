import { memo, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'
import type { StreakState } from '../../types'
import { calculateStreakMultiplier, getStreakMilestone, formatMultiplier } from '../../game/streak'

interface StreakDisplayProps {
  streak: StreakState
  variant?: 'compact' | 'full' | 'banner'
  showMilestone?: boolean
  isAnimating?: boolean
}

// Milestone icons and colors
const MILESTONE_CONFIG: Record<string, { icon: string; color: string; bgClass: string }> = {
  'Hot Streak': { icon: 'game-icons:flame', color: 'text-orange-400', bgClass: 'bg-orange-500/20' },
  'Burning': { icon: 'game-icons:fire-ring', color: 'text-orange-500', bgClass: 'bg-orange-600/20' },
  'Inferno': { icon: 'game-icons:fire-zone', color: 'text-red-400', bgClass: 'bg-red-500/20' },
  'Legendary': { icon: 'game-icons:dragon-breath', color: 'text-amber-400', bgClass: 'bg-amber-500/20' },
  'Mythic': { icon: 'game-icons:crowned-heart', color: 'text-purple-400', bgClass: 'bg-purple-500/20' },
  'Transcendent': { icon: 'game-icons:star-formation', color: 'text-cyan-400', bgClass: 'bg-cyan-500/20' },
  'Eternal': { icon: 'game-icons:galaxy', color: 'text-white', bgClass: 'bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-amber-500/20' },
}

export const StreakDisplay = memo(function StreakDisplay({
  streak,
  variant = 'compact',
  showMilestone = true,
  isAnimating = false,
}: StreakDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)

  const multiplier = calculateStreakMultiplier(streak.currentStreak)
  const milestone = getStreakMilestone(streak.currentStreak)
  const milestoneConfig = milestone ? MILESTONE_CONFIG[milestone.name] : null

  // Pulse animation when streak is hot
  useEffect(() => {
    if (!containerRef.current || streak.currentStreak < 3) return

    const intensity = Math.min(streak.currentStreak / 10, 1)

    gsap.to(containerRef.current, {
      boxShadow: `0 0 ${10 + intensity * 20}px oklch(0.7 0.2 30 / ${0.2 + intensity * 0.3})`,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    const container = containerRef.current
    return () => {
      if (container) {
        gsap.killTweensOf(container)
      }
    }
  }, [streak.currentStreak])

  // Number increment animation
  useEffect(() => {
    if (!numberRef.current || !isAnimating) return

    gsap.fromTo(numberRef.current,
      { scale: 1.5, color: 'oklch(0.8 0.2 85)' },
      { scale: 1, color: 'currentColor', duration: 0.5, ease: 'elastic.out(1, 0.5)' }
    )
  }, [streak.currentStreak, isAnimating])

  if (variant === 'compact') {
    return (
      <div
        ref={containerRef}
        className={`
          StreakDisplay--compact inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          ${streak.currentStreak >= 3 ? 'bg-orange-900/30 border border-orange-500/50' : 'bg-surface/50 border border-warm-700'}
        `}
      >
        <Icon
          icon={streak.currentStreak >= 3 ? 'game-icons:flame' : 'game-icons:fire-symbol'}
          className={streak.currentStreak >= 3 ? 'w-4 h-4 text-orange-400' : 'w-4 h-4 text-warm-400'}
        />
        <span ref={numberRef} className={streak.currentStreak >= 3 ? 'font-bold text-orange-300' : 'text-warm-300'}>
          {streak.currentStreak}
        </span>
        <span className="text-xs text-warm-400">×{formatMultiplier(multiplier)}</span>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        ref={containerRef}
        className={`
          StreakDisplay--banner flex items-center gap-4 px-6 py-4 rounded-xl
          ${milestoneConfig?.bgClass ?? 'bg-surface/50'}
          border ${streak.currentStreak >= 3 ? 'border-orange-500/50' : 'border-warm-700'}
        `}
      >
        {/* Streak Icon & Count */}
        <div className="flex items-center gap-2">
          <Icon
            icon={milestoneConfig?.icon ?? 'game-icons:fire-symbol'}
            className={`w-10 h-10 ${milestoneConfig?.color ?? 'text-warm-400'}`}
          />
          <div className="flex flex-col">
            <span ref={numberRef} className="text-3xl font-bold text-white">
              {streak.currentStreak}
            </span>
            <span className="text-xs text-warm-400 uppercase tracking-wider">Streak</span>
          </div>
        </div>

        {/* Multiplier */}
        <div className="flex flex-col items-center px-4 border-l border-r border-warm-600/50">
          <span className="text-2xl font-bold text-energy">×{formatMultiplier(multiplier)}</span>
          <span className="text-xs text-warm-400">Multiplier</span>
        </div>

        {/* Milestone */}
        {showMilestone && milestone && (
          <div className="flex flex-col">
            <span className={`font-medium ${milestoneConfig?.color ?? 'text-warm-300'}`}>
              {milestone.name}
            </span>
            <span className="text-xs text-warm-400">{milestone.reward}</span>
          </div>
        )}

        {/* Best Streak */}
        <div className="ml-auto flex flex-col items-end">
          <span className="text-sm text-warm-300">
            Best: <span className="font-medium text-white">{streak.bestStreak}</span>
          </span>
          <span className="text-xs text-warm-500">
            Total: {streak.totalClears}
          </span>
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <div
      ref={containerRef}
      className={`
        StreakDisplay--full flex flex-col gap-3 p-4 rounded-xl
        ${milestoneConfig?.bgClass ?? 'bg-surface/50'}
        border ${streak.currentStreak >= 3 ? 'border-orange-500/50' : 'border-warm-700'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            icon={milestoneConfig?.icon ?? 'game-icons:fire-symbol'}
            className={`w-6 h-6 ${milestoneConfig?.color ?? 'text-warm-400'}`}
          />
          <span className="font-medium text-warm-100">Win Streak</span>
        </div>
        <span className="text-xs text-warm-500">
          Best: {streak.bestStreak}
        </span>
      </div>

      {/* Streak Counter */}
      <div className="flex items-baseline gap-3">
        <span ref={numberRef} className="text-4xl font-bold text-white">
          {streak.currentStreak}
        </span>
        <span className="text-xl font-medium text-energy">
          ×{formatMultiplier(multiplier)}
        </span>
      </div>

      {/* Milestone Badge */}
      {showMilestone && milestone && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${milestoneConfig?.bgClass ?? 'bg-surface/30'}`}>
          <Icon icon={milestoneConfig?.icon ?? 'game-icons:trophy'} className={`w-5 h-5 ${milestoneConfig?.color ?? 'text-warm-300'}`} />
          <div className="flex flex-col">
            <span className={`font-medium ${milestoneConfig?.color ?? 'text-warm-300'}`}>
              {milestone.name}
            </span>
            <span className="text-xs text-warm-400">{milestone.reward}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-between text-xs text-warm-500 pt-2 border-t border-warm-700/50">
        <span>Total Clears: {streak.totalClears}</span>
        {streak.lastClearAt && (
          <span>Last: {new Date(streak.lastClearAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  )
})

export default StreakDisplay
