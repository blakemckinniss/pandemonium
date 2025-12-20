import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/dragdrop'
import { PowerTooltip } from '../PowerTooltip/PowerTooltip'
import type { CardVariant, CardTheme, Intent, Powers, Element, CardRarity, CardDefinition } from '../../types'
import { emitParticle } from '../ParticleEffects/emitParticle'
import { RarityShader } from './RarityShader'

// ============================================
// UTILITY: Extract Card props from definition
// ============================================

/**
 * Convert energy value to display format.
 * Handles number, 'X', and EffectValue types.
 */
export function getEnergyCost(energy: CardDefinition['energy']): number | 'X' {
  if (typeof energy === 'number') return energy
  if (typeof energy === 'string' && energy === 'X') return 'X'
  if (typeof energy === 'object' && energy !== null && 'value' in energy) return energy.value
  return 0
}

/**
 * Extract visual props from a CardDefinition for the Card component.
 * Use this to ensure consistent prop mapping across all card displays.
 *
 * @example
 * const defProps = getCardDefProps(cardDef)
 * <Card {...defProps} variant="hand" playable />
 */
export function getCardDefProps(def: CardDefinition) {
  return {
    cardId: def.id,
    name: def.name,
    description: def.description,
    theme: def.theme,
    energy: getEnergyCost(def.energy),
    element: def.element,
    rarity: def.rarity,
    image: def.image,
    ethereal: def.ethereal,
  }
}

// Card dimensions by variant
const CARD_DIMENSIONS: Record<CardVariant, { width: number; height: number }> = {
  hand: { width: 180, height: 252 },
  player: { width: 200, height: 280 },
  enemy: { width: 200, height: 280 },
  room: { width: 220, height: 140 },
}

// Element visual config
const ELEMENT_CONFIG: Record<Element, { icon: string; color: string; bg: string }> = {
  physical: { icon: 'game-icons:sword-wound', color: 'text-warm-300', bg: 'bg-warm-600' },
  fire: { icon: 'game-icons:fire', color: 'text-orange-400', bg: 'bg-orange-900' },
  ice: { icon: 'game-icons:snowflake-1', color: 'text-cyan-400', bg: 'bg-cyan-900' },
  lightning: { icon: 'game-icons:lightning-helix', color: 'text-yellow-300', bg: 'bg-yellow-900' },
  void: { icon: 'game-icons:portal', color: 'text-purple-400', bg: 'bg-purple-900' },
}

interface CardProps {
  variant: CardVariant
  theme?: CardTheme
  name: string
  cardId?: string // Definition ID for auto-resolving image from /cards/{id}.webp
  image?: string // Explicit image URL (overrides cardId)
  rarity?: CardRarity
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
  cardId,
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

  // Auto-resolve image from cardId, with fallback on error
  const resolvedImage = image || (cardId ? `/cards/${cardId}.webp` : undefined)
  const [imageError, setImageError] = useState(false)

