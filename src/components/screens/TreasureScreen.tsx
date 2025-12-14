import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import type { RelicDefinition } from '../../types'
import { getAllRelics } from '../../game/relics'

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

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400 bg-gray-800/50',
  uncommon: 'border-blue-400 bg-blue-900/30',
  rare: 'border-yellow-400 bg-yellow-900/30',
  boss: 'border-red-400 bg-red-900/30',
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-blue-400',
  rare: 'text-yellow-400',
  boss: 'text-red-400',
}

interface TreasureScreenProps {
  floor: number
  isLargeTreasure: boolean
  ownedRelicIds: string[]
  onSelectRelic: (relicId: string) => void
  onSkip: () => void
}

export function TreasureScreen({
  floor,
  isLargeTreasure,
  ownedRelicIds,
  onSelectRelic,
  onSkip,
}: TreasureScreenProps) {
  const [relicChoices, setRelicChoices] = useState<RelicDefinition[]>([])

  useEffect(() => {
    const allRelics = getAllRelics().filter((r) => !ownedRelicIds.includes(r.id))

    // Large treasure: guaranteed rare, 3 choices
    // Small treasure: weighted rarity, 2 choices
    const numChoices = isLargeTreasure ? 3 : 2

    const choices: RelicDefinition[] = []
    const usedIds = new Set<string>()

    if (allRelics.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRelicChoices(choices)
      return
    }

    for (let i = 0; i < numChoices; i++) {
      let targetRarity: 'common' | 'uncommon' | 'rare'

      if (isLargeTreasure && i === 0) {
        // First choice in large treasure is guaranteed rare
        targetRarity = 'rare'
      } else {
        // Weighted selection
        const roll = Math.random()
        if (roll > 0.85) targetRarity = 'rare'
        else if (roll > 0.5) targetRarity = 'uncommon'
        else targetRarity = 'common'
      }

      let pool = allRelics.filter(
        (r) => r.rarity === targetRarity && !usedIds.has(r.id)
      )

      // Fallback to any rarity if pool empty
      if (pool.length === 0) {
        pool = allRelics.filter((r) => !usedIds.has(r.id))
      }

      if (pool.length > 0) {
        const relic = pool[Math.floor(Math.random() * pool.length)]
        choices.push(relic)
        usedIds.add(relic.id)
      }
    }

    setRelicChoices(choices)
  }, [isLargeTreasure, ownedRelicIds])

  return (
    <div className="TreasureScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-950 to-gray-950">
      <div className="text-6xl mb-4">{isLargeTreasure ? '👑' : '💎'}</div>
      <h1 className="text-4xl font-bold mb-2 text-purple-300">
        {isLargeTreasure ? 'Treasure Vault' : 'Treasure Cache'}
      </h1>
      <p className="text-gray-400 mb-8">Floor {floor} - Choose a relic</p>

      {relicChoices.length === 0 ? (
        <p className="text-gray-500 mb-8">No relics available</p>
      ) : (
        <div className="flex gap-6 mb-8">
          {relicChoices.map((relic) => {
            const icon = RELIC_ICONS[relic.id] ?? 'game-icons:gem-pendant'
            const rarityClass = RARITY_COLORS[relic.rarity] ?? RARITY_COLORS.common
            const rarityText = RARITY_TEXT[relic.rarity] ?? RARITY_TEXT.common

            return (
              <button
                key={relic.id}
                onClick={() => onSelectRelic(relic.id)}
                className={`group relative p-6 rounded-xl border-2 ${rarityClass} hover:scale-105 hover:brightness-110 transition-all min-w-48`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center">
                    <Icon icon={icon} className="w-10 h-10 text-purple-200" />
                  </div>
                  <div className="text-lg font-medium text-white">{relic.name}</div>
                  <div className={`text-xs uppercase tracking-wide ${rarityText}`}>
                    {relic.rarity}
                  </div>
                  <div className="text-sm text-gray-300 text-center max-w-40">
                    {relic.description}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors" />
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={onSkip}
        className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
      >
        Skip treasure
      </button>
    </div>
  )
}

export default TreasureScreen
