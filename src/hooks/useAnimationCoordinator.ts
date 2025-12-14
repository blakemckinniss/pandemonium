import { useState, useRef, useCallback } from 'react'
import { gsap } from '../lib/dragdrop'

export interface AnimationCoordinator {
  // State
  isAnimating: boolean

  // Refs
  containerRef: React.RefObject<HTMLDivElement | null>
  handRef: React.RefObject<HTMLDivElement | null>

  // Animation utilities
  animateDiscardHand: (onComplete: () => void) => void
  animateDealCards: () => void
  queryContainer: (selector: string) => Element | null
  queryHand: (selector: string) => NodeListOf<Element> | null
}

export function useAnimationCoordinator(): AnimationCoordinator {
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const handRef = useRef<HTMLDivElement | null>(null)

  const animateDiscardHand = useCallback((onComplete: () => void) => {
    const handCards = handRef.current?.querySelectorAll('.Card')
    if (handCards && handCards.length > 0) {
      setIsAnimating(true)
      ;(gsap.effects as Record<string, (el: NodeListOf<Element>, opts: object) => void>).discardHand(handCards, {
        onComplete: () => {
          onComplete()
          setTimeout(() => setIsAnimating(false), 600)
        },
      })
    } else {
      onComplete()
    }
  }, [])

  const animateDealCards = useCallback(() => {
    const handCards = handRef.current?.querySelectorAll('.HandCard')
    if (handCards && handCards.length > 0) {
      ;(gsap.effects as Record<string, (el: NodeListOf<Element>, opts: object) => void>).dealCards(handCards, { stagger: 0.08 })
    }
  }, [])

  const queryContainer = useCallback((selector: string): Element | null => {
    return containerRef.current?.querySelector(selector) ?? null
  }, [])

  const queryHand = useCallback((selector: string): NodeListOf<Element> | null => {
    return handRef.current?.querySelectorAll(selector) ?? null
  }, [])

  return {
    isAnimating,
    containerRef,
    handRef,
    animateDiscardHand,
    animateDealCards,
    queryContainer,
    queryHand,
  }
}