  // Mouse position tracking for premium card tilt effect (0-1 normalized)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x, y })
  }, [])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setMousePos({ x: 0.5, y: 0.5 }) // Reset to center
  }, [])

  // Reset error state when image source changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset on source change
    setImageError(false)
  }, [resolvedImage])

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
  // Derive power-based aura classes for entities (box-shadow based, no pseudo-elements)
  const powerClasses = (() => {
    if (!powers || (variant !== 'player' && variant !== 'enemy')) return []
    const entries = Object.entries(powers)
    if (entries.length === 0) return []

    const result: string[] = []

    // Check for buffs vs debuffs
    const debuffIds = ['weak', 'vulnerable', 'frail', 'poison', 'burning', 'frozen', 'wet', 'oiled']
    const hasBuffs = entries.some(([id]) => !debuffIds.includes(id))
    const hasDebuffs = entries.some(([id]) => debuffIds.includes(id))

    if (hasBuffs) result.push('has-buffs')
    if (hasDebuffs) result.push('has-debuffs')

    // Elemental status auras
    if (powers.burning) result.push('has-burning')
    if (powers.frozen) result.push('has-frozen')
    if (powers.charged) result.push('has-charged')
    if (powers.poison) result.push('has-poison')

    return result
  })()

  const classes = [
    'Card',
    `Card--${variant}`,
    theme && `Card--${theme}`,
    rarity && `Card--${rarity}`,
    element && `Card--element-${element}`,
    upgraded && 'Card--upgraded',
    playable && 'is-playable',
    disabled && 'is-disabled',
    ...powerClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Particle aura for premium rarities
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    if (rarity !== 'mythic' && rarity !== 'ancient') return

    const interval = setInterval(() => {
      emitParticle(card, rarity === 'ancient' ? 'ancientAura' : 'mythicAura')
    }, rarity === 'ancient' ? 500 : 2000)

    return () => clearInterval(interval)
  }, [rarity])

  // Spectral shimmer effect for rare/epic cards (non-WebGL visual enhancement)
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    // Only for rare/epic - premium rarities use WebGL shader instead
    if (rarity !== 'rare' && rarity !== 'epic') return

    const effects = gsap.effects as Record<string, (el: HTMLElement, opts?: object) => gsap.core.Tween>
    if (!effects.spectralShimmer) return

    const shimmer = effects.spectralShimmer(card, { rarity })
    return () => { shimmer?.kill() }
  }, [rarity])

  // Check if this rarity needs WebGL shader
  const isPremiumRarity = rarity === 'legendary' || rarity === 'mythic' || rarity === 'ancient'
  const cardDimensions = CARD_DIMENSIONS[variant]

  // Mouse handlers only for premium cards (to avoid overhead on common cards)
  const mouseHandlers = isPremiumRarity
    ? {
        onMouseMove: handleMouseMove,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      }
    : {}

  return (
    <div ref={cardRef} className={classes} onClick={onClick} {...mouseHandlers} {...dataAttrs}>
      {/* WebGL Holographic shader for premium rarities */}
      {isPremiumRarity && (
        <RarityShader
          rarity={rarity}
          element={element}
          width={cardDimensions.width}
          height={cardDimensions.height}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          isHovered={isHovered}
        />
      )}

      {/* Energy badge (hand cards) - colored by element */}
      {variant === 'hand' && energy !== undefined && (
        <div className={`Card__energy-badge ${
          costModified
            ? 'Card__energy-badge--modified'
            : element
              ? `Card__energy-badge--${element}`
              : ''
        }`}>
          {energy}
        </div>
      )}

      {/* Element emblem (hand cards) - wrapped for absolute positioning */}
      {variant === 'hand' && element && (
        <div className="Card__element-emblem-wrapper">
          <div className={`Card__element-emblem Card__element-emblem--${element}`}>
            <Icon icon={ELEMENT_CONFIG[element].icon} className={`w-3.5 h-3.5 ${ELEMENT_CONFIG[element].color}`} />
          </div>
        </div>
      )}

      {/* Status keyword badges (ethereal/retained) */}
      {variant === 'hand' && (ethereal || retained) && (
        <div className="absolute top-10 right-1.5 flex flex-col gap-1 z-10">
          {ethereal && (
            <div className="Card__status-badge Card__status-badge--ethereal" title="Ethereal - Exhausts if not played">
              <Icon icon="game-icons:ghost" className="w-3 h-3" />
            </div>
          )}
          {retained && (
            <div className="Card__status-badge Card__status-badge--retained" title="Retained - Stays in hand">
              <Icon icon="game-icons:hand" className="w-3 h-3" />
            </div>
          )}
        </div>
      )}

      {/* Top-right info column (element + intent + powers) for player/enemy */}
      {(variant === 'player' || variant === 'enemy') && (
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
          {/* Element icon (both player and enemy) */}
          {element && (
            <div className={`Card__element-emblem Card__element-emblem--${element}`}>
              <Icon icon={ELEMENT_CONFIG[element].icon} className={`w-3 h-3 ${ELEMENT_CONFIG[element].color}`} />
            </div>
          )}
          {/* Intent badge (enemies only) */}
          {variant === 'enemy' && intent && (
            <div className="px-2 py-1 rounded bg-surface-alt/90 text-sm flex items-center gap-1">
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
          {/* Power indicators stacked vertically */}
          {powers && Object.keys(powers).length > 0 && (
            <PowerIndicatorsVertical powers={powers} />
          )}
        </div>
      )}

      {/* Energy orb inside player card */}
      {variant === 'player' && energy !== undefined && (
        <div className="absolute top-2 left-2 EnergyOrb text-xs z-10" data-energy-orb>
          {energy}/{maxEnergy}
        </div>
      )}

      {/* Full-bleed card art */}
      {resolvedImage && !imageError ? (
        <img
          src={resolvedImage}
          alt={name}
          className="Card__image"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="Card__image-fallback">
          <Icon
            icon={getCardIcon(variant, theme)}
            className="w-20 h-20 opacity-40"
          />
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="Card__gradient-overlay" />

      {/* Card info footer - hand cards only */}
      {variant === 'hand' && (
        <div className="Card__info">
          <div className="Card__name-bar">
            <span className="Card__name">{displayName}</span>
          </div>
          {description && (
            <div className="Card__description">{description}</div>
          )}
        </div>
      )}

      {/* Entity info footer - player/enemy cards (name + health) */}
      {(variant === 'player' || variant === 'enemy') && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col">
          {/* Name */}
          <div className="Card__name-bar mx-2">
            <span className="Card__name">{displayName}</span>
          </div>
          {/* Health bar */}
          <div className="px-3 py-1">
            <HealthBar
              current={currentHealth ?? 0}
              max={maxHealth ?? 1}
              block={block}
            />
          </div>
        </div>
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

/**
 * Get HP bar color using HSL interpolation: green (healthy) → yellow (mid) → red (critical)
 * Hue: 120 (green) → 60 (yellow) → 0 (red)
 */
function getHealthColor(percent: number): { hue: number; saturation: number; lightness: number } {
  // Clamp to 0-100
  const p = Math.max(0, Math.min(100, percent))

  // Hue: 0% → 0 (red), 50% → 45 (yellow-orange), 100% → 120 (green)
  // Use a slight curve to make yellow region more visible
  const hue = p <= 50
    ? (p / 50) * 45  // 0-50% maps to red-yellow (0-45)
    : 45 + ((p - 50) / 50) * 75  // 50-100% maps to yellow-green (45-120)

  // Saturation: slightly higher at extremes for visual pop
  const saturation = 75 + Math.abs(p - 50) * 0.3

  // Lightness: slightly brighter in mid-range for visibility
  const lightness = 42 + (1 - Math.abs(p - 50) / 50) * 8

  return { hue, saturation, lightness }
}

function HealthBar({ current, max, block = 0 }: HealthBarProps) {
  const healthPercent = Math.max(0, Math.min(100, (current / max) * 100))
  const blockPercent = Math.max(0, Math.min(100, (block / max) * 100))

  const color = getHealthColor(healthPercent)
  const isCritical = healthPercent <= 25
  const isLow = healthPercent <= 50

  return (
    <div
      className={`HealthBar ${isCritical ? 'HealthBar--critical' : ''} ${isLow && !isCritical ? 'HealthBar--low' : ''}`}
      style={{
        '--hp-hue': color.hue,
        '--hp-saturation': `${color.saturation}%`,
        '--hp-lightness': `${color.lightness}%`,
        '--hp-percent': healthPercent,
      } as React.CSSProperties}
    >
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

// Small power icon mapping for entity cards
const POWER_ICONS: Record<string, { icon: string; color: string; isDebuff?: boolean }> = {
  strength: { icon: 'game-icons:muscle-up', color: 'text-red-400' },
  rage: { icon: 'game-icons:enrage', color: 'text-orange-400' },
  berserk: { icon: 'game-icons:angry-eyes', color: 'text-red-500' },
  block: { icon: 'game-icons:shield', color: 'text-blue-400' },
  armor: { icon: 'game-icons:chest-armor', color: 'text-slate-300' },
  thorns: { icon: 'game-icons:thorn-helix', color: 'text-amber-500' },
  regeneration: { icon: 'game-icons:healing', color: 'text-green-400' },
  dexterity: { icon: 'game-icons:cat', color: 'text-emerald-400' },
  vulnerable: { icon: 'game-icons:broken-shield', color: 'text-orange-500', isDebuff: true },
  weak: { icon: 'game-icons:arm-sling', color: 'text-lime-500', isDebuff: true },
  frail: { icon: 'game-icons:cracked-shield', color: 'text-cyan-500', isDebuff: true },
  poison: { icon: 'game-icons:poison-bottle', color: 'text-green-500', isDebuff: true },
  burning: { icon: 'game-icons:fire', color: 'text-orange-500', isDebuff: true },
  frozen: { icon: 'game-icons:frozen-block', color: 'text-cyan-400', isDebuff: true },
}

interface PowerIndicatorsProps {
  powers: Powers
}

// Power indicators using PowerToken icon-stack pattern with stack change animations
const PowerIndicatorsVertical = memo(function PowerIndicatorsVertical({ powers }: PowerIndicatorsProps) {
  const entries = Object.entries(powers)
  const prevAmountsRef = useRef<Record<string, number>>({})
  const [animatingPowers, setAnimatingPowers] = useState<Record<string, 'up' | 'down'>>({})

  // Detect stack changes and trigger animations
  useEffect(() => {
    const newAnimations: Record<string, 'up' | 'down'> = {}

    for (const [id, power] of entries) {
      const prevAmount = prevAmountsRef.current[id]
      if (prevAmount !== undefined && prevAmount !== power.amount) {
        newAnimations[id] = power.amount > prevAmount ? 'up' : 'down'
      }
    }

    // Update previous amounts for next comparison
    prevAmountsRef.current = Object.fromEntries(entries.map(([id, p]) => [id, p.amount]))

    if (Object.keys(newAnimations).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync animation state with power changes
      setAnimatingPowers(newAnimations)
      // Clear animations after they complete (400ms matches CSS duration)
      const timer = setTimeout(() => setAnimatingPowers({}), 400)
      return () => clearTimeout(timer)
    }
  }, [entries])

  if (entries.length === 0) return null

  return (
    <div className="flex flex-col items-end gap-1.5 pr-1">
      {entries.slice(0, 5).map(([id, power]) => {
        const config = POWER_ICONS[id] || { icon: 'game-icons:uncertainty', color: 'text-gray-400' }
        const isDebuff = config.isDebuff ?? false

        // Determine token modifier class
        let modifierClass = isDebuff ? 'PowerToken--debuff' : 'PowerToken--buff'
        if (id === 'burning') modifierClass = 'PowerToken--fire'
        else if (id === 'frozen') modifierClass = 'PowerToken--ice'
        else if (id === 'charged') modifierClass = 'PowerToken--lightning'
        else if (id === 'poison') modifierClass = 'PowerToken--poison'

        // Add animation class if this power just changed
        const animClass = animatingPowers[id] ? `PowerToken--pulse-${animatingPowers[id]}` : ''
        const countAnimClass = animatingPowers[id] ? 'PowerToken-count--changed' : ''

        return (
          <PowerTooltip key={id} powerId={id} power={power}>
            <div className={`PowerToken ${modifierClass} ${animClass}`}>
              <Icon icon={config.icon} className={`PowerToken-icon ${config.color}`} />
              <span className={`PowerToken-count ${countAnimClass}`}>{power.amount}</span>
            </div>
          </PowerTooltip>
        )
      })}
      {entries.length > 5 && (
        <div className="PowerToken PowerToken--more">
          +{entries.length - 5}
        </div>
      )}
    </div>
  )
})

export default Card
