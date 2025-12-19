import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Card, getCardDefProps } from '../Card/Card'
import { getEffectiveCardDef } from '../../game/cards'
import { gsap } from '../../lib/animations'
import type { CardInstance, HeroState } from '../../types'

interface CampfireScreenProps {
  hero: HeroState
  deck: CardInstance[]
  onRest: () => void
  onSmith: (cardUid: string) => void
  onSkip: () => void
}

export function CampfireScreen({ hero, deck, onRest, onSmith, onSkip }: CampfireScreenProps) {
  const [mode, setMode] = useState<'choice' | 'smith'>('choice')
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Heal amount (30% of max HP)
  const healAmount = Math.floor(hero.maxHealth * 0.3)

  // Get upgradeable cards (non-upgraded cards in deck)
  const upgradeableCards = deck.filter(card => {
    const def = getEffectiveCardDef(card)
    return def && !card.upgraded && def.upgradesTo
  })

  // Animate fire glow
  useEffect(() => {
    if (!containerRef.current) return
    const fireGlow = containerRef.current.querySelector('.fire-glow')
    if (fireGlow) {
      gsap.to(fireGlow, {
        opacity: 0.6,
        scale: 1.1,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    }
  }, [])

  // Animate cards appearing in smith mode
  useEffect(() => {
    if (mode !== 'smith' || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.smith-card')
    gsap.fromTo(
      cards,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.2)' }
    )
  }, [mode])

  // Animate choice buttons appearing
  useEffect(() => {
    if (mode !== 'choice' || !containerRef.current) return
    const buttons = containerRef.current.querySelectorAll('.campfire-option')
    gsap.fromTo(
      buttons,
      { y: 40, opacity: 0, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: 'back.out(1.3)',
        delay: 0.2,
      }
    )
  }, [mode])

  const handleSmithConfirm = () => {
    if (selectedCard) {
      onSmith(selectedCard)
    }
  }

  if (mode === 'smith') {
    return (
      <div ref={containerRef} className="CampfireScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-warm-900 to-warm-900">
        <h1 className="text-3xl font-bold mb-2 text-energy">Smith</h1>
        <p className="text-warm-400 mb-6">Choose a card to upgrade</p>

        {upgradeableCards.length === 0 ? (
          <p className="text-warm-500 mb-8">No cards available to upgrade</p>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center max-w-4xl mb-8 px-4">
            {upgradeableCards.map(card => {
              const def = getEffectiveCardDef(card)
              if (!def) return null
              const isSelected = selectedCard === card.uid

              return (
                <button
                  key={card.uid}
                  onClick={() => setSelectedCard(card.uid)}
                  className={`smith-card transition-all ${
                    isSelected
                      ? 'scale-110 -translate-y-2'
                      : 'hover:scale-105 hover:-translate-y-1'
                  }`}
                >
                  <Card
                    {...getCardDefProps(def)}
                    variant="hand"
                    playable={isSelected}
                  />
                </button>
              )
            })}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setMode('choice')}
            className="px-6 py-3 bg-surface border border-warm-600 rounded-lg text-warm-300 hover:bg-surface-alt transition"
          >
            Back
          </button>
          <button
            onClick={handleSmithConfirm}
            disabled={!selectedCard}
            className="px-8 py-3 bg-energy text-black font-bold rounded-lg hover:brightness-110 transition disabled:grayscale disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Upgrade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="CampfireScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-warm-900 via-orange-950/20 to-warm-900">
      {/* Fire visual */}
      <div className="relative mb-8">
        <div className="fire-glow absolute inset-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-40" />
        <Icon
          icon="game-icons:campfire"
          className="w-32 h-32 text-orange-400 relative z-10 drop-shadow-[0_0_20px_rgba(251,146,60,0.5)]"
        />
      </div>

      <h1 className="text-4xl font-bold mb-2 text-orange-300">Campfire</h1>
      <p className="text-warm-400 mb-8">Take a moment to rest</p>

      {/* Options */}
      <div className="flex gap-6">
        {/* Rest option */}
        <button
          onClick={onRest}
          className="campfire-option group flex flex-col items-center p-6 bg-surface border-2 border-warm-700 rounded-xl hover:border-heal hover:bg-surface-alt transition-all w-48"
        >
          <Icon
            icon="game-icons:health-potion"
            className="w-16 h-16 text-heal mb-3 group-hover:scale-110 transition-transform"
          />
          <span className="text-xl font-bold text-heal mb-1">Rest</span>
          <span className="text-warm-400 text-sm">Heal {healAmount} HP</span>
          <span className="text-warm-500 text-xs">(30% of max)</span>
        </button>

        {/* Smith option */}
        <button
          onClick={() => setMode('smith')}
          disabled={upgradeableCards.length === 0}
          className="campfire-option group flex flex-col items-center p-6 bg-surface border-2 border-warm-700 rounded-xl hover:border-energy hover:bg-surface-alt transition-all w-48 disabled:grayscale disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon
            icon="game-icons:anvil"
            className="w-16 h-16 text-energy mb-3 group-hover:scale-110 transition-transform"
          />
          <span className="text-xl font-bold text-energy mb-1">Smith</span>
          <span className="text-warm-400 text-sm">Upgrade a card</span>
          <span className="text-warm-500 text-xs">({upgradeableCards.length} available)</span>
        </button>
      </div>

      {/* Skip option */}
      <button
        onClick={onSkip}
        className="mt-8 px-4 py-2 text-warm-500 hover:text-warm-300 transition"
      >
        Skip and continue
      </button>
    </div>
  )
}

export default CampfireScreen
