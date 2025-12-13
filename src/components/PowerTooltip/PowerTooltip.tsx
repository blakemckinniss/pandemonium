import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { getPowerDefinition } from '../../game/powers'
import type { Power } from '../../types'

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

  // Calculate tooltip position on show
  useEffect(() => {
    if (!isVisible || !triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const spaceAbove = triggerRect.top

    // Prefer top, but use bottom if not enough space
    setPosition(spaceAbove > 150 ? 'top' : 'bottom')
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
        </div>
      )}
    </div>
  )
}

export default PowerTooltip
