import { memo, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/dragdrop'
import { PowerTooltip } from '../PowerTooltip/PowerTooltip'
import type { CardVariant, CardTheme, Intent, Powers, Element } from '../../types'

// Element visual config
const ELEMENT_CONFIG: Record<Element, { icon: string; color: string; bg: string }> = {
  physical: { icon: 'game-icons:sword-wound', color: 'text-gray-300', bg: 'bg-gray-600' },
  fire: { icon: 'game-icons:fire', color: 'text-orange-400', bg: 'bg-orange-900' },
  ice: { icon: 'game-icons:snowflake-1', color: 'text-cyan-400', bg: 'bg-cyan-900' },
  lightning: { icon: 'game-icons:lightning-bolt', color: 'text-yellow-300', bg: 'bg-yellow-900' },
  void: { icon: 'game-icons:portal', color: 'text-purple-400', bg: 'bg-purple-900' },
}

interface CardProps {
  variant: CardVariant
  theme?: CardTheme
  name: string
  image?: string
  rarity?: 'starter' | 'common' | 'uncommon' | 'rare'
  upgraded?: boolean
  element?: Element

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
  costModified?: boolean // True if card cost has been modified
  ethereal?: boolean // Card exhausts if not played
  retained?: boolean // Card stays in hand at turn end

  // Interactions
  onClick?: () => void
  className?: string
  'data-card-id'?: string
  'data-card-target'?: string
}

export const Card = memo(function Card({
  variant,
  theme,
  name,
  image,
  rarity,
  upgraded = false,
  element,
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
  costModified = false,
  ethereal = false,
  retained = false,
  onClick,
  className = '',
  ...dataAttrs
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowTweenRef = useRef<gsap.core.Tween | null>(null)

  // Playable card glow effect
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    // Only apply glow to playable hand cards
    if (variant === 'hand' && playable && !disabled) {
      glowTweenRef.current = (gsap.effects as Record<string, (el: Element, opts: object) => gsap.core.Tween>).cardGlow(card as unknown as Element, { theme: theme ?? 'attack' })
    }

    return () => {
      // Kill the glow animation on cleanup
      if (glowTweenRef.current) {
        glowTweenRef.current.kill()
        glowTweenRef.current = null
      }
      // Reset any inline styles from the glow
      if (card) {
        gsap.set(card, { boxShadow: '', clearProps: 'boxShadow' })
      }
    }
  }, [variant, playable, disabled, theme])

  const displayName = upgraded ? `${name}+` : name
  const classes = [
    'Card',
    `Card--${variant}`,
    theme && `Card--${theme}`,
    rarity === 'rare' && 'Card--rare',
    rarity === 'uncommon' && 'Card--uncommon',
    upgraded && 'Card--upgraded',
    playable && 'is-playable',
    disabled && 'is-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={cardRef} className={classes} onClick={onClick} {...dataAttrs}>
      {/* Energy badge (hand cards) */}
      {variant === 'hand' && energy !== undefined && (
        <div className={`absolute top-2 left-2 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shadow-md ${
          costModified ? 'bg-green-500 text-white ring-2 ring-green-300' : 'bg-energy text-black'
        }`}>
          {energy}
        </div>
      )}

      {/* Element badge (hand cards with non-physical element) */}
      {variant === 'hand' && element && element !== 'physical' && (
        <div className={`absolute top-2 right-2 w-7 h-7 rounded-full ${ELEMENT_CONFIG[element].bg} flex items-center justify-center shadow-md border border-white/20`}>
          <Icon icon={ELEMENT_CONFIG[element].icon} className={`w-4 h-4 ${ELEMENT_CONFIG[element].color}`} />
        </div>
      )}

      {/* Status keyword badges (ethereal/retained) */}
      {variant === 'hand' && (ethereal || retained) && (
        <div className="absolute top-11 right-2 flex flex-col gap-1">
          {ethereal && (
            <div className="w-6 h-6 rounded-full bg-purple-900/80 flex items-center justify-center shadow-md border border-purple-400/30" title="Ethereal - Exhausts if not played">
              <Icon icon="game-icons:ghost" className="w-3.5 h-3.5 text-purple-300" />
            </div>
          )}
          {retained && (
            <div className="w-6 h-6 rounded-full bg-amber-900/80 flex items-center justify-center shadow-md border border-amber-400/30" title="Retained - Stays in hand">
              <Icon icon="game-icons:hand" className="w-3.5 h-3.5 text-amber-300" />
            </div>
          )}
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
        {displayName}
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
})

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
  // Elemental statuses (debuffs with element colors)
  burning: { icon: 'game-icons:fire', color: 'text-orange-400', isDebuff: true },
  wet: { icon: 'game-icons:water-drop', color: 'text-cyan-400', isDebuff: true },
  frozen: { icon: 'game-icons:frozen-orb', color: 'text-cyan-300', isDebuff: true },
  charged: { icon: 'game-icons:lightning-storm', color: 'text-yellow-300', isDebuff: true },
  oiled: { icon: 'game-icons:oil-drum', color: 'text-purple-400', isDebuff: true },
  // Buffs (green/blue)
  strength: { icon: 'game-icons:biceps', color: 'text-heal' },
  dexterity: { icon: 'game-icons:sprint', color: 'text-heal' },
  regen: { icon: 'game-icons:healing', color: 'text-heal' },
  thorns: { icon: 'game-icons:thorns', color: 'text-block' },
  metallicize: { icon: 'game-icons:metal-plate', color: 'text-block' },
  platedArmor: { icon: 'game-icons:shoulder-armor', color: 'text-block' },
  ritual: { icon: 'game-icons:pentagram-rose', color: 'text-heal' },
  anger: { icon: 'game-icons:enrage', color: 'text-damage' },
  // Replay powers
  doubleTap: { icon: 'game-icons:double-shot', color: 'text-energy' },
  mayhem: { icon: 'game-icons:chaos', color: 'text-energy' },
  echoForm: { icon: 'game-icons:echo-ripples', color: 'text-energy' },
  burst: { icon: 'game-icons:fast-forward-button', color: 'text-energy' },
  // Defensive
  intangible: { icon: 'game-icons:ghost', color: 'text-purple-300' },
  barricade: { icon: 'game-icons:castle', color: 'text-block' },
  noxiousFumes: { icon: 'game-icons:poison-gas', color: 'text-green-400' },
}

interface PowerIndicatorsProps {
  powers: Powers
}

const PowerIndicators = memo(function PowerIndicators({ powers }: PowerIndicatorsProps) {
  const entries = Object.entries(powers)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 px-2 pb-2 justify-center">
      {entries.map(([id, power]) => {
        const config = POWER_ICONS[id] || { icon: 'game-icons:uncertainty', color: 'text-gray-400' }
        return (
          <PowerTooltip key={id} powerId={id} power={power}>
            <div
              className={`PowerBadge ${config.isDebuff ? 'PowerBadge--debuff' : 'PowerBadge--buff'}`}
            >
              <Icon icon={config.icon} className={`w-4 h-4 ${config.color}`} />
              <span className="text-xs font-bold">{power.amount}</span>
            </div>
          </PowerTooltip>
        )
      })}
    </div>
  )
})

export default Card
