import { memo } from 'react'
import { Icon } from '@iconify/react'
import type { RelicInstance, Entity } from '../../types'
import { getRelicDefinition } from '../../game/relics'
import { getPowerDefinition } from '../../game/powers'
import { RELIC_ICONS } from '../../config/relic-icons'
import { PowerTooltip } from '../PowerTooltip/PowerTooltip'

// Power icon mapping
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
  regen: { icon: 'game-icons:healing', color: 'text-green-400' },
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

interface RelicChipProps {
  relic: RelicInstance
  isTriggered?: boolean
}

const RelicChipSidebar = memo(function RelicChipSidebar({ relic, isTriggered }: RelicChipProps) {
  const def = getRelicDefinition(relic.definitionId)
  if (!def) return null

  const icon = RELIC_ICONS[relic.definitionId] ?? 'game-icons:gem-pendant'

  return (
    <div className="RelicTooltipWrapper group relative">
      <div
        className={`SidebarChip SidebarChip--relic SidebarChip--${def.rarity} ${isTriggered ? 'is-triggered' : ''}`}
      >
        <Icon icon={icon} className="SidebarChip-icon" />
        <span className="SidebarChip-name">{def.name}</span>
        {relic.counter !== undefined && relic.counter > 0 && (
          <span className="SidebarChip-count">{relic.counter}</span>
        )}
      </div>
      {/* Tooltip */}
      <div className="RelicTooltip">
        <div className="RelicTooltip-name">{def.name}</div>
        <div className="RelicTooltip-rarity">{def.rarity}</div>
        <div className="RelicTooltip-desc">{def.description}</div>
      </div>
    </div>
  )
})

interface PowerChipProps {
  powerId: string
  amount: number
  duration?: number
}

const PowerChipSidebar = memo(function PowerChipSidebar({ powerId, amount, duration }: PowerChipProps) {
  const def = getPowerDefinition(powerId)
  const config = POWER_ICONS[powerId] || { icon: 'game-icons:uncertainty', color: 'text-warm-400' }
  const isDebuff = config.isDebuff ?? def?.isDebuff ?? false
  const name = def?.name ?? powerId

  return (
    <PowerTooltip powerId={powerId} power={{ id: powerId, amount, duration }}>
      <div className={`SidebarChip ${isDebuff ? 'SidebarChip--debuff' : 'SidebarChip--buff'}`}>
        <Icon icon={config.icon} className={`SidebarChip-icon ${config.color}`} />
        <span className="SidebarChip-name">{name}</span>
        <span className="SidebarChip-count">{amount}</span>
        {duration !== undefined && duration > 0 && (
          <span className="SidebarChip-duration">
            <Icon icon="game-icons:hourglass" className="w-2.5 h-2.5" />
            {duration}
          </span>
        )}
      </div>
    </PowerTooltip>
  )
})

interface EntityStatusProps {
  entity: Entity
  label: string
  isPlayer?: boolean
}

const EntityStatus = memo(function EntityStatus({ entity, label, isPlayer }: EntityStatusProps) {
  const powerEntries = Object.entries(entity.powers)
  if (powerEntries.length === 0) return null

  // Separate buffs and debuffs
  const buffs = powerEntries.filter(([id]) => {
    const config = POWER_ICONS[id]
    const def = getPowerDefinition(id)
    return !(config?.isDebuff ?? def?.isDebuff)
  })
  const debuffs = powerEntries.filter(([id]) => {
    const config = POWER_ICONS[id]
    const def = getPowerDefinition(id)
    return config?.isDebuff ?? def?.isDebuff
  })

  return (
    <div className={`SidebarSection ${isPlayer ? 'SidebarSection--player' : 'SidebarSection--enemy'}`}>
      <div className="SidebarSection-header">
        <span className="SidebarSection-label">{label}</span>
        <span className="SidebarSection-hp">{entity.currentHealth}/{entity.maxHealth}</span>
      </div>
      <div className="SidebarSection-chips">
        {buffs.map(([id, power]) => (
          <PowerChipSidebar key={id} powerId={id} amount={power.amount} duration={power.duration} />
        ))}
        {debuffs.map(([id, power]) => (
          <PowerChipSidebar key={id} powerId={id} amount={power.amount} duration={power.duration} />
        ))}
      </div>
    </div>
  )
})

interface StatusSidebarProps {
  relics: RelicInstance[]
  player: Entity
  enemies: Entity[]
  triggeredRelicId?: string
}

export const StatusSidebar = memo(function StatusSidebar({
  relics,
  player,
  enemies,
  triggeredRelicId,
}: StatusSidebarProps) {
  const hasRelics = relics.length > 0
  const hasPlayerPowers = Object.keys(player.powers).length > 0
  const enemiesWithPowers = enemies.filter(e => Object.keys(e.powers).length > 0)

  // Don't render if nothing to show
  if (!hasRelics && !hasPlayerPowers && enemiesWithPowers.length === 0) {
    return null
  }

  return (
    <div className="StatusSidebar">
      {/* Relics Section */}
      {hasRelics && (
        <div className="SidebarSection SidebarSection--relics">
          <div className="SidebarSection-header">
            <Icon icon="game-icons:gem-pendant" className="w-4 h-4 text-gold" />
            <span className="SidebarSection-label">Relics</span>
          </div>
          <div className="SidebarSection-chips">
            {relics.map(relic => (
              <RelicChipSidebar
                key={relic.id}
                relic={relic}
                isTriggered={triggeredRelicId === relic.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Player Status */}
      {hasPlayerPowers && (
        <EntityStatus entity={player} label={player.name} isPlayer />
      )}

      {/* Enemy Statuses */}
      {enemiesWithPowers.map(enemy => (
        <EntityStatus key={enemy.id} entity={enemy} label={enemy.name} />
      ))}
    </div>
  )
})

export default StatusSidebar
