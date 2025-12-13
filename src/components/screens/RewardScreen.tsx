import { useEffect, useRef, useState } from 'react'
import { Card } from '../Card/Card'
import type { CardDefinition } from '../../types'
import { getAllCards } from '../../game/cards'
import { getEnergyCost } from '../../lib/effects'
import { gsap } from '../../lib/animations'

interface RewardScreenProps {
  floor: number
  gold: number
  onAddCard: (cardId: string) => void
  onSkip: () => void
}

export function RewardScreen({ floor, gold, onAddCard, onSkip }: RewardScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardChoices, setCardChoices] = useState<CardDefinition[]>([])
  const [goldReward] = useState(() => 15 + Math.floor(Math.random() * 10))

  // Generate card choices on mount
  useEffect(() => {
    const allCards = getAllCards().filter(
      (c) => !['strike', 'defend'].includes(c.id) // Exclude basic cards
    )

    // Pick 3 random cards
    const choices: CardDefinition[] = []
    const available = [...allCards]

    for (let i = 0; i < 3 && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length)
      choices.push(available[idx])
      available.splice(idx, 1)
    }

    setCardChoices(choices)
  }, [])

  // Animate cards appearing
  useEffect(() => {
    if (!containerRef.current || cardChoices.length === 0) return

    const cards = containerRef.current.querySelectorAll('.RewardCard')
    gsap.fromTo(
      cards,
      { y: 100, opacity: 0, rotateY: 180 },
      {
        y: 0,
        opacity: 1,
        rotateY: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'back.out(1.2)',
      }
    )
  }, [cardChoices])

  return (
    <div className="RewardScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
      <h1 className="text-4xl font-bold mb-2 text-heal">Victory!</h1>
      <p className="text-gray-400 mb-8">Floor {floor} cleared</p>

      {/* Gold reward */}
      <div className="mb-8 px-6 py-3 bg-surface rounded-lg border border-energy">
        <span className="text-energy text-xl">+{goldReward} Gold</span>
        <span className="text-gray-500 ml-2">(Total: {gold + goldReward})</span>
      </div>

      {/* Card choices */}
      <p className="text-gray-400 mb-4">Choose a card to add to your deck:</p>

      <div ref={containerRef} className="flex gap-4 mb-8">
        {cardChoices.map((cardDef) => (
          <button
            key={cardDef.id}
            className="RewardCard group transition-transform hover:scale-110 hover:-translate-y-2"
            onClick={() => onAddCard(cardDef.id)}
          >
            <Card
              variant="hand"
              theme={cardDef.theme}
              name={cardDef.name}
              description={cardDef.description}
              energy={getEnergyCost(cardDef.energy)}
              playable
            />
          </button>
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
      >
        Skip reward
      </button>
    </div>
  )
}

export default RewardScreen
