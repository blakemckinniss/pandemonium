import { memo, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'
import { PowerTooltip } from '../PowerTooltip/PowerTooltip'
import { getPowerDefinition } from '../../game/powers'
import type { Power, Powers } from '../../types'

// Power icon mapping with colors
const POWER_ICONS: Record<string, { icon: string; color: string; isDebuff?: boolean }> = {
  // Offensive buffs
  strength: { icon: 'game-icons:muscle-up', color: 'text-red-400' },
  rage: { icon: 'game-icons:enrage', color: 'text-orange-400' },
  berserk: { icon: 'game-icons:angry-eyes', color: 'text-red-500' },

  // Defensive buffs
  block: { icon: 'game-icons:shield', color: 'text-blue-400' },
  armor: { icon: 'game-icons:chest-armor', color: 'text-slate-300' },
  thorns: { icon: 'game-icons:thorn-helix', color: 'text-amber-500' },
  regeneration: { icon: 'game-icons:healing', color: 'text-green-400' },

  // Utility buffs
  dexterity: { icon: 'game-icons:cat', color: 'text-emerald-400' },
  draw: { icon: 'game-icons:card-draw', color: 'text-cyan-400' },
  energized: { icon: 'game-icons:lightning-bolt', color: 'text-yellow-400' },
  retain: { icon: 'game-icons:card-pickup', color: 'text-purple-400' },

  // Debuffs
  vulnerable: { icon: 'game-icons:broken-shield', color: 'text-orange-500', isDebuff: true },
  weak: { icon: 'game-icons:arm-sling', color: 'text-lime-500', isDebuff: true },
  frail: { icon: 'game-icons:cracked-shield', color: 'text-cyan-500', isDebuff: true },
  poison: { icon: 'game-icons:poison-bottle', color: 'text-green-500', isDebuff: true },

  // Elemental statuses
  burning: { icon: 'game-icons:fire', color: 'text-orange-500', isDebuff: true },
  frozen: { icon: 'game-icons:frozen-block', color: 'text-cyan-400', isDebuff: true },
  wet: { icon: 'game-icons:droplet', color: 'text-blue-400', isDebuff: true },
  oiled: { icon: 'game-icons:oil-drum', color: 'text-amber-600', isDebuff: true },
  charged: { icon: 'game-icons:lightning-storm', color: 'text-yellow-400', isDebuff: true },
}

interface StatusChipProps {
  powerId: string
  power: Power
  isNew?: boolean
  isTriggered?: boolean
}

export const StatusChip = memo(function StatusChip({
  powerId,
  power,
  isNew = false,
  isTriggered = false
}: StatusChipProps) {
  const chipRef = useRef<HTMLDivElement>(null)
  const def = getPowerDefinition(powerId)
  const config = POWER_ICONS[powerId] || { icon: 'game-icons:uncertainty', color: 'text-warm-400' }
  const isDebuff = config.isDebuff ?? def?.isDebuff ?? false

  // Entrance animation for new powers
  useEffect(() => {
    if (!isNew || !chipRef.current) return

    gsap.fromTo(chipRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
    )
  }, [isNew])

  // Trigger animation
  useEffect(() => {
    if (!isTriggered || !chipRef.current) return

    gsap.timeline()
      .to(chipRef.current, {
        scale: 1.15,
        boxShadow: isDebuff
          ? '0 0 12px oklch(0.6 0.2 25), 0 0 24px oklch(0.6 0.2 25 / 0.5)'
          : '0 0 12px oklch(0.7 0.15 145), 0 0 24px oklch(0.7 0.15 145 / 0.5)',
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(chipRef.current, {
        scale: 1,
        boxShadow: 'none',
        duration: 0.3,
        ease: 'power2.inOut',
      })
  }, [isTriggered, isDebuff])

  const displayName = def?.name ?? powerId
  // Truncate long names
  const shortName = displayName.length > 8 ? displayName.slice(0, 7) + '…' : displayName

  return (
    <PowerTooltip powerId={powerId} power={power}>
      <div
        ref={chipRef}
        className={`StatusChip ${isDebuff ? 'StatusChip--debuff' : 'StatusChip--buff'}`}
      >
        <Icon icon={config.icon} className={`StatusChip-icon ${config.color}`} />
        <span className="StatusChip-name">{shortName}</span>
        <span className="StatusChip-stacks">{power.amount}</span>
        {power.duration !== undefined && power.duration > 0 && (
          <span className="StatusChip-duration">
            <Icon icon="game-icons:hourglass" className="w-2.5 h-2.5" />
            {power.duration}
          </span>
        )}
      </div>
    </PowerTooltip>
  )
})

interface StatusChipBarProps {
  powers: Powers
  triggeredPowerId?: string
  newPowerIds?: string[]
  layout?: 'horizontal' | 'vertical'
  maxVisible?: number
}

export const StatusChipBar = memo(function StatusChipBar({
  powers,
  triggeredPowerId,
  newPowerIds = [],
  layout = 'horizontal',
  maxVisible = 6,
}: StatusChipBarProps) {
  const entries = Object.entries(powers)

  if (entries.length === 0) return null

  // Separate buffs and debuffs
  const buffs = entries.filter(([id]) => {
    const config = POWER_ICONS[id]
    const def = getPowerDefinition(id)
    return !(config?.isDebuff ?? def?.isDebuff)
  })

  const debuffs = entries.filter(([id]) => {
    const config = POWER_ICONS[id]
    const def = getPowerDefinition(id)
    return config?.isDebuff ?? def?.isDebuff
  })

  const visibleBuffs = buffs.slice(0, maxVisible)
  const visibleDebuffs = debuffs.slice(0, maxVisible)
  const hiddenCount = entries.length - visibleBuffs.length - visibleDebuffs.length

  return (
    <div className={`StatusChipBar StatusChipBar--${layout}`}>
      {/* Buffs section */}
      {visibleBuffs.length > 0 && (
        <div className="StatusChipBar-section StatusChipBar-section--buffs">
          {visibleBuffs.map(([id, power]) => (
            <StatusChip
              key={id}
              powerId={id}
              power={power}
              isNew={newPowerIds.includes(id)}
              isTriggered={triggeredPowerId === id}
            />
          ))}
        </div>
      )}

      {/* Debuffs section */}
      {visibleDebuffs.length > 0 && (
        <div className="StatusChipBar-section StatusChipBar-section--debuffs">
          {visibleDebuffs.map(([id, power]) => (
            <StatusChip
              key={id}
              powerId={id}
              power={power}
              isNew={newPowerIds.includes(id)}
              isTriggered={triggeredPowerId === id}
            />
          ))}
        </div>
      )}

      {/* Overflow indicator */}
      {hiddenCount > 0 && (
        <div className="StatusChip StatusChip--overflow">
          +{hiddenCount}
        </div>
      )}
    </div>
  )
})

export default StatusChip
