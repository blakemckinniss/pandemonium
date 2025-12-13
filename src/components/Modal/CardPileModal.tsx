import { Modal } from './Modal'
import { Card } from '../Card/Card'
import { getCardDefinition } from '../../game/cards'
import { getEnergyCost } from '../../lib/effects'
import type { CardInstance } from '../../types'

export type PileType = 'draw' | 'discard' | 'exhaust'

interface CardPileModalProps {
  isOpen: boolean
  onClose: () => void
  pileType: PileType
  cards: CardInstance[]
}

const PILE_CONFIG: Record<PileType, { title: string; icon: string; emptyMessage: string }> = {
  draw: {
    title: 'Draw Pile',
    icon: 'game-icons:card-pickup',
    emptyMessage: 'Draw pile is empty',
  },
  discard: {
    title: 'Discard Pile',
    icon: 'game-icons:card-discard',
    emptyMessage: 'No cards discarded yet',
  },
  exhaust: {
    title: 'Exhaust Pile',
    icon: 'game-icons:card-burn',
    emptyMessage: 'No cards exhausted yet',
  },
}

export function CardPileModal({ isOpen, onClose, pileType, cards }: CardPileModalProps) {
  const config = PILE_CONFIG[pileType]

  // Group cards by definition + upgraded status for cleaner display
  const groupedCards = cards.reduce((acc, card) => {
    const def = getCardDefinition(card.definitionId)
    if (!def) return acc

    // Separate upgraded and non-upgraded versions
    const key = `${card.definitionId}:${card.upgraded ? 'upgraded' : 'base'}`
    if (!acc[key]) {
      acc[key] = { def, count: 0, upgraded: card.upgraded }
    }
    acc[key].count++
    return acc
  }, {} as Record<string, { def: ReturnType<typeof getCardDefinition>; count: number; upgraded: boolean }>)

  const sortedGroups = Object.values(groupedCards).sort((a, b) => {
    // Sort by theme, then name
    const themeOrder = { attack: 0, skill: 1, power: 2, curse: 3, status: 4 }
    const aOrder = themeOrder[a.def?.theme ?? 'status'] ?? 5
    const bOrder = themeOrder[b.def?.theme ?? 'status'] ?? 5
    if (aOrder !== bOrder) return aOrder - bOrder
    return (a.def?.name ?? '').localeCompare(b.def?.name ?? '')
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${config.title} (${cards.length} cards)`}
      size="lg"
    >
      {cards.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {config.emptyMessage}
        </div>
      ) : (
        <div className="CardPileModal-grid">
          {sortedGroups.map(({ def, count, upgraded }) => {
            if (!def) return null
            // Get effective definition (applies upgradesTo if upgraded)
            const effectiveDef = upgraded && def.upgradesTo
              ? { ...def, ...def.upgradesTo }
              : def
            const key = `${def.id}:${upgraded ? 'upgraded' : 'base'}`
            return (
              <div key={key} className="CardPileModal-item">
                <div className="CardPileModal-card">
                  <Card
                    variant="hand"
                    theme={effectiveDef.theme}
                    name={effectiveDef.name}
                    description={effectiveDef.description}
                    energy={getEnergyCost(effectiveDef.energy)}
                    rarity={effectiveDef.rarity}
                    upgraded={upgraded}
                  />
                </div>
                {count > 1 && (
                  <div className="CardPileModal-count">
                    x{count}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

export default CardPileModal
