import { Icon } from '@iconify/react'
import type { RelicInstance } from '../../types'
import { getRelicDefinition } from '../../game/relics'

// Relic icons by ID
const RELIC_ICONS: Record<string, string> = {
  burning_blood: 'game-icons:drop',
  anchor: 'game-icons:anchor',
  lantern: 'game-icons:lantern-flame',
  bag_of_marbles: 'game-icons:marble-tap',
  bronze_scales: 'game-icons:fish-scales',
  orichalcum: 'game-icons:ore',
  blood_vial: 'game-icons:vial',
  pen_nib: 'game-icons:quill-ink',
  meat_on_bone: 'game-icons:meat',
  eternal_feather: 'game-icons:feather',
  war_paint: 'game-icons:war-axe',
  captains_wheel: 'game-icons:ship-wheel',
  paper_krane: 'game-icons:origami',
  tungsten_rod: 'game-icons:metal-bar',
  ice_cream: 'game-icons:ice-cream-cone',
  runic_pyramid: 'game-icons:egyptian-pyramids',
}

// Rarity colors
const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-500 bg-gray-800/50',
  uncommon: 'border-blue-500 bg-blue-900/30',
  rare: 'border-yellow-500 bg-yellow-900/30',
  boss: 'border-red-500 bg-red-900/30',
}

interface RelicBarProps {
  relics: RelicInstance[]
  triggeredRelicId?: string // For flash animation
}

export function RelicBar({ relics, triggeredRelicId }: RelicBarProps) {
  if (relics.length === 0) return null

  return (
    <div className="flex gap-1.5 flex-wrap">
      {relics.map((relic) => {
        const def = getRelicDefinition(relic.definitionId)
        if (!def) return null

        const icon = RELIC_ICONS[relic.definitionId] ?? 'game-icons:gem-pendant'
        const rarityClass = RARITY_COLORS[def.rarity] ?? RARITY_COLORS.common
        const isTriggered = triggeredRelicId === relic.id

        return (
          <div
            key={relic.id}
            className={`RelicIcon w-8 h-8 rounded border flex items-center justify-center cursor-help transition-all ${rarityClass} ${
              isTriggered ? 'ring-2 ring-energy scale-110' : ''
            }`}
            title={`${def.name}: ${def.description}`}
          >
            <Icon icon={icon} className="w-5 h-5 text-gray-200" />
            {relic.counter !== undefined && relic.counter > 0 && (
              <span className="absolute -bottom-1 -right-1 text-[10px] bg-surface px-1 rounded">
                {relic.counter}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default RelicBar
