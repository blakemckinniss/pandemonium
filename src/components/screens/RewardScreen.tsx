import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Card, getCardDefProps } from '../Card/Card'
import { CardPreviewModal } from '../Modal/CardPreviewModal'
import type { CardDefinition, RelicDefinition } from '../../types'
import { getAllRelics } from '../../game/relics'
import { gsap } from '../../lib/animations'
import { getCachedCards, getCacheSize } from '../../game/card-cache'

// AI-first: ALL rewards are freshly generated (served from cache when available)
const CARDS_PER_REWARD = 3

interface RewardScreenProps {
  floor: number
  gold: number
  goldMultiplier?: number
  ownedRelicIds: string[]
  onAddCard: (cardId: string) => void
  onAddRelic: (relicId: string) => void
  onSkip: () => void
}

export function RewardScreen({ floor, gold, goldMultiplier = 1, ownedRelicIds, onAddCard, onAddRelic, onSkip }: RewardScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardChoices, setCardChoices] = useState<CardDefinition[]>([])
  const [relicChoice, setRelicChoice] = useState<RelicDefinition | null>(null)
  const [goldReward] = useState(() => Math.floor((15 + Math.floor(Math.random() * 10)) * goldMultiplier))
  const [isGenerating, setIsGenerating] = useState(true) // Start generating immediately
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [previewCard, setPreviewCard] = useState<CardDefinition | null>(null)

  // Get cards from cache (instant if primed, generates if needed)
  useEffect(() => {
    let cancelled = false

    async function loadCards() {
      setIsGenerating(true)
      setGenerationError(null)

      // Check cache first - if full, this is instant
      const cacheSize = getCacheSize()
      if (cacheSize >= CARDS_PER_REWARD) {
        setGenerationProgress(CARDS_PER_REWARD) // Show as complete
      }

      try {
        const cards = await getCachedCards(CARDS_PER_REWARD)
        if (!cancelled) {
          setCardChoices(cards)
          setGenerationProgress(cards.length)
          setIsGenerating(false)
          if (cards.length === 0) {
            setGenerationError('Failed to generate cards. Try again?')
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Card loading failed:', err)
          setIsGenerating(false)
          setGenerationError('Failed to generate cards. Try again?')
        }
      }
    }

    void loadCards()
    return () => { cancelled = true }
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
    setRelicChoice(relic) // eslint-disable-line react-hooks/set-state-in-effect -- Intentional initialization from random selection
  }, [ownedRelicIds])

  // Retry loading cards
  async function handleRetryGeneration() {
    setCardChoices([])
    setIsGenerating(true)
    setGenerationError(null)
    setGenerationProgress(0)

    try {
      const cards = await getCachedCards(CARDS_PER_REWARD)
      setCardChoices(cards)
      setGenerationProgress(cards.length)
      setIsGenerating(false)
      if (cards.length === 0) {
        setGenerationError('Failed to generate cards. Try again?')
      }
    } catch {
      setIsGenerating(false)
      setGenerationError('Failed to generate cards. Try again?')
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

  // Animate reward items (gold, relic) appearing
  useEffect(() => {
    const rewardsRow = document.querySelector('.RewardsRow')
    if (!rewardsRow) return

    const items = rewardsRow.querySelectorAll('.RewardItem')
    if (items.length === 0) return

    gsap.fromTo(
      items,
      { scale: 0, opacity: 0, rotation: -10 },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.4,
        stagger: 0.12,
        ease: 'back.out(2)',
        delay: 0.3, // After title appears
      }
    )
  }, [relicChoice])

  return (
    <div className="RewardScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-warm-900 to-warm-900">
      <h1 className="text-4xl font-bold mb-2 text-heal">Victory!</h1>
      <p className="text-warm-400 mb-8">Floor {floor} cleared</p>

      {/* Rewards row */}
      <div className="RewardsRow flex gap-4 mb-8">
        {/* Gold reward */}
        <div className="RewardItem px-6 py-3 bg-surface rounded-lg border border-energy">
          <span className="text-energy text-xl">+{goldReward} Gold</span>
          <span className="text-warm-500 ml-2">(Total: {gold + goldReward})</span>
        </div>

        {/* Relic reward */}
        {relicChoice && (
          <button
            onClick={() => onAddRelic(relicChoice.id)}
            className="RewardItem group px-4 py-3 bg-surface rounded-lg border border-purple-500 hover:bg-purple-900/30 transition-colors flex items-center gap-3"
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
      <p className="text-warm-400 mb-4">
        {isGenerating
          ? `Generating unique cards... (${generationProgress}/${CARDS_PER_REWARD})`
          : 'Choose a card to add to your deck:'}
      </p>

      <div ref={containerRef} className="flex gap-4 mb-8 items-center min-h-48">
        {/* Loading placeholders while generating */}
        {isGenerating && cardChoices.length < CARDS_PER_REWARD && (
          Array.from({ length: CARDS_PER_REWARD - cardChoices.length }, (_, i) => (
            <div
              key={`placeholder-${i}`}
              className="w-32 h-44 rounded-lg border-2 border-dashed border-warm-700 bg-surface/30 flex flex-col items-center justify-center animate-pulse"
            >
              <div className="animate-spin w-6 h-6 border-2 border-energy border-t-transparent rounded-full mb-2" />
              <span className="text-xs text-warm-500">Creating...</span>
            </div>
          ))
        )}

        {/* Generated cards */}
        {cardChoices.map((cardDef) => (
          <div key={cardDef.id} className="RewardCard group relative">
            <button
              className="transition-transform hover:scale-110 hover:-translate-y-2"
              onClick={() => onAddCard(cardDef.id)}
            >
              <Card {...getCardDefProps(cardDef)} variant="hand" playable />
            </button>
            {/* AI badge */}
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-energy/90 text-white text-xs rounded-full font-medium shadow-lg">
              ✨ AI
            </div>
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
      </div>

      {/* Generation error with retry */}
      {generationError && (
        <div className="flex items-center gap-3 mb-4">
          <p className="text-damage text-sm">{generationError}</p>
          <button
            onClick={() => void handleRetryGeneration()}
            className="px-3 py-1 text-sm bg-energy/20 text-energy rounded hover:bg-energy/30 transition-colors"
          >
            Retry
          </button>
        </div>
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
