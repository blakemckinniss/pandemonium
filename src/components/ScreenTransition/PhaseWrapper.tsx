import { useRef, useEffect, type ReactNode } from 'react'
import { gsap } from '../../lib/animations'
import type { GamePhase } from '../../types'

interface PhaseWrapperProps {
  phase: GamePhase
  children: ReactNode
  className?: string
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

/**
 * Wraps phase content and plays entrance animation on mount.
 * Simple wrapper that each phase return can use.
 */
export function PhaseWrapper({ phase, children, className = '' }: PhaseWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const enterEffect = phaseEnterEffects[phase] || 'screenFadeIn'

    // Apply entrance animation
    if (gsap.effects[enterEffect]) {
      gsap.effects[enterEffect](container, {})
    } else {
      // Fallback
      gsap.effects.screenFadeIn(container, {})
    }

    return () => {
      gsap.killTweensOf(container)
    }
  }, [phase])

  return (
    <div ref={containerRef} className={`phase-wrapper ${className}`}>
      {children}
    </div>
  )
}

export default PhaseWrapper
