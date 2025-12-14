import { memo, useLayoutEffect, useRef, useCallback } from 'react'
import { Card } from '../Card/Card'
import type { CardInstance } from '../../types'
import { getEffectiveCardDef } from '../../game/cards'
import { getEffectiveEnergyCost, getEffectiveEnergyCostNumber } from '../../lib/effects'

export interface CardPosition {
  x: number
  y: number
  uid: string
  definitionId: string
}

interface HandProps {
  cards: CardInstance[]
  energy: number
  onPlayCard: (cardUid: string) => void
  onPositionsUpdate?: (positions: Map<string, CardPosition>) => void
}

export const Hand = memo(function Hand({ cards, energy, onPlayCard, onPositionsUpdate }: HandProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate fan rotation for each card position
  const getFanRotation = (index: number, total: number) =>
    (index - (total - 1) / 2) * 3

  // Report card positions after layout
  useLayoutEffect(() => {
    if (!onPositionsUpdate || !containerRef.current) return

    const positions = new Map<string, CardPosition>()
    const cardElements = containerRef.current.querySelectorAll('[data-card-id]')

    cardElements.forEach((el) => {
      const cardId = (el as HTMLElement).dataset.cardId
      const card = cards.find((c) => c.uid === cardId)
      if (!cardId || !card) return

      const rect = el.getBoundingClientRect()
      positions.set(cardId, {
        uid: cardId,
        definitionId: card.definitionId,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    })

    onPositionsUpdate(positions)
  }, [cards, onPositionsUpdate])

  return (
    <div ref={containerRef} className="Hand flex gap-2 justify-center items-end p-4">
      {cards.map((card, index) => (
        <HandCard
          key={card.uid}
          card={card}
          index={index}
          totalCards={cards.length}
          energy={energy}
          onPlayCard={onPlayCard}
          getFanRotation={getFanRotation}
        />
      ))}
    </div>
  )
})

// Memoized individual hand card
const HandCard = memo(function HandCard({
  card,
  index,
  totalCards,
  energy,
  onPlayCard,
  getFanRotation,
}: {
  card: CardInstance
  index: number
  totalCards: number
  energy: number
  onPlayCard: (cardUid: string) => void
  getFanRotation: (index: number, total: number) => number
}) {
  const def = getEffectiveCardDef(card)

  const handleClick = useCallback(() => {
    if (!def) return
    const effectiveCost = getEffectiveEnergyCostNumber(def.energy, card)
    if (energy >= effectiveCost) {
      onPlayCard(card.uid)
    }
  }, [def, card, energy, onPlayCard])

  if (!def) return null

  const effectiveCost = getEffectiveEnergyCostNumber(def.energy, card)
  const canPlay = energy >= effectiveCost
  const fanRotation = getFanRotation(index, totalCards)
  const displayCost = getEffectiveEnergyCost(def.energy, card)

  return (
    <div
      className="HandCard"
      data-card-uid={card.uid}
      data-fan-rotation={fanRotation}
    >
      <Card
        variant="hand"
        theme={def.theme}
        name={def.name}
        description={def.description}
        energy={displayCost}
        rarity={def.rarity}
        upgraded={card.upgraded}
        element={def.element}
        costModified={card.costModifier !== undefined && card.costModifier !== 0}
        ethereal={card.ethereal || def.ethereal}
        retained={card.retained}
        playable={canPlay}
        disabled={!canPlay}
        onClick={handleClick}
        data-card-id={card.uid}
        data-card-target={def.target}
      />
    </div>
  )
})

export default Hand
