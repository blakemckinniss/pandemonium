import { useRef, useEffect, useState, type ReactNode } from 'react'
import { gsap } from '../../lib/animations'
import type { GamePhase } from '../../types'

// Type for registered GSAP effects
type GsapEffect = (target: gsap.TweenTarget, config?: object) => gsap.core.Tween | gsap.core.Timeline
type GsapEffects = Record<string, GsapEffect>

interface ScreenTransitionProps {
  phase: GamePhase
  children: ReactNode
}

// Map phases to their entrance animation effect names
const phaseEnterEffects: Record<GamePhase, string> = {
  menu: 'screenFadeIn',
  roomSelect: 'roomSelectEnter',
  combat: 'combatEnter',
  reward: 'rewardEnter',
  campfire: 'campfireEnter',
  treasure: 'treasureEnter',
  event: 'screenFadeIn',
  shop: 'screenFadeIn',
  dungeonComplete: 'victoryEnter',
  gameOver: 'defeatEnter',
}

export function ScreenTransition({ phase, children }: ScreenTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevPhaseRef = useRef(phase)

  useEffect(() => {
    // Skip if same phase or already transitioning
    if (phase === prevPhaseRef.current || isTransitioning) return

    const container = containerRef.current
    if (!container) {
      prevPhaseRef.current = phase
      return
    }

    setIsTransitioning(true)
    const effects = gsap.effects as GsapEffects

    // Fade out current content
    effects.screenFadeOut(container, {
      duration: 0.2,
      onComplete: () => {
        prevPhaseRef.current = phase

        // Small delay to ensure new content is rendered
        requestAnimationFrame(() => {
          // Fade in new content with phase-specific animation
          const enterEffect = phaseEnterEffects[phase] || 'screenFadeIn'

          if (effects[enterEffect]) {
            effects[enterEffect](container, {
              onComplete: () => setIsTransitioning(false),
            })
          } else {
            // Fallback to basic fade
            effects.screenFadeIn(container, {
              onComplete: () => setIsTransitioning(false),
            })
          }
        })
      },
    })

    // Cleanup
    return () => {
      gsap.killTweensOf(container)
    }
  }, [phase, isTransitioning])

  // Initial render - apply entrance animation
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const enterEffect = phaseEnterEffects[phase] || 'screenFadeIn'
    const effects = gsap.effects as GsapEffects
    if (effects[enterEffect]) {
      effects[enterEffect](container, {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  return (
    <div
      ref={containerRef}
      className="screen-transition w-full h-full"
      style={{ willChange: isTransitioning ? 'opacity, transform, filter' : 'auto' }}
    >
      {children}
    </div>
  )
}

export default ScreenTransition
