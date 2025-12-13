import { Icon } from '@iconify/react'
import type { CardVariant, CardTheme, Intent, Powers } from '../../types'

interface CardProps {
  variant: CardVariant
  theme?: CardTheme
  name: string
  image?: string
  rarity?: 'starter' | 'common' | 'uncommon' | 'rare'

  // player/enemy variants
  currentHealth?: number
  maxHealth?: number
  block?: number
  powers?: Powers
  energy?: number | 'X'
  maxEnergy?: number

  // enemy variant
  intent?: Intent

  // hand variant
  description?: string
  playable?: boolean
  disabled?: boolean

  // Interactions
  onClick?: () => void
  className?: string
  'data-card-id'?: string
  'data-card-target'?: string
}

export function Card({
  variant,
  theme,
  name,
  image,
  rarity,
  currentHealth,
  maxHealth,
  block = 0,
  powers,
  energy,
  maxEnergy,
  intent,
  description,
  playable = false,
  disabled = false,
  onClick,
  className = '',
  ...dataAttrs
}: CardProps) {
  const classes = [
    'Card',
    `Card--${variant}`,
    theme && `Card--${theme}`,
    rarity === 'rare' && 'Card--rare',
    rarity === 'uncommon' && 'Card--uncommon',
    playable && 'is-playable',
    disabled && 'is-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} onClick={onClick} {...dataAttrs}>
      {/* Energy badge (hand cards) */}
      {variant === 'hand' && energy !== undefined && (
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-energy text-black text-sm font-bold flex items-center justify-center shadow-md">
          {energy}
        </div>
      )}

      {/* Intent badge (enemies) */}
      {variant === 'enemy' && intent && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-surface-alt/90 text-sm flex items-center gap-1">
          {intent.type === 'attack' && (
            <>
              <Icon icon="game-icons:crossed-swords" className="text-damage" />
              <span className="text-damage font-medium">{intent.value}</span>
            </>
          )}
          {intent.type === 'defend' && (
            <>
              <Icon icon="game-icons:shield" className="text-block" />
              <span className="text-block font-medium">{intent.value}</span>
            </>
          )}
          {intent.type === 'buff' && <Icon icon="game-icons:arrow-up" className="text-heal" />}
          {intent.type === 'debuff' && <Icon icon="game-icons:arrow-down" className="text-damage" />}
        </div>
      )}

      {/* Energy orb inside player card */}
      {variant === 'player' && energy !== undefined && (
        <div className="absolute top-2 left-2 EnergyOrb text-xs" data-energy-orb>
          {energy}/{maxEnergy}
        </div>
      )}

      {/* Portrait/Art area */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="max-w-full max-h-full object-contain" />
        ) : (
          <Icon
            icon={getCardIcon(variant, theme)}
            className="w-16 h-16 opacity-60"
          />
        )}
      </div>

      {/* Name */}
      <div className="px-3 py-2 text-center text-sm font-medium truncate bg-surface-alt/50">
        {name}
      </div>

      {/* Description (hand cards) */}
      {variant === 'hand' && description && (
        <div className="px-3 py-2 text-xs text-center text-gray-400 leading-tight">
          {description}
        </div>
      )}

      {/* Health bar with text inside (player/enemy) */}
      {(variant === 'player' || variant === 'enemy') && (
        <div className="p-3 pt-1">
          <HealthBar
            current={currentHealth ?? 0}
            max={maxHealth ?? 1}
            block={block}
          />
        </div>
      )}

      {/* Power indicators (player/enemy) */}
      {(variant === 'player' || variant === 'enemy') && powers && Object.keys(powers).length > 0 && (
        <PowerIndicators powers={powers} />
      )}
    </div>
  )
}

function getCardIcon(variant: CardVariant, theme?: CardTheme): string {
  if (variant === 'player') return 'game-icons:wizard-staff'
  if (variant === 'enemy') return 'game-icons:daemon-skull'
  if (variant === 'room') return 'game-icons:dungeon-gate'

  // Hand cards by theme
  if (theme === 'attack') return 'game-icons:sword-wound'
  if (theme === 'skill') return 'game-icons:shield-reflect'
  if (theme === 'power') return 'game-icons:magic-swirl'

  return 'game-icons:card-play'
}

interface HealthBarProps {
  current: number
  max: number
  block?: number
}

function HealthBar({ current, max, block = 0 }: HealthBarProps) {
  const healthPercent = Math.max(0, Math.min(100, (current / max) * 100))
  const blockPercent = Math.max(0, Math.min(100, (block / max) * 100))

  return (
    <div className="HealthBar">
      <div className="HealthBar-fill" style={{ width: `${healthPercent}%` }} />
      {block > 0 && (
        <div className="HealthBar-block" style={{ width: `${blockPercent}%` }} />
      )}
      <div className="HealthBar-text">
        {block > 0 && (
          <span className="text-block mr-1">
            <Icon icon="game-icons:shield" className="inline w-3 h-3" />
            {block}
          </span>
        )}
        <span>{current}/{max}</span>
      </div>
    </div>
  )
}

// Power icon mapping
const POWER_ICONS: Record<string, { icon: string; color: string; isDebuff?: boolean }> = {
  // Debuffs (red)
  vulnerable: { icon: 'game-icons:broken-shield', color: 'text-damage', isDebuff: true },
  weak: { icon: 'game-icons:muscle-down', color: 'text-damage', isDebuff: true },
  frail: { icon: 'game-icons:cracked-shield', color: 'text-damage', isDebuff: true },
  poison: { icon: 'game-icons:poison-bottle', color: 'text-damage', isDebuff: true },
  // Buffs (green/blue)
  strength: { icon: 'game-icons:biceps', color: 'text-heal' },
  dexterity: { icon: 'game-icons:sprint', color: 'text-heal' },
  regen: { icon: 'game-icons:healing', color: 'text-heal' },
  thorns: { icon: 'game-icons:thorns', color: 'text-block' },
  metallicize: { icon: 'game-icons:metal-plate', color: 'text-block' },
  platedArmor: { icon: 'game-icons:shoulder-armor', color: 'text-block' },
  ritual: { icon: 'game-icons:pentagram-rose', color: 'text-heal' },
  anger: { icon: 'game-icons:enrage', color: 'text-damage' },
}

interface PowerIndicatorsProps {
  powers: Powers
}

function PowerIndicators({ powers }: PowerIndicatorsProps) {
  const entries = Object.entries(powers)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 px-2 pb-2 justify-center">
      {entries.map(([id, power]) => {
        const config = POWER_ICONS[id] || { icon: 'game-icons:uncertainty', color: 'text-gray-400' }
        return (
          <div
            key={id}
            className={`PowerBadge ${config.isDebuff ? 'PowerBadge--debuff' : 'PowerBadge--buff'}`}
            title={`${id}: ${power.amount}${power.duration ? ` (${power.duration} turns)` : ''}`}
          >
            <Icon icon={config.icon} className={`w-4 h-4 ${config.color}`} />
            <span className="text-xs font-bold">{power.amount}</span>
          </div>
        )
      })}
    </div>
  )
}

export default Card
