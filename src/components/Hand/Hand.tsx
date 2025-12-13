import { Card } from '../Card/Card'
import type { CardInstance } from '../../types'
import { getCardDefinition } from '../../game/cards'

interface HandProps {
  cards: CardInstance[]
  energy: number
  onPlayCard: (cardUid: string) => void
}

export function Hand({ cards, energy, onPlayCard }: HandProps) {
  return (
    <div className="Hand flex gap-2 justify-center items-end p-4">
      {cards.map((card, index) => {
        const def = getCardDefinition(card.definitionId)
        if (!def) return null

        const canPlay = energy >= def.energy

        return (
          <div
            key={card.uid}
            className="transition-transform hover:-translate-y-4"
            style={{
              transform: `rotate(${(index - (cards.length - 1) / 2) * 3}deg)`,
            }}
          >
            <Card
              variant="hand"
              theme={def.theme}
              name={def.name}
              description={def.description}
              energy={def.energy}
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
