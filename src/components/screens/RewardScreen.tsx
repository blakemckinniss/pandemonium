import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Card, getCardDefProps } from '../Card/Card'
import { CardPreviewModal } from '../Modal/CardPreviewModal'
import type { CardDefinition, RelicDefinition } from '../../types'
import { getAllCards } from '../../game/cards'
import { getAllRelics } from '../../game/relics'
import { gsap } from '../../lib/animations'
import { generateRandomCard } from '../../game/card-generator'

interface RewardScreenProps {
  floor: number
  gold: number
  ownedRelicIds: string[]
  onAddCard: (cardId: string) => void
  onAddRelic: (relicId: string) => void
  onSkip: () => void
}

export function RewardScreen({ floor, gold, ownedRelicIds, onAddCard, onAddRelic, onSkip }: RewardScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardChoices, setCardChoices] = useState<CardDefinition[]>([])
  const [relicChoice, setRelicChoice] = useState<RelicDefinition | null>(null)
  const [goldReward] = useState(() => 15 + Math.floor(Math.random() * 10))
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [previewCard, setPreviewCard] = useState<CardDefinition | null>(null)

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

  // Generate relic choice on mount (30% chance to offer a relic)
  useEffect(() => {
    if (Math.random() > 0.3) return // 30% chance for relic reward

    const allRelics = getAllRelics().filter((r) => !ownedRelicIds.includes(r.id))
    if (allRelics.length === 0) return

    // Weight by rarity: common 60%, uncommon 30%, rare 10%
    const roll = Math.random()
    let targetRarity: 'common' | 'uncommon' | 'rare' = 'common'
    if (roll > 0.9) targetRarity = 'rare'
    else if (roll > 0.6) targetRarity = 'uncommon'

    let pool = allRelics.filter((r) => r.rarity === targetRarity)
    if (pool.length === 0) pool = allRelics

    const relic = pool[Math.floor(Math.random() * pool.length)]
    setRelicChoice(relic)
  }, [ownedRelicIds])

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
    <div className="RewardScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-warm-900 to-warm-900">
      <h1 className="text-4xl font-bold mb-2 text-heal">Victory!</h1>
      <p className="text-warm-400 mb-8">Floor {floor} cleared</p>

      {/* Rewards row */}
      <div className="flex gap-4 mb-8">
        {/* Gold reward */}
        <div className="px-6 py-3 bg-surface rounded-lg border border-energy">
          <span className="text-energy text-xl">+{goldReward} Gold</span>
          <span className="text-warm-500 ml-2">(Total: {gold + goldReward})</span>
        </div>

        {/* Relic reward */}
        {relicChoice && (
          <button
            onClick={() => onAddRelic(relicChoice.id)}
            className="group px-4 py-3 bg-surface rounded-lg border border-purple-500 hover:bg-purple-900/30 transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-900/50 flex items-center justify-center">
              <Icon icon="game-icons:gem-pendant" className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="text-purple-300 font-medium">{relicChoice.name}</div>
              <div className="text-xs text-warm-400 max-w-48">{relicChoice.description}</div>
            </div>
            <div className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
              +Add
            </div>
          </button>
        )}
      </div>

      {/* Card choices */}
      <p className="text-warm-400 mb-4">Choose a card to add to your deck:</p>

      <div ref={containerRef} className="flex gap-4 mb-8 items-center">
        {cardChoices.map((cardDef) => (
          <div key={cardDef.id} className="RewardCard group relative">
            <button
              className="transition-transform hover:scale-110 hover:-translate-y-2"
              onClick={() => onAddCard(cardDef.id)}
            >
              <Card {...getCardDefProps(cardDef)} variant="hand" playable />
            </button>
            {/* Preview button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreviewCard(cardDef)
              }}
              className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-surface-alt/90 text-warm-300 hover:bg-surface hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Preview card"
            >
              ?
            </button>
          </div>
        ))}

        {/* Generate Card Button */}
        <button
          onClick={() => void handleGenerateCard()}
          disabled={isGenerating}
          className="RewardCard flex flex-col items-center justify-center w-32 h-44 rounded-lg border-2 border-dashed border-warm-600 hover:border-energy hover:bg-surface/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isGenerating ? (
            <div className="animate-spin w-8 h-8 border-2 border-energy border-t-transparent rounded-full" />
          ) : (
            <>
              <span className="text-3xl mb-2">✨</span>
              <span className="text-sm text-warm-400">Generate</span>
              <span className="text-xs text-warm-500">New Card</span>
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
        className="px-6 py-2 text-warm-400 hover:text-white transition-colors"
      >
        Skip reward
      </button>

      {/* Card Preview Modal */}
      <CardPreviewModal
        card={previewCard}
        isOpen={previewCard !== null}
        onClose={() => setPreviewCard(null)}
        onSelect={(card) => onAddCard(card.id)}
        selectLabel="Add to Deck"
      />
    </div>
  )
}

export default RewardScreen
