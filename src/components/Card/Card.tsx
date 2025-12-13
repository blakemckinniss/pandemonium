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

  // enemy variant
  intent?: Intent

  // hand variant
  energy?: number
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
  intent,
  energy,
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
        <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-energy text-black text-sm font-bold flex items-center justify-center">
          {energy}
        </div>
      )}

      {/* Intent badge (enemies) */}
      {variant === 'enemy' && intent && (
        <div className="absolute top-1 right-1 px-2 py-0.5 rounded bg-surface-alt text-xs">
          {intent.type === 'attack' && `⚔️ ${intent.value}`}
          {intent.type === 'defend' && `🛡️ ${intent.value}`}
          {intent.type === 'buff' && '⬆️'}
          {intent.type === 'debuff' && '⬇️'}
        </div>
      )}

      {/* Portrait/Art area */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-3xl">
            {variant === 'player' && '🧙'}
            {variant === 'enemy' && '👹'}
            {variant === 'hand' && (theme === 'attack' ? '⚔️' : theme === 'skill' ? '🛡️' : '✨')}
            {variant === 'room' && '🚪'}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-2 py-1 text-center text-sm font-medium truncate bg-surface-alt">
        {name}
      </div>

      {/* Bottom section - varies by variant */}
      {variant === 'hand' && description && (
        <div className="px-2 py-1 text-xs text-center text-gray-400 leading-tight">
          {description}
        </div>
      )}

      {(variant === 'player' || variant === 'enemy') && (
        <div className="p-2">
          <HealthBar
            current={currentHealth ?? 0}
            max={maxHealth ?? 1}
            block={block}
          />
          <div className="text-xs text-center mt-1">
            {block > 0 && <span className="text-block mr-1">🛡️{block}</span>}
            <span>{currentHealth}/{maxHealth}</span>
          </div>
        </div>
      )}
    </div>
  )
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
    </div>
  )
}

export default Card
