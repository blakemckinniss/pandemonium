import { useRef, useEffect, useState, type ReactNode } from 'react'
// useState used for isTransitioning state
import { gsap } from '../../lib/animations'
import type { GamePhase } from '../../types'

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

    // Fade out current content
    gsap.effects.screenFadeOut(container, {
      duration: 0.2,
      onComplete: () => {
        prevPhaseRef.current = phase

        // Small delay to ensure new content is rendered
        requestAnimationFrame(() => {
          // Fade in new content with phase-specific animation
          const enterEffect = phaseEnterEffects[phase] || 'screenFadeIn'

          if (gsap.effects[enterEffect]) {
            gsap.effects[enterEffect](container, {
              onComplete: () => setIsTransitioning(false),
            })
          } else {
            // Fallback to basic fade
            gsap.effects.screenFadeIn(container, {
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
    if (gsap.effects[enterEffect]) {
      gsap.effects[enterEffect](container, {})
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
