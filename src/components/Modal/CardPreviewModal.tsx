import { Icon } from '@iconify/react'
import { Modal } from './Modal'
import type { CardDefinition, Element } from '../../types'
import { getEnergyCost } from '../Card/utils'

// Element visual config
const ELEMENT_CONFIG: Record<Element, { icon: string; color: string; label: string }> = {
  physical: { icon: 'game-icons:sword-wound', color: 'text-warm-300', label: 'Physical' },
  fire: { icon: 'game-icons:fire', color: 'text-orange-400', label: 'Fire' },
  ice: { icon: 'game-icons:snowflake-1', color: 'text-cyan-400', label: 'Ice' },
  lightning: { icon: 'game-icons:lightning-bolt', color: 'text-yellow-300', label: 'Lightning' },
  void: { icon: 'game-icons:portal', color: 'text-purple-400', label: 'Void' },
}

// Theme icons
const THEME_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  attack: { icon: 'game-icons:sword-wound', color: 'text-damage', label: 'Attack' },
  skill: { icon: 'game-icons:shield-reflect', color: 'text-block', label: 'Skill' },
  power: { icon: 'game-icons:magic-swirl', color: 'text-purple-400', label: 'Power' },
}

// Rarity styling
const RARITY_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  starter: { color: 'text-warm-400', label: 'Starter', bg: 'bg-warm-700' },
  common: { color: 'text-warm-300', label: 'Common', bg: 'bg-warm-600' },
  uncommon: { color: 'text-blue-400', label: 'Uncommon', bg: 'bg-blue-900/50' },
  rare: { color: 'text-yellow-400', label: 'Rare', bg: 'bg-yellow-900/50' },
}

interface CardPreviewModalProps {
  card: CardDefinition | null
  isOpen: boolean
  onClose: () => void
  onSelect?: (card: CardDefinition) => void
  selectLabel?: string
}

export function CardPreviewModal({
  card,
  isOpen,
  onClose,
  onSelect,
  selectLabel = 'Add to Deck',
}: CardPreviewModalProps) {
  if (!card) return null

  const element = card.element ?? 'physical'
  const rarity = card.rarity ?? 'common'
  const theme = card.theme ?? 'attack'
  const energyCost = getEnergyCost(card.energy)

  const elementConfig = ELEMENT_CONFIG[element]
  const rarityConfig = RARITY_CONFIG[rarity]
  const themeConfig = THEME_CONFIG[theme]

  // Check if card has exhaust effect
  const hasExhaust = card.effects.some((e) => e.type === 'exhaust')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center gap-6 p-4">
        {/* Card Name with Energy Cost */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* Energy orb */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-b from-energy to-energy/80 text-black text-lg font-bold flex items-center justify-center shadow-lg border border-energy/50">
              {energyCost}
            </div>
            <h2 className="text-2xl font-display tracking-wide text-warm-100">{card.name}</h2>
          </div>

          {/* Badges row */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Theme badge */}
            <span className={`px-2.5 py-1 rounded text-xs font-display tracking-wide ${themeConfig.color} bg-surface-alt border border-border/50`}>
              <Icon icon={themeConfig.icon} className="inline w-3 h-3 mr-1" />
              {themeConfig.label}
            </span>

            {/* Rarity badge */}
            <span className={`px-2.5 py-1 rounded text-xs font-display tracking-wide ${rarityConfig.color} ${rarityConfig.bg} border border-current/20`}>
              {rarityConfig.label}
            </span>

            {/* Element badge (if not physical) */}
            {element !== 'physical' && (
              <span className={`px-2.5 py-1 rounded text-xs font-display tracking-wide ${elementConfig.color} bg-surface-alt border border-border/50`}>
                <Icon icon={elementConfig.icon} className="inline w-3 h-3 mr-1" />
                {elementConfig.label}
              </span>
            )}
          </div>
        </div>

        {/* Card Art Placeholder */}
        <div className="w-48 h-32 rounded bg-surface-alt border border-border flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-filigree/5 to-transparent" />
          <Icon
            icon={element !== 'physical' ? elementConfig.icon : themeConfig.icon}
            className={`w-16 h-16 ${element !== 'physical' ? elementConfig.color : themeConfig.color} opacity-50`}
          />
        </div>

        {/* Description */}
        <div className="text-center max-w-sm">
          <p className="text-warm-300 leading-relaxed font-prose">{card.description}</p>
        </div>

        {/* Keywords */}
        {(card.ethereal || hasExhaust) && (
          <div className="flex gap-2">
            {card.ethereal && (
              <span className="px-3 py-1 rounded bg-element-void-muted/30 border border-element-void/30 text-element-void text-xs font-display tracking-wide flex items-center gap-1">
                <Icon icon="game-icons:ghost" className="w-3 h-3" />
                Ethereal
              </span>
            )}
            {hasExhaust && (
              <span className="px-3 py-1 rounded bg-damage/20 border border-damage/30 text-damage text-xs font-display tracking-wide flex items-center gap-1">
                <Icon icon="game-icons:fire" className="w-3 h-3" />
                Exhaust
              </span>
            )}
          </div>
        )}

        {/* Keyword explanations */}
        <div className="text-xs text-warm-500 text-center space-y-1 font-prose italic">
          {card.ethereal && <p><strong className="font-display not-italic tracking-wide">Ethereal:</strong> If not played, exhausts at end of turn</p>}
          {hasExhaust && <p><strong className="font-display not-italic tracking-wide">Exhaust:</strong> Removed from deck for this combat</p>}
          {card.target === 'enemy' && <p><strong className="font-display not-italic tracking-wide">Targeted:</strong> Must select an enemy to play</p>}
          {theme === 'power' && <p><strong className="font-display not-italic tracking-wide">Power:</strong> Permanent effect for this combat</p>}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 btn-gothic"
          >
            Back
          </button>
          {onSelect && (
            <button
              onClick={() => {
                onSelect(card)
                onClose()
              }}
              className="flex-1 btn-gothic-primary"
            >
              {selectLabel}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default CardPreviewModal
