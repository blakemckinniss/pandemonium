import { useEffect, useRef, useState, memo } from 'react'
import { Icon } from '@iconify/react'
import type { RelicInstance } from '../../types'
import { getRelicDefinition } from '../../game/relics'
import { RELIC_ICONS } from '../../config/relic-icons'
import { gsap } from '../../lib/animations'

interface RelicChipProps {
  relic: RelicInstance
  isTriggered?: boolean
}

const RelicChip = memo(function RelicChip({ relic, isTriggered }: RelicChipProps) {
  const chipRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const def = getRelicDefinition(relic.definitionId)
  if (!def) return null

  const icon = RELIC_ICONS[relic.definitionId] ?? 'game-icons:gem-pendant'
  const rarityClass = `RelicChip--${def.rarity}`

  // Truncate long names
  const shortName = def.name.length > 10 ? def.name.slice(0, 9) + '…' : def.name

  return (
    <div
      ref={chipRef}
      data-relic-id={relic.id}
      className={`RelicChip ${rarityClass} ${isTriggered ? 'is-triggered' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon icon={icon} className="RelicChip-icon" />
      <span className="RelicChip-name">{shortName}</span>
      {relic.counter !== undefined && relic.counter > 0 && (
        <span className="RelicChip-counter">{relic.counter}</span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="RelicTooltip">
          <div className="RelicTooltip-header">
            <Icon icon={icon} className="w-5 h-5" />
            <span className="RelicTooltip-name">{def.name}</span>
            <span className={`RelicTooltip-rarity RelicTooltip-rarity--${def.rarity}`}>
              {def.rarity}
            </span>
          </div>
          <div className="RelicTooltip-desc">{def.description}</div>
          {relic.counter !== undefined && (
            <div className="RelicTooltip-counter">
              <Icon icon="game-icons:stack" className="w-3 h-3" />
              <span>Counter: {relic.counter}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

interface RelicBarProps {
  relics: RelicInstance[]
  triggeredRelicId?: string // For flash animation
}

export function RelicBar({ relics, triggeredRelicId }: RelicBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousTriggeredRef = useRef<string | undefined>(undefined)

  // Pulse animation when a relic is triggered
  useEffect(() => {
    if (!triggeredRelicId || triggeredRelicId === previousTriggeredRef.current) return
    if (!containerRef.current) return

    previousTriggeredRef.current = triggeredRelicId
    const triggeredEl = containerRef.current.querySelector(`[data-relic-id="${triggeredRelicId}"]`)
    if (!triggeredEl) return

    // Create pulse animation with rarity-aware glow
    const relic = relics.find(r => r.id === triggeredRelicId)
    const def = relic ? getRelicDefinition(relic.definitionId) : null
    const glowColor = def?.rarity === 'boss' ? 'oklch(0.7 0.2 25)'
      : def?.rarity === 'rare' ? 'oklch(0.8 0.18 85)'
      : def?.rarity === 'uncommon' ? 'oklch(0.7 0.15 250)'
      : 'oklch(0.7 0.1 55)'

    gsap.timeline()
      .to(triggeredEl, {
        scale: 1.2,
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor.replace(')', ' / 0.5)')}`,
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(triggeredEl, {
        scale: 1.08,
        boxShadow: `0 0 12px ${glowColor.replace(')', ' / 0.6)')}`,
        duration: 0.25,
        ease: 'elastic.out(1, 0.5)',
      })
      .to(triggeredEl, {
        scale: 1,
        boxShadow: 'none',
        duration: 0.2,
        ease: 'power2.inOut',
        delay: 0.4,
      })
  }, [triggeredRelicId, relics])

  if (relics.length === 0) return null

  return (
    <div ref={containerRef} className="RelicChipBar">
      {relics.map((relic) => (
        <RelicChip
          key={relic.id}
          relic={relic}
          isTriggered={triggeredRelicId === relic.id}
        />
      ))}
    </div>
  )
}

export default RelicBar
