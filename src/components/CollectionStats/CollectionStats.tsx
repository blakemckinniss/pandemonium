import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import { getAllCards, getCardDefinition } from '../../game/cards'
import type { CollectionCard } from '../../stores/db'
import type { CardRarity } from '../../types'

interface CollectionStatsProps {
  collection: CollectionCard[]
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

const RARITY_ORDER: CardRarity[] = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary', 'mythic', 'ancient']

const RARITY_COLORS: Record<CardRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  'ultra-rare': '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ef4444',
  ancient: '#ec4899',
}

const SOURCE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  starter: { label: 'Starter', icon: 'mdi:star-outline', color: '#9ca3af' },
  pack: { label: 'Packs', icon: 'mdi:package-variant', color: '#3b82f6' },
  reward: { label: 'Rewards', icon: 'mdi:trophy', color: '#f59e0b' },
  shop: { label: 'Shop', icon: 'mdi:store', color: '#22c55e' },
  craft: { label: 'Crafted', icon: 'mdi:hammer-wrench', color: '#a855f7' },
}

interface CollectionAnalysis {
  totalUnique: number
  totalInGame: number
  completionPct: number
  totalCopies: number
  byRarity: Record<CardRarity, { owned: number; total: number }>
  bySource: Record<string, number>
  recentCards: { cardId: string; name: string; obtainedAt: Date; source: string }[]
}

function analyzeCollection(collection: CollectionCard[]): CollectionAnalysis {
  const allCards = getAllCards()
  // Filter to collectible cards (exclude hero/enemy/status/curse)
  const collectibleCards = allCards.filter(
    (c) => !['hero', 'enemy', 'status', 'curse'].includes(c.theme)
  )

  const ownedIds = new Set(collection.map((c) => c.cardId))

  // Rarity breakdown
  const byRarity: Record<CardRarity, { owned: number; total: number }> = {} as any
  for (const rarity of RARITY_ORDER) {
    byRarity[rarity] = { owned: 0, total: 0 }
  }

  for (const card of collectibleCards) {
    const rarity = card.rarity || 'common'
    if (byRarity[rarity]) {
      byRarity[rarity].total++
      if (ownedIds.has(card.id)) {
        byRarity[rarity].owned++
      }
    }
  }

  // Source breakdown
  const bySource: Record<string, number> = {}
  for (const card of collection) {
    bySource[card.source] = (bySource[card.source] || 0) + 1
  }

  // Recent acquisitions (last 10)
  const recentCards = [...collection]
    .sort((a, b) => new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime())
    .slice(0, 5)
    .map((c) => {
      const def = getCardDefinition(c.cardId)
      return {
        cardId: c.cardId,
        name: def?.name || c.cardId,
        obtainedAt: new Date(c.obtainedAt),
        source: c.source,
      }
    })

  const totalCopies = collection.reduce((sum, c) => sum + c.quantity, 0)

  return {
    totalUnique: ownedIds.size,
    totalInGame: collectibleCards.length,
    completionPct: collectibleCards.length > 0 ? (ownedIds.size / collectibleCards.length) * 100 : 0,
    totalCopies,
    byRarity,
    bySource,
    recentCards,
  }
}

export function CollectionStats({ collection, collapsed = false, onToggleCollapsed }: CollectionStatsProps) {
  const stats = useMemo(() => analyzeCollection(collection), [collection])

  return (
    <div className="CollectionStats bg-gray-800/50 rounded-lg p-4">
      {/* Header */}
      <button
        onClick={onToggleCollapsed}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-300 mb-3 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon icon="mdi:chart-pie" className="text-energy" />
          Collection Stats
        </span>
        <Icon
          icon={collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}
          className="text-lg"
        />
      </button>

      {!collapsed && (
        <div className="space-y-4">
          {/* Completion Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Completion</span>
              <span className="text-energy font-medium">
                {stats.totalUnique} / {stats.totalInGame} ({stats.completionPct.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-energy to-green-400 transition-all duration-500"
                style={{ width: `${Math.min(stats.completionPct, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              {stats.totalCopies} total cards in collection
            </div>
          </div>

          {/* Rarity Breakdown */}
          <div>
            <div className="text-xs text-gray-500 mb-2">By Rarity</div>
            <div className="grid grid-cols-2 gap-1">
              {RARITY_ORDER.map((rarity) => {
                const data = stats.byRarity[rarity]
                if (data.total === 0) return null
                const pct = data.total > 0 ? (data.owned / data.total) * 100 : 0
                return (
                  <div
                    key={rarity}
                    className="flex items-center gap-2 text-xs p-1.5 rounded"
                    style={{ backgroundColor: `${RARITY_COLORS[rarity]}15` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: RARITY_COLORS[rarity] }}
                    />
                    <span className="flex-1 capitalize text-gray-400">{rarity}</span>
                    <span style={{ color: RARITY_COLORS[rarity] }}>
                      {data.owned}/{data.total}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Acquisition Sources */}
          {Object.keys(stats.bySource).length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Sources</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.bySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => {
                    const info = SOURCE_LABELS[source] || {
                      label: source,
                      icon: 'mdi:card',
                      color: '#9ca3af',
                    }
                    return (
                      <div
                        key={source}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: `${info.color}20`,
                          color: info.color,
                        }}
                      >
                        <Icon icon={info.icon} />
                        <span>{info.label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Recent Acquisitions */}
          {stats.recentCards.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Recent</div>
              <div className="space-y-1">
                {stats.recentCards.map((card, idx) => (
                  <div
                    key={`${card.cardId}-${idx}`}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <Icon
                      icon={SOURCE_LABELS[card.source]?.icon || 'mdi:card'}
                      className="text-gray-600"
                    />
                    <span className="flex-1 truncate">{card.name}</span>
                    <span className="text-gray-600">
                      {formatRelativeTime(card.obtainedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default CollectionStats
