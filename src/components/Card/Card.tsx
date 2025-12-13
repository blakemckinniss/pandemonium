import { Icon } from '@iconify/react'
import type { CardVariant, CardTheme, Intent, Powers } from '../../types'

interface CardProps {
  variant: CardVariant
  theme?: CardTheme
  name: string
  image?: string

  // player/enemy variants
  currentHealth?: number
  maxHealth?: number
  block?: number
  powers?: Powers
  energy?: number
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
  currentHealth,
  maxHealth,
  block = 0,
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
        <div className="absolute top-2 left-2 EnergyOrb text-xs">
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

export default Card
