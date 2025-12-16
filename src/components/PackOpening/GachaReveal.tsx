/**
 * GachaReveal - Full anime-style pack opening experience
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import gsap from 'gsap'
import { Card, getCardDefProps } from '../Card/Card'
import {
  getRevealConfig,
  createAnticipationTimeline,
  createPackBurstTimeline,
  createCardRevealTimeline,
  createShakeTimeline,
  createFlashTimeline,
  createGlowPulseTimeline,
  createHeroCelebrationTimeline,
  sortCardsForReveal,
  isSpecialRarity,
} from '../../lib/gacha-animations'
import type { CardDefinition } from '../../types'

// Rarity colors for effects
const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#3b82f6',
  rare: '#eab308',
  'ultra-rare': '#a855f7',
  legendary: '#f97316',
  mythic: '#ec4899',
  ancient: '#10b981',
}

type Phase = 'idle' | 'anticipation' | 'burst' | 'revealing' | 'complete'

interface GachaRevealProps {
  cards: CardDefinition[]
  onComplete: () => void
  onSkip?: () => void
}

export function GachaReveal({ cards, onComplete, onSkip }: GachaRevealProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealedIndex, setRevealedIndex] = useState(-1)
  const [sortedCards, setSortedCards] = useState<CardDefinition[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const packRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Sort cards on mount (commons first, legendary last for drama)
  useEffect(() => {
    setSortedCards(sortCardsForReveal(cards))
  }, [cards])

  // Start the ceremony
  const startCeremony = useCallback(() => {
    if (phase !== 'idle' || sortedCards.length === 0) return

    setPhase('anticipation')

    const masterTimeline = gsap.timeline({
      onComplete: () => {
        setPhase('complete')
        onComplete()
      },
    })
    timelineRef.current = masterTimeline

    // Phase 1: Anticipation
    if (packRef.current) {
      masterTimeline.add(createAnticipationTimeline(packRef.current))
    }

    // Phase 2: Pack Burst
    masterTimeline.add(() => setPhase('burst'))
    if (packRef.current && flashRef.current) {
      masterTimeline.add(
        createPackBurstTimeline(packRef.current, () => {
          if (flashRef.current) {
            createFlashTimeline(flashRef.current, '#fbbf24').play()
          }
        })
      )
    }

    // Phase 3: Card Reveals
    masterTimeline.add(() => setPhase('revealing'))

    sortedCards.forEach((card, index) => {
      const cardEl = cardRefs.current[index]
      if (!cardEl) return

      const rarity = card.rarity || 'common'
      const config = getRevealConfig(rarity)
      const isHero = card.theme === 'hero'

      // Add reveal animation
      masterTimeline.add(
        createCardRevealTimeline(cardEl, rarity, () => {
          setRevealedIndex(index)
        })
      )

      // Add effects based on rarity
      if (config.shake && containerRef.current) {
        masterTimeline.add(createShakeTimeline(containerRef.current, isHero ? 10 : 5), '<0.1')
      }

      if (config.flash && flashRef.current) {
        masterTimeline.add(
          createFlashTimeline(flashRef.current, RARITY_COLORS[rarity]),
          '<'
        )
      }

      // Glow pulse for rare+
      if (isSpecialRarity(rarity)) {
        masterTimeline.add(
          createGlowPulseTimeline(cardEl, RARITY_COLORS[rarity]),
          '<0.2'
        )
      }

      // Hero gets extra celebration
      if (isHero && containerRef.current) {
        masterTimeline.add(createHeroCelebrationTimeline(cardEl, containerRef.current))
      }

      // Gap between cards
      masterTimeline.add(() => {}, `+=${0.3}`)
    })

    // Hold at end
    masterTimeline.add(() => {}, '+=1')

  }, [phase, sortedCards, onComplete])

  // Auto-start on mount
  useEffect(() => {
    if (sortedCards.length > 0 && phase === 'idle') {
      const timer = setTimeout(startCeremony, 500)
      return () => clearTimeout(timer)
    }
  }, [sortedCards, phase, startCeremony])

  // Skip handler
  const handleSkip = () => {
    if (timelineRef.current) {
      timelineRef.current.progress(1)
    }
    setPhase('complete')
    onSkip?.()
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
    >
      {/* Screen Flash Overlay */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none opacity-0 z-10"
      />

      {/* Ambient particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-energy/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Pack Image (shown during anticipation) */}
      {(phase === 'idle' || phase === 'anticipation') && (
        <div
          ref={packRef}
          className="relative w-48 h-64 bg-gradient-to-br from-yellow-600 to-amber-800 rounded-xl border-4 border-yellow-500 shadow-2xl flex items-center justify-center cursor-pointer transform-gpu"
          onClick={phase === 'idle' ? startCeremony : undefined}
          style={{ perspective: '1000px' }}
        >
          <div className="text-center">
            <Icon icon="mdi:cards" className="text-6xl text-yellow-300 mb-2" />
            <p className="text-yellow-200 font-bold">CARD PACK</p>
            <p className="text-yellow-300/70 text-sm">{cards.length} Cards</p>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-yellow-400/20 to-transparent" />
        </div>
      )}

      {/* Cards Grid (shown during revealing/complete) */}
      {(phase === 'revealing' || phase === 'complete') && (
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl p-4">
          {sortedCards.map((card, index) => {
            const rarity = card.rarity || 'common'
            const isRevealed = index <= revealedIndex

            return (
              <div
                key={`${card.id}-${index}`}
                ref={(el) => (cardRefs.current[index] = el)}
                className="w-36 transform-gpu"
                style={{
                  opacity: 0,
                  transform: 'rotateY(180deg) scale(0.6)',
                  perspective: '1000px',
                }}
              >
                {/* Card Back (before reveal) */}
                {!isRevealed && (
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border-2 border-indigo-500 flex items-center justify-center">
                    <Icon icon="mdi:help-circle" className="text-4xl text-indigo-400/50" />
                  </div>
                )}

                {/* Card Front */}
                {isRevealed && (
                  <div>
                    <Card {...getCardDefProps(card)} variant="hand" />
                    <div className="text-center mt-2">
                      <span
                        className="text-xs font-bold uppercase"
                        style={{ color: RARITY_COLORS[rarity] }}
                      >
                        {rarity}
                      </span>
                      {card.theme === 'hero' && (
                        <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs mt-1">
                          <Icon icon="mdi:star" />
                          HERO!
                          <Icon icon="mdi:star" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Phase indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        {phase === 'anticipation' && (
          <p className="text-yellow-400 animate-pulse text-lg">Opening...</p>
        )}
        {phase === 'revealing' && (
          <p className="text-gray-400">
            Card {Math.min(revealedIndex + 1, sortedCards.length)} of {sortedCards.length}
          </p>
        )}
        {phase === 'complete' && (
          <p className="text-energy font-bold text-lg">Pack Complete!</p>
        )}
      </div>

      {/* Skip Button */}
      {phase !== 'idle' && phase !== 'complete' && (
        <button
          onClick={handleSkip}
          className="absolute bottom-8 right-8 px-4 py-2 bg-gray-800/80 text-gray-400 rounded-lg hover:text-white hover:bg-gray-700 transition-colors"
        >
          <Icon icon="mdi:skip-next" className="inline mr-1" />
          Skip
        </button>
      )}

      {/* Click to start hint */}
      {phase === 'idle' && (
        <p className="absolute bottom-16 text-gray-500 animate-bounce">
          Click pack to open!
        </p>
      )}
    </div>
  )
}

export default GachaReveal
