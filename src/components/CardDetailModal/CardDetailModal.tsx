import { Icon } from '@iconify/react'
import { Card, getCardDefProps } from '../Card/Card'
import type { CardDefinition } from '../../types'

// Rarity color mapping
const RARITY_COLORS: Record<string, string> = {
  common: 'text-warm-400',
  uncommon: 'text-blue-400',
  rare: 'text-yellow-400',
  'ultra-rare': 'text-purple-400',
  legendary: 'text-orange-400',
  mythic: 'text-pink-400',
  ancient: 'text-emerald-400',
}

// Element color and icon mapping
const ELEMENT_CONFIG: Record<string, { color: string; icon: string }> = {
  physical: { color: 'text-warm-300', icon: 'mdi:fist' },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel-gothic max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 60px oklch(0.3 0.1 50 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.05)',
        }}
      >
        {/* Ornate Corner Accents */}
        <div className="absolute top-2 left-2 text-filigree/40 text-xs">◆</div>
        <div className="absolute top-2 right-2 text-filigree/40 text-xs">◆</div>
        <div className="absolute bottom-2 left-2 text-filigree/40 text-xs">◆</div>
        <div className="absolute bottom-2 right-2 text-filigree/40 text-xs">◆</div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border relative">
          {/* Header ornamental line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-filigree/30 to-transparent" />

          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-surface-alt border border-border">
              <Icon icon={themeIcon} className="text-2xl text-filigree" />
            </div>
            <div>
              <h2 className="text-xl font-display tracking-wide text-warm-100">{card.name}</h2>
              <div className="flex items-center gap-2 text-sm font-ui">
                <span className={rarityColor}>{card.rarity || 'common'}</span>
                {elementConfig && (
                  <>
                    <span className="text-warm-600">•</span>
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
            className="p-2 text-warm-500 hover:text-warm-200 hover:bg-warm-800/50 rounded transition-all"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          <div className="flex gap-6">
            {/* Card Preview */}
            <div className="flex-shrink-0">
              <div className="w-48 relative">
                {/* Subtle card glow */}
                <div className="absolute -inset-2 bg-gradient-to-b from-filigree/5 to-transparent rounded-xl blur-sm" />
                <Card {...getCardDefProps(card)} variant="hand" />
              </div>

              {/* AI Generated Badge */}
              {isAiGenerated && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-element-void-muted/30 border border-element-void/30 rounded text-sm">
                  <Icon icon="mdi:robot" className="text-element-void" />
                  <span className="text-element-void font-ui text-xs tracking-wide">AI GENERATED</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-5">
              {/* Energy Cost */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gradient-to-b from-energy/20 to-energy/10 border border-energy/40 rounded relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-energy/10" />
                  <span className="text-2xl font-bold text-energy relative">
                    {typeof card.energy === 'number' ? card.energy : 'X'}
                  </span>
                  <span className="text-xs text-energy/80 ml-1 font-display tracking-wider relative">ENERGY</span>
                </div>
                <div className="px-4 py-2 bg-surface-alt border border-border rounded">
                  <span className="text-xs text-warm-500 font-display tracking-wide">TARGET</span>
                  <span className="text-sm text-warm-200 ml-2 capitalize font-ui">
                    {card.target?.replace(/([A-Z])/g, ' $1').trim() || 'None'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-display tracking-widest text-warm-500 mb-2 flex items-center gap-2">
                  <span className="w-4 h-px bg-gradient-to-r from-filigree/50 to-transparent" />
                  Description
                  <span className="flex-1 h-px bg-gradient-to-r from-filigree/20 to-transparent" />
                </h3>
                <p className="text-warm-300 leading-relaxed font-prose text-base">
                  {card.description || 'No description available.'}
                </p>
              </div>

              {/* Effects Summary */}
              {card.effects && card.effects.length > 0 && (
                <div>
                  <h3 className="text-xs font-display tracking-widest text-warm-500 mb-2 flex items-center gap-2">
                    <span className="w-4 h-px bg-gradient-to-r from-filigree/50 to-transparent" />
                    Effects ({card.effects.length})
                    <span className="flex-1 h-px bg-gradient-to-r from-filigree/20 to-transparent" />
                  </h3>
                  <div className="space-y-1">
                    {card.effects.slice(0, 5).map((effect, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt/50 border border-border/50 rounded text-sm"
                      >
                        <Icon icon="mdi:chevron-right" className="text-filigree/60" />
                        <span className="text-warm-300 capitalize font-ui">
                          {effect.type}
                          {'amount' in effect && typeof effect.amount === 'number' && (
                            <span className="text-energy ml-1 font-bold">({effect.amount})</span>
                          )}
                        </span>
                      </div>
                    ))}
                    {card.effects.length > 5 && (
                      <p className="text-xs text-warm-500 pl-3 font-ui">
                        +{card.effects.length - 5} more effects
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Card Tags */}
              {card.tags && card.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-display tracking-widest text-warm-500 mb-2 flex items-center gap-2">
                    <span className="w-4 h-px bg-gradient-to-r from-filigree/50 to-transparent" />
                    Tags
                    <span className="flex-1 h-px bg-gradient-to-r from-filigree/20 to-transparent" />
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-surface-alt border border-border/50 text-warm-400 text-xs rounded font-ui"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Info */}
              {collectionData && (
                <div className="p-3 bg-surface-alt/50 border border-border rounded">
                  <h3 className="text-xs font-display tracking-widest text-warm-500 mb-2 flex items-center gap-2">
                    <Icon icon="mdi:book-open-variant" className="text-filigree/60" />
                    Collection Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm font-ui">
                    <div>
                      <span className="text-warm-500">Owned:</span>
                      <span className="text-energy ml-2 font-bold">
                        x{collectionData.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-warm-500">Source:</span>
                      <span className="text-warm-300 ml-2 capitalize">
                        {collectionData.source}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-warm-500">Obtained:</span>
                      <span className="text-warm-300 ml-2">
                        {collectionData.obtainedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade Info */}
              {card.upgradesTo && (
                <div className="p-3 bg-heal/10 border border-heal/30 rounded">
                  <div className="flex items-center gap-2 text-heal text-sm font-display tracking-wide">
                    <Icon icon="mdi:arrow-up-bold" />
                    <span>Can be upgraded</span>
                  </div>
                </div>
              )}

              {/* Special Properties */}
              <div className="flex flex-wrap gap-2">
                {card.ethereal && (
                  <span className="px-2 py-1 bg-element-void-muted/30 border border-element-void/30 text-element-void text-xs rounded flex items-center gap-1 font-display tracking-wide">
                    <Icon icon="mdi:ghost" />
                    Ethereal
                  </span>
                )}
                {card.upgraded && (
                  <span className="px-2 py-1 bg-heal/10 border border-heal/30 text-heal text-xs rounded flex items-center gap-1 font-display tracking-wide">
                    <Icon icon="mdi:plus-circle" />
                    Upgraded
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex justify-end gap-3 relative">
          {/* Footer ornamental line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-filigree/20 to-transparent" />

          <button
            onClick={onClose}
            className="btn-gothic"
          >
            Close
          </button>
          {onAddToDeck && (
            <button
              onClick={() => {
                onAddToDeck()
                onClose()
              }}
              className="btn-gothic-primary flex items-center gap-2"
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
