import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'
import { StreakDisplay } from '../StreakDisplay/StreakDisplay'
import type { StreakState, DungeonRewards } from '../../types'
import { formatMultiplier } from '../../game/streak'

interface DungeonCompleteScreenProps {
  rewards: DungeonRewards
  streak: StreakState
  previousStreak: number
  floorsCleared: number
  totalFloors: number
  modifiersUsed: number
  onClaim: () => void
  onViewDetails?: () => void
}

export function DungeonCompleteScreen({
  rewards,
  streak,
  previousStreak,
  floorsCleared,
  totalFloors,
  modifiersUsed,
  onClaim,
  onViewDetails,
}: DungeonCompleteScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [displayedGold, setDisplayedGold] = useState(0)

  const isNewBestStreak = streak.currentStreak > streak.bestStreak - 1 && streak.currentStreak > previousStreak
  const streakIncreased = streak.currentStreak > previousStreak

  // Staggered animation phases
  useEffect(() => {
    if (!containerRef.current) return

    const timeline = gsap.timeline()

    // Phase 0: Container entrance
    timeline.fromTo(containerRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' }
    )

    // Phase 1: Title
    timeline.add(() => setAnimationPhase(1), '+=0.2')

    // Phase 2: Stats
    timeline.add(() => setAnimationPhase(2), '+=0.4')

    // Phase 3: Rewards
    timeline.add(() => setAnimationPhase(3), '+=0.4')

    // Phase 4: Streak
    timeline.add(() => setAnimationPhase(4), '+=0.4')

    // Phase 5: Button
    timeline.add(() => setAnimationPhase(5), '+=0.3')

    return () => { timeline.kill() }
  }, [])

  // Animate gold counter
  useEffect(() => {
    if (animationPhase < 3) return

    const target = rewards.gold
    const duration = 1500
    const startTime = Date.now()

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayedGold(Math.floor(target * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [animationPhase, rewards.gold])

  return (
    <div className="DungeonCompleteScreen fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-warm-950 via-warm-900 to-warm-950">
      {/* Background particles/effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-energy/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-heal/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-2xl p-8 flex flex-col items-center"
      >
        {/* Victory Title */}
        <div className={`transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Icon icon="game-icons:laurel-crown" className="w-12 h-12 text-energy" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-element-void via-heal to-element-void">
              Total Domination
            </h1>
            <Icon icon="game-icons:laurel-crown" className="w-12 h-12 text-energy transform scale-x-[-1]" />
          </div>
          <p className="text-center text-element-void text-lg italic mb-1">
            Every creature fell to your irresistible charm
          </p>
          <p className="text-center text-warm-400">
            All {totalFloors} floors seduced
          </p>
        </div>

        {/* Stats Row */}
        <div className={`
          flex items-center justify-center gap-8 mt-8 mb-6
          transition-all duration-500 ${animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white">{floorsCleared}</span>
            <span className="text-sm text-warm-500">Floors Cleared</span>
          </div>
          <div className="w-px h-12 bg-warm-700" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-purple-400">{modifiersUsed}</span>
            <span className="text-sm text-warm-500">Modifiers Used</span>
          </div>
          <div className="w-px h-12 bg-warm-700" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-cyan-400">{rewards.cardsUnlocked}</span>
            <span className="text-sm text-warm-500">Cards Unlocked</span>
          </div>
        </div>

        {/* Rewards Card */}
        <div className={`
          w-full p-6 rounded-2xl bg-surface/50 border border-energy/30 backdrop-blur-sm
          transition-all duration-500 ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
          <h2 className="text-lg font-medium text-warm-300 mb-4 flex items-center gap-2">
            <Icon icon="game-icons:receive-money" className="w-5 h-5 text-energy" />
            Rewards
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Gold */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-energy/10 border border-energy/20">
              <Icon icon="game-icons:coins-pile" className="w-10 h-10 text-energy" />
              <div>
                <div className="text-3xl font-bold text-energy">{displayedGold}</div>
                <div className="text-xs text-warm-500">
                  Base: {rewards.baseGold} × {formatMultiplier(rewards.multiplier)}
                </div>
              </div>
            </div>

            {/* Bonus Modifier */}
            {rewards.bonusModifier && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Icon icon="game-icons:gem-pendant" className="w-10 h-10 text-purple-400" />
                <div>
                  <div className="font-medium text-purple-300">{rewards.bonusModifier.name}</div>
                  <div className="text-xs text-warm-500 capitalize">{rewards.bonusModifier.rarity} modifier</div>
                </div>
              </div>
            )}

            {/* XP */}
            {rewards.xp > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Icon icon="game-icons:upgrade" className="w-10 h-10 text-cyan-400" />
                <div>
                  <div className="text-2xl font-bold text-cyan-400">+{rewards.xp} XP</div>
                  <div className="text-xs text-warm-500">Experience earned</div>
                </div>
              </div>
            )}

            {/* Heat Reduced */}
            {rewards.heatReduced > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Icon icon="game-icons:ice-cube" className="w-10 h-10 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-blue-400">-{rewards.heatReduced}</div>
                  <div className="text-xs text-warm-500">Heat cooled</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Streak Display */}
        <div className={`
          w-full mt-6
          transition-all duration-500 ${animationPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
          {streakIncreased && (
            <div className="text-center mb-3">
              <span className={`
                inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium
                ${isNewBestStreak ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/50' : 'bg-orange-500/20 text-orange-300'}
              `}>
                <Icon icon={isNewBestStreak ? 'game-icons:trophy' : 'game-icons:flame'} className="w-4 h-4" />
                {isNewBestStreak ? 'New Best Streak!' : 'Streak Extended!'}
              </span>
            </div>
          )}
          <StreakDisplay streak={streak} variant="banner" isAnimating={streakIncreased} />
        </div>

        {/* Action Buttons */}
        <div className={`
          flex gap-4 mt-8
          transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="px-6 py-3 rounded-xl bg-surface border border-warm-600 text-warm-300 hover:text-warm-100 hover:border-warm-500 transition-colors"
            >
              View Details
            </button>
          )}
          <button
            onClick={onClaim}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-energy to-heal text-warm-900 font-bold text-lg hover:from-energy/90 hover:to-heal/90 transition-all shadow-lg shadow-energy/20"
          >
            <Icon icon="game-icons:treasure-map" className="w-6 h-6" />
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  )
}

export default DungeonCompleteScreen
