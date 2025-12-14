import { useState, useRef, useLayoutEffect, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { getPowerDefinition } from '../../game/powers'
import type { Power } from '../../types'

// Elemental combo hints for status effects
const ELEMENTAL_COMBO_HINTS: Record<string, { icon: string; hint: string }[]> = {
  wet: [
    { icon: 'game-icons:lightning-bolt', hint: 'Lightning → Conducted (1.5x damage, chains to all)' },
    { icon: 'game-icons:snowflake-1', hint: 'Ice → Flash Freeze (permanent Frozen)' },
  ],
  oiled: [
    { icon: 'game-icons:fire', hint: 'Fire → Explosion (2x damage)' },
  ],
  burning: [
    { icon: 'game-icons:portal', hint: 'Void → Explosion (2x damage)' },
  ],
  frozen: [
    { icon: 'game-icons:sword-wound', hint: 'Physical → Shatter (1.5x damage, execute at 15% HP)' },
  ],
  charged: [
    { icon: 'game-icons:snowflake-1', hint: 'Ice → Conduct (+5 bonus damage)' },
  ],
}

interface PowerTooltipProps {
  powerId: string
  power: Power
  children: ReactNode
}

export function PowerTooltip({ powerId, power, children }: PowerTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Calculate tooltip position synchronously before paint (avoids flicker)
  // useLayoutEffect is synchronous so setState here is safe and intentional
  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: useLayoutEffect is sync
    setPosition(triggerRect.top > 150 ? 'top' : 'bottom')
  }, [isVisible])

  const def = getPowerDefinition(powerId)
  const isDebuff = def?.isDebuff ?? false

  // Format description with current values
  const formatDescription = () => {
    if (!def) return `Unknown power: ${powerId}`

    let desc = def.description
    // Replace {amount} with actual stacks
    desc = desc.replace(/{amount}/g, String(power.amount))
    return desc
  }

  return (
    <div
      ref={triggerRef}
      className="PowerTooltip-trigger"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(true)}
      onTouchEnd={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`PowerTooltip PowerTooltip--${position} ${isDebuff ? 'PowerTooltip--debuff' : 'PowerTooltip--buff'}`}
        >
          {/* Header */}
          <div className="PowerTooltip-header">
            <Icon
              icon={def?.icon ?? 'game-icons:uncertainty'}
              className={`w-5 h-5 ${isDebuff ? 'text-damage' : 'text-heal'}`}
            />
            <span className="PowerTooltip-name">
              {def?.name ?? powerId}
            </span>
            <span className="PowerTooltip-stacks">
              {power.amount}
            </span>
          </div>

          {/* Description */}
          <div className="PowerTooltip-desc">
            {formatDescription()}
          </div>

          {/* Duration if applicable */}
          {power.duration !== undefined && (
            <div className="PowerTooltip-duration">
              <Icon icon="game-icons:hourglass" className="w-3 h-3" />
              <span>{power.duration} turn{power.duration !== 1 ? 's' : ''} remaining</span>
            </div>
          )}

          {/* Stack behavior hint */}
          {def?.stackBehavior && (
            <div className="PowerTooltip-behavior">
              {def.stackBehavior === 'intensity' && 'Stacks increase effect'}
              {def.stackBehavior === 'duration' && 'Stacks increase duration'}
              {def.stackBehavior === 'both' && 'Stacks increase effect and duration'}
            </div>
          )}

          {/* Elemental combo hints */}
          {ELEMENTAL_COMBO_HINTS[powerId] && (
            <div className="PowerTooltip-combos">
              <div className="PowerTooltip-combos-header">
                <Icon icon="game-icons:chemical-bolt" className="w-3 h-3" />
                <span>Combo Reactions</span>
              </div>
              {ELEMENTAL_COMBO_HINTS[powerId].map((combo, idx) => (
                <div key={idx} className="PowerTooltip-combo-hint">
                  <Icon icon={combo.icon} className="w-4 h-4" />
                  <span>{combo.hint}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PowerTooltip
