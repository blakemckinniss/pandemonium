import { useState, useCallback } from 'react'
import { Modal } from './Modal'
import { Card } from '../Card/Card'
import { getEffectiveCardDef } from '../../game/cards'
import { getEnergyCost } from '../../lib/effects'
import type { CardInstance, CardDefinition } from '../../types'

export type SelectionMode = 'pick' | 'scry' | 'discard' | 'discover'

// Get unique identifier for a card (uid for instance, id for definition)
function getCardKey(card: CardInstance | CardDefinition): string {
  return 'uid' in card ? card.uid : card.id
}

interface CardSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  cards: CardInstance[] | CardDefinition[]
  minSelect?: number
  maxSelect?: number
  mode?: SelectionMode
  onConfirm: (selectedIds: string[], discardedIds?: string[]) => void
  confirmText?: string
  allowSkip?: boolean
}

export function CardSelectionModal({
  isOpen,
  onClose,
  title,
  cards,
  minSelect = 1,
  maxSelect = 1,
  mode = 'pick',
  onConfirm,
  confirmText = 'Confirm',
  allowSkip = false,
}: CardSelectionModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scryDiscard, setScryDiscard] = useState<Set<string>>(new Set())

  // Reset state when modal opens
  const handleClose = useCallback(() => {
    setSelected(new Set())
    setScryDiscard(new Set())
    onClose()
  }, [onClose])

  const toggleSelect = useCallback((key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else if (next.size < maxSelect) {
        next.add(key)
      }
      return next
    })
  }, [maxSelect])

  const toggleScryDiscard = useCallback((key: string) => {
    setScryDiscard(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (mode === 'scry') {
      // For scry: selected = keep on top in order, discarded = move to bottom/discard
      const kept = cards
        .filter(c => !scryDiscard.has(getCardKey(c)))
        .map(c => getCardKey(c))
      const discarded = Array.from(scryDiscard)
      onConfirm(kept, discarded)
    } else {
      // For pick/discover: return selected card ids
      onConfirm(Array.from(selected))
    }
    handleClose()
  }, [mode, cards, selected, scryDiscard, onConfirm, handleClose])

  const canConfirm = mode === 'scry'
    ? true // Scry can always confirm
    : selected.size >= minSelect && selected.size <= maxSelect

  const selectionHint = mode === 'scry'
    ? 'Click cards to mark for discard'
    : mode === 'discover'
      ? 'Choose a card to add'
      : minSelect === maxSelect
        ? `Select ${minSelect} card${minSelect > 1 ? 's' : ''}`
        : `Select ${minSelect}-${maxSelect} cards`

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      {/* Selection hint */}
      <div className="text-center text-sm text-gray-400 mb-4">
        {selectionHint}
        {(mode === 'pick' || mode === 'discover') && (
          <span className="ml-2 text-energy">
            ({selected.size}/{maxSelect})
          </span>
        )}
        {mode === 'scry' && scryDiscard.size > 0 && (
          <span className="ml-2 text-damage">
            ({scryDiscard.size} to discard)
          </span>
        )}
      </div>

      {/* Card grid */}
      <div className="CardSelectionModal-grid">
        {cards.map((card, index) => {
          const key = getCardKey(card)
          // For CardInstance, look up definition; for CardDefinition, use directly
          const isDefinition = 'effects' in card
          const def = isDefinition ? card : getEffectiveCardDef(card)
          if (!def) return null

          const isSelected = mode === 'scry'
            ? scryDiscard.has(key)
            : selected.has(key)

          return (
            <div
              key={key}
              className={`CardSelectionModal-item ${isSelected ? 'is-selected' : ''}`}
              onClick={() => mode === 'scry' ? toggleScryDiscard(key) : toggleSelect(key)}
            >
              {mode === 'scry' && (
                <div className="CardSelectionModal-position">
                  {index + 1}
                </div>
              )}
              <Card
                variant="hand"
                theme={def.theme}
                name={def.name}
                cardId={def.id}
                description={def.description}
                energy={getEnergyCost(def.energy)}
                rarity={def.rarity}
                upgraded={isDefinition ? false : card.upgraded}
                element={def.element}
              />
              {isSelected && (
                <div className={`CardSelectionModal-check ${mode === 'scry' ? 'is-discard' : ''}`}>
                  {mode === 'scry' ? '✕' : '✓'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-6">
        {allowSkip && (
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-surface-alt rounded-lg text-gray-300 hover:bg-surface-alt/80 transition"
          >
            Skip
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="px-6 py-2 bg-energy text-black font-bold rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}

export default CardSelectionModal
