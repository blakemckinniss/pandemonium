import { Icon } from '@iconify/react'
import { Modal } from './Modal'
import type { CardDefinition, Element } from '../../types'
import { getEnergyCost } from '../../lib/effects'

// Element visual config
const ELEMENT_CONFIG: Record<Element, { icon: string; color: string; label: string }> = {
  physical: { icon: 'game-icons:sword-wound', color: 'text-gray-300', label: 'Physical' },
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
  starter: { color: 'text-gray-400', label: 'Starter', bg: 'bg-gray-700' },
  common: { color: 'text-gray-300', label: 'Common', bg: 'bg-gray-600' },
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
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Energy orb */}
            <div className="w-10 h-10 rounded-full bg-energy text-black text-lg font-bold flex items-center justify-center shadow-lg">
              {energyCost}
            </div>
            <h2 className="text-2xl font-bold text-white">{card.name}</h2>
          </div>

          {/* Badges row */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Theme badge */}
            <span className={`px-2 py-1 rounded text-xs font-medium ${themeConfig.color} bg-surface-alt`}>
              <Icon icon={themeConfig.icon} className="inline w-3 h-3 mr-1" />
              {themeConfig.label}
            </span>

            {/* Rarity badge */}
            <span className={`px-2 py-1 rounded text-xs font-medium ${rarityConfig.color} ${rarityConfig.bg}`}>
              {rarityConfig.label}
            </span>

            {/* Element badge (if not physical) */}
            {element !== 'physical' && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${elementConfig.color} bg-surface-alt`}>
                <Icon icon={elementConfig.icon} className="inline w-3 h-3 mr-1" />
                {elementConfig.label}
              </span>
            )}
          </div>
        </div>

        {/* Card Art Placeholder */}
        <div className="w-48 h-32 rounded-lg bg-surface-alt border border-white/10 flex items-center justify-center">
          <Icon
            icon={element !== 'physical' ? elementConfig.icon : themeConfig.icon}
            className={`w-16 h-16 ${element !== 'physical' ? elementConfig.color : themeConfig.color} opacity-60`}
          />
        </div>

        {/* Description */}
        <div className="text-center max-w-sm">
          <p className="text-gray-300 leading-relaxed">{card.description}</p>
        </div>

        {/* Keywords */}
        {(card.ethereal || hasExhaust) && (
          <div className="flex gap-2">
            {card.ethereal && (
              <span className="px-3 py-1 rounded-full bg-purple-900/50 text-purple-300 text-xs font-medium flex items-center gap-1">
                <Icon icon="game-icons:ghost" className="w-3 h-3" />
                Ethereal
              </span>
            )}
            {hasExhaust && (
              <span className="px-3 py-1 rounded-full bg-red-900/50 text-red-300 text-xs font-medium flex items-center gap-1">
                <Icon icon="game-icons:fire" className="w-3 h-3" />
                Exhaust
              </span>
            )}
          </div>
        )}

        {/* Keyword explanations */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          {card.ethereal && <p><strong>Ethereal:</strong> If not played, exhausts at end of turn</p>}
          {hasExhaust && <p><strong>Exhaust:</strong> Removed from deck for this combat</p>}
          {card.target === 'enemy' && <p><strong>Targeted:</strong> Must select an enemy to play</p>}
          {theme === 'power' && <p><strong>Power:</strong> Permanent effect for this combat</p>}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-surface-alt text-gray-300 hover:bg-surface hover:text-white transition-colors"
          >
            Back
          </button>
          {onSelect && (
            <button
              onClick={() => {
                onSelect(card)
                onClose()
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-heal text-black font-medium hover:bg-green-400 transition-colors"
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
