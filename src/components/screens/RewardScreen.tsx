import { useEffect, useRef, useState } from 'react'
import { Card } from '../Card/Card'
import type { CardDefinition } from '../../types'
import { getAllCards } from '../../game/cards'
import { getEnergyCost } from '../../lib/effects'
import { gsap } from '../../lib/animations'
import { generateRandomCard } from '../../game/card-generator'

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
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Generate card choices on mount with rarity weighting
  useEffect(() => {
    const allCards = getAllCards().filter(
      (c) => !['strike', 'defend'].includes(c.id) // Exclude basic cards
    )

    // Group cards by rarity
    const byRarity: Record<string, CardDefinition[]> = {
      common: [],
      uncommon: [],
      rare: [],
    }
    for (const card of allCards) {
      const rarity = card.rarity ?? 'common'
      if (byRarity[rarity]) {
        byRarity[rarity].push(card)
      } else {
        byRarity.common.push(card)
      }
    }

    // Rarity weights: common 60%, uncommon 30%, rare 10%
    const rarityWeights = [
      { rarity: 'common', weight: 0.6 },
      { rarity: 'uncommon', weight: 0.3 },
      { rarity: 'rare', weight: 0.1 },
    ]

    // Pick 3 cards with weighted rarity selection
    const choices: CardDefinition[] = []
    const usedIds = new Set<string>()

    for (let i = 0; i < 3; i++) {
      // Roll for rarity
      const roll = Math.random()
      let cumulative = 0
      let selectedRarity = 'common'

      for (const { rarity, weight } of rarityWeights) {
        cumulative += weight
        if (roll < cumulative) {
          selectedRarity = rarity
          break
        }
      }

      // Get available cards of that rarity (not already chosen)
      let pool = byRarity[selectedRarity].filter((c) => !usedIds.has(c.id))

      // Fallback to any available card if pool empty
      if (pool.length === 0) {
        pool = allCards.filter((c) => !usedIds.has(c.id))
      }

      if (pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length)
        const card = pool[idx]
        choices.push(card)
        usedIds.add(card.id)
      }
    }

    setCardChoices(choices)
  }, [])

  // Handle generating a new card via LLM
  async function handleGenerateCard() {
    setIsGenerating(true)
    setGenerationError(null)
    try {
      const newCard = await generateRandomCard()
      setCardChoices((prev) => [...prev, newCard])
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate card')
    } finally {
      setIsGenerating(false)
    }
  }

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

      <div ref={containerRef} className="flex gap-4 mb-8 items-center">
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
              rarity={cardDef.rarity}
              element={cardDef.element}
              ethereal={cardDef.ethereal}
              playable
            />
          </button>
        ))}

        {/* Generate Card Button */}
        <button
          onClick={handleGenerateCard}
          disabled={isGenerating}
          className="RewardCard flex flex-col items-center justify-center w-32 h-44 rounded-lg border-2 border-dashed border-gray-600 hover:border-energy hover:bg-surface/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isGenerating ? (
            <div className="animate-spin w-8 h-8 border-2 border-energy border-t-transparent rounded-full" />
          ) : (
            <>
              <span className="text-3xl mb-2">✨</span>
              <span className="text-sm text-gray-400">Generate</span>
              <span className="text-xs text-gray-500">New Card</span>
            </>
          )}
        </button>
      </div>

      {/* Generation error */}
      {generationError && (
        <p className="text-damage text-sm mb-4">{generationError}</p>
      )}

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
