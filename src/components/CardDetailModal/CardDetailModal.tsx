import { Icon } from '@iconify/react'
import { Card, getCardDefProps } from '../Card/Card'
import type { CardDefinition } from '../../types'

// Rarity color mapping
const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-blue-400',
  rare: 'text-yellow-400',
  'ultra-rare': 'text-purple-400',
  legendary: 'text-orange-400',
  mythic: 'text-pink-400',
  ancient: 'text-emerald-400',
}

// Element color and icon mapping
const ELEMENT_CONFIG: Record<string, { color: string; icon: string }> = {
  physical: { color: 'text-gray-300', icon: 'mdi:fist' },
  fire: { color: 'text-orange-400', icon: 'mdi:fire' },
  ice: { color: 'text-cyan-400', icon: 'mdi:snowflake' },
  lightning: { color: 'text-yellow-300', icon: 'mdi:lightning-bolt' },
  void: { color: 'text-purple-400', icon: 'mdi:circle-off-outline' },
}

// Theme icons
const THEME_ICONS: Record<string, string> = {
  attack: 'mdi:sword',
  skill: 'mdi:shield',
  power: 'mdi:flash',
  curse: 'mdi:skull',
  status: 'mdi:alert-circle',
  hero: 'mdi:account-star',
  enemy: 'mdi:ghost',
}

interface CardDetailModalProps {
  card: CardDefinition
  collectionData?: {
    quantity: number
    obtainedAt: Date
    source: string
  }
  onClose: () => void
  onAddToDeck?: () => void
}

export function CardDetailModal({
  card,
  collectionData,
  onClose,
  onAddToDeck,
}: CardDetailModalProps) {
  const rarityColor = RARITY_COLORS[card.rarity || 'common']
  const elementConfig = card.element ? ELEMENT_CONFIG[card.element] : null
  const themeIcon = THEME_ICONS[card.theme] || 'mdi:cards'
  const isAiGenerated = card.id.startsWith('generated_') || card.generatedFrom

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Icon icon={themeIcon} className="text-2xl text-gray-400" />
            <div>
              <h2 className="text-xl font-bold text-white">{card.name}</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className={rarityColor}>{card.rarity || 'common'}</span>
                {elementConfig && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className={elementConfig.color}>
                      <Icon icon={elementConfig.icon} className="inline mr-1" />
                      {card.element}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex gap-6">
            {/* Card Preview */}
            <div className="flex-shrink-0">
              <div className="w-48">
                <Card {...getCardDefProps(card)} variant="hand" />
              </div>

              {/* AI Generated Badge */}
              {isAiGenerated && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm">
                  <Icon icon="mdi:robot" className="text-purple-400" />
                  <span className="text-purple-300">AI Generated</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              {/* Energy Cost */}
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-energy/20 border border-energy/30 rounded-lg">
                  <span className="text-2xl font-bold text-energy">
                    {typeof card.energy === 'number' ? card.energy : 'X'}
                  </span>
                  <span className="text-xs text-energy/70 ml-1">ENERGY</span>
                </div>
                <div className="px-4 py-2 bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-400">Target:</span>
                  <span className="text-sm text-gray-200 ml-2 capitalize">
                    {card.target?.replace(/([A-Z])/g, ' $1').trim() || 'None'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Description
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {card.description || 'No description available.'}
                </p>
              </div>

              {/* Effects Summary */}
              {card.effects && card.effects.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    Effects ({card.effects.length})
                  </h3>
                  <div className="space-y-1">
                    {card.effects.slice(0, 5).map((effect, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded text-sm"
                      >
                        <Icon icon="mdi:chevron-right" className="text-gray-500" />
                        <span className="text-gray-300 capitalize">
                          {effect.type}
                          {'amount' in effect && typeof effect.amount === 'number' && (
                            <span className="text-energy ml-1">({effect.amount})</span>
                          )}
                        </span>
                      </div>
                    ))}
                    {card.effects.length > 5 && (
                      <p className="text-xs text-gray-500 pl-3">
                        +{card.effects.length - 5} more effects
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Card Tags */}
              {card.tags && card.tags.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Info */}
              {collectionData && (
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    Collection Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Owned:</span>
                      <span className="text-energy ml-2 font-medium">
                        x{collectionData.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Source:</span>
                      <span className="text-gray-300 ml-2 capitalize">
                        {collectionData.source}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Obtained:</span>
                      <span className="text-gray-300 ml-2">
                        {collectionData.obtainedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade Info */}
              {card.upgradesTo && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <Icon icon="mdi:arrow-up-bold" />
                    <span>Can be upgraded</span>
                  </div>
                </div>
              )}

              {/* Special Properties */}
              <div className="flex flex-wrap gap-2">
                {card.ethereal && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded flex items-center gap-1">
                    <Icon icon="mdi:ghost" />
                    Ethereal
                  </span>
                )}
                {card.upgraded && (
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-1">
                    <Icon icon="mdi:plus-circle" />
                    Upgraded
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg hover:text-white hover:border-gray-500 transition-colors"
          >
            Close
          </button>
          {onAddToDeck && (
            <button
              onClick={() => {
                onAddToDeck()
                onClose()
              }}
              className="px-4 py-2 bg-energy text-gray-900 font-medium rounded-lg hover:bg-energy/90 transition-colors flex items-center gap-2"
            >
              <Icon icon="mdi:plus" />
              Add to Deck
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardDetailModal
