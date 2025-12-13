import { Card } from '../Card/Card'
import type { CardInstance } from '../../types'
import { getCardDefinition } from '../../game/cards'
import { getEnergyCost, getEnergyCostNumber } from '../../lib/effects'

interface HandProps {
  cards: CardInstance[]
  energy: number
  onPlayCard: (cardUid: string) => void
}

export function Hand({ cards, energy, onPlayCard }: HandProps) {
  // Calculate fan rotation for each card position
  const getFanRotation = (index: number, total: number) =>
    (index - (total - 1) / 2) * 3

  return (
    <div className="Hand flex gap-2 justify-center items-end p-4">
      {cards.map((card, index) => {
        const def = getCardDefinition(card.definitionId)
        if (!def) return null

        const energyCost = getEnergyCostNumber(def.energy)
        const canPlay = energy >= energyCost
        const fanRotation = getFanRotation(index, cards.length)

        return (
          <div
            key={card.uid}
            className="HandCard"
            data-fan-rotation={fanRotation}
          >
            <Card
              variant="hand"
              theme={def.theme}
              name={def.name}
              description={def.description}
              energy={getEnergyCost(def.energy)}
              playable={canPlay}
              disabled={!canPlay}
              onClick={() => canPlay && onPlayCard(card.uid)}
              data-card-id={card.uid}
              data-card-target={def.target}
            />
          </div>
        )
      })}
    </div>
  )
}

export default Hand
