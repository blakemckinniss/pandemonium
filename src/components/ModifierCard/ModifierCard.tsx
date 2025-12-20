import { memo, useRef, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'
import type { ModifierDefinition, ModifierInstance } from '../../types'

// Category styling
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bgClass: string }> = {
  catalyst: { icon: 'game-icons:bubbling-flask', color: 'text-orange-400', bgClass: 'from-orange-900/30 to-orange-950/50' },
  omen: { icon: 'game-icons:eye-of-horus', color: 'text-purple-400', bgClass: 'from-purple-900/30 to-purple-950/50' },
  edict: { icon: 'game-icons:scroll-unfurled', color: 'text-cyan-400', bgClass: 'from-cyan-900/30 to-cyan-950/50' },
  seal: { icon: 'game-icons:wax-seal', color: 'text-red-400', bgClass: 'from-red-900/30 to-red-950/50' },
}

// Rarity styling
const RARITY_BORDER: Record<string, string> = {
  common: 'border-warm-600',
  uncommon: 'border-emerald-500',
  rare: 'border-blue-500',
  legendary: 'border-amber-400',
}

const RARITY_GLOW: Record<string, string> = {
  common: '',
  uncommon: 'shadow-emerald-500/20',
  rare: 'shadow-blue-500/30',
  legendary: 'shadow-amber-400/40',
}

// Durability icons
const DURABILITY_CONFIG: Record<string, { icon: string; label: string }> = {
  consumable: { icon: 'game-icons:fire-extinguisher', label: 'Single use' },
  fragile: { icon: 'game-icons:cracked-glass', label: 'Limited uses' },
  permanent: { icon: 'game-icons:eternal-love', label: 'Permanent' },
}

interface ModifierCardProps {
  modifier: ModifierDefinition
  instance?: ModifierInstance // If owned/active
  variant?: 'shop' | 'selection' | 'active' | 'preview'
  isSelected?: boolean
  isDisabled?: boolean
  showPrice?: boolean
  price?: number
  onClick?: () => void
  onPreview?: () => void
}

export const ModifierCard = memo(function ModifierCard({
  modifier,
  instance,
  variant = 'preview',
  isSelected = false,
  isDisabled = false,
  showPrice = false,
  price,
  onClick,
  onPreview,
}: ModifierCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [_showTooltip, setShowTooltip] = useState(false)

  const category = CATEGORY_CONFIG[modifier.category] ?? CATEGORY_CONFIG.catalyst
  const rarityBorder = RARITY_BORDER[modifier.rarity] ?? RARITY_BORDER.common
  const rarityGlow = RARITY_GLOW[modifier.rarity] ?? ''
  const durability = DURABILITY_CONFIG[modifier.durability.type] ?? DURABILITY_CONFIG.consumable

  // Calculate balance ratio for visual indicator
  const balanceRatio = modifier.dangerValue > 0 ? modifier.rewardValue / modifier.dangerValue : 1
  const isBalanced = balanceRatio >= 0.85 && balanceRatio <= 1.15

  // Remaining uses for fragile modifiers
  const remainingUses = instance?.usesRemaining ?? (modifier.durability.type === 'fragile' ? modifier.durability.uses : undefined)

  // Selection animation
  useEffect(() => {
    if (!cardRef.current) return

    if (isSelected) {
      gsap.to(cardRef.current, {
        scale: 1.05,
        boxShadow: '0 0 20px oklch(0.7 0.15 250 / 0.5)',
        duration: 0.2,
        ease: 'power2.out',
      })
    } else {
      gsap.to(cardRef.current, {
        scale: 1,
        boxShadow: 'none',
        duration: 0.15,
        ease: 'power2.inOut',
      })
    }
  }, [isSelected])

  const handleClick = () => {
    if (isDisabled) return
    onClick?.()
  }

  return (
    <div
      ref={cardRef}
      className={`
        ModifierCard relative w-56 rounded-xl border-2 overflow-hidden
        bg-gradient-to-b ${category.bgClass}
        ${rarityBorder} ${rarityGlow}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102 transition-transform'}
        ${isSelected ? 'ring-2 ring-energy ring-offset-2 ring-offset-warm-900' : ''}
        ${variant === 'active' ? 'shadow-lg' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface/50 border-b border-warm-700/50">
        <Icon icon={category.icon} className={`w-5 h-5 ${category.color}`} />
        <span className="font-medium text-warm-100 truncate flex-1">{modifier.name}</span>
        <span className={`text-xs capitalize ${category.color}`}>{modifier.category}</span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Description */}
        <p className="text-sm text-warm-300 line-clamp-2">{modifier.description}</p>

        {/* DV/RV Balance Display */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-damage">
              <Icon icon="game-icons:spiked-dragon-head" className="w-3.5 h-3.5" />
              DV:{modifier.dangerValue}
            </span>
            <span className="flex items-center gap-1 text-heal">
              <Icon icon="game-icons:receive-money" className="w-3.5 h-3.5" />
              RV:{modifier.rewardValue}
            </span>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${isBalanced ? 'bg-heal/20 text-heal' : 'bg-damage/20 text-damage'}`}>
            {balanceRatio.toFixed(2)}
          </span>
        </div>

        {/* Durability */}
        <div className="flex items-center gap-2 text-xs text-warm-400">
          <Icon icon={durability.icon} className="w-3.5 h-3.5" />
          <span>{durability.label}</span>
          {remainingUses !== undefined && (
            <span className="ml-auto text-warm-300">
              {remainingUses}/{modifier.durability.type === 'fragile' ? modifier.durability.uses : '∞'}
            </span>
          )}
        </div>

        {/* Rarity Badge */}
        <div className="flex items-center justify-between">
          <span className={`text-xs capitalize px-2 py-0.5 rounded-full bg-surface/50 ${RARITY_BORDER[modifier.rarity]?.replace('border-', 'text-')}`}>
            {modifier.rarity}
          </span>

          {/* Preview Button */}
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPreview()
              }}
              className="p-1 rounded hover:bg-surface/50 text-warm-400 hover:text-warm-100 transition-colors"
              title="View details"
            >
              <Icon icon="game-icons:magnifying-glass" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Price (for shop variant) */}
      {showPrice && price !== undefined && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-surface/90 rounded-full text-energy text-sm font-medium">
          <Icon icon="game-icons:two-coins" className="w-4 h-4" />
          {price}
        </div>
      )}

      {/* Selected Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-energy/10 pointer-events-none flex items-center justify-center">
          <Icon icon="game-icons:check-mark" className="w-8 h-8 text-energy" />
        </div>
      )}

      {/* Disabled Overlay */}
      {isDisabled && (
        <div className="absolute inset-0 bg-warm-900/60 pointer-events-none flex items-center justify-center">
          <Icon icon="game-icons:padlock" className="w-6 h-6 text-warm-500" />
        </div>
      )}
    </div>
  )
})

export default ModifierCard
