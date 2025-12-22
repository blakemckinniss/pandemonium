import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import type { CardDefinition, CardFilters, SortOption, SortDirection, UnlockCondition } from '../../types'
import type { CollectionCardMeta } from '../../types/deck-builder'
import { getCardDefinition } from '../../game/cards'
import { Card } from '../Card/Card'
import { getCardDefProps } from '../Card/utils'
import { CardFiltersBar } from '../CardFilters'
import { CollectionStats } from '../CollectionStats'

interface LegacyCollectionCard {
  cardId: string
  quantity: number
  source: string
  obtainedAt: Date
}

/** Format unlock condition for display */
function formatUnlockCondition(condition: UnlockCondition): string {
  switch (condition.type) {
    case 'always':
      return 'Available from start'
    case 'totalWins':
      return `Win ${condition.count} run${condition.count > 1 ? 's' : ''}`
    case 'streakReached':
      return `Reach a ${condition.streak}-win streak`
    case 'dungeonClear':
      return `Clear the ${condition.dungeonId.replace(/_/g, ' ')} dungeon`
    case 'heroAffection':
      return `Reach affection level ${condition.level} with ${condition.heroId.replace(/^hero_/, '')}`
    case 'achievement':
      return `Unlock achievement: ${condition.achievementId.replace(/_/g, ' ')}`
    default:
      return 'Unknown unlock condition'
  }
}

interface CollectionCardData {
  def: CardDefinition
  quantity: number
  locked: boolean
  unlockCondition?: UnlockCondition
}

interface CollectionTabProps {
  collection: LegacyCollectionCard[]
  evergreenMeta: CollectionCardMeta[]
  filters: CardFilters
  setFilters: (f: CardFilters) => void
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (s: SortOption, d: SortDirection) => void
  collectionStatsCollapsed: boolean
  setCollectionStatsCollapsed: (c: boolean) => void
  onAddCard: (id: string) => void
  onViewCard: (card: CardDefinition) => void
}

export function CollectionTab({
  collection, evergreenMeta, filters, setFilters,
  sortBy, sortDirection, onSortChange,
  collectionStatsCollapsed, setCollectionStatsCollapsed,
  onAddCard, onViewCard,
}: CollectionTabProps) {
  // Build set of owned card IDs for quick lookup
  const ownedCardIds = useMemo(() => new Set(collection.map(c => c.cardId)), [collection])

  // Build complete collection display: owned + locked cards
  const allCollectionCards = useMemo(() => {
    const cards: CollectionCardData[] = []

    for (const meta of evergreenMeta) {
      const def = getCardDefinition(meta.cardId)
      if (!def) continue

      const isOwned = ownedCardIds.has(meta.cardId)
      cards.push({
        def,
        quantity: isOwned ? 1 : 0,
        locked: !isOwned,
        unlockCondition: isOwned ? undefined : meta.unlockCondition,
      })
    }

    // Sort: unlocked first, then by rarity
    return cards.sort((a, b) => {
      if (a.locked !== b.locked) return a.locked ? 1 : -1
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'ultra-rare', 'legendary', 'mythic', 'ancient']
      const aRarity = rarityOrder.indexOf(a.def.rarity ?? 'common')
      const bRarity = rarityOrder.indexOf(b.def.rarity ?? 'common')
      return bRarity - aRarity
    })
  }, [evergreenMeta, ownedCardIds])

  const unlockedCount = allCollectionCards.filter(c => !c.locked).length
  const totalCount = allCollectionCards.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Two-column layout: Stats sidebar + Card grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: Collection Stats */}
        <aside className="w-72 flex-shrink-0 border-border overflow-y-auto p-4">
          <CollectionStats
            collection={collection}
            collapsed={collectionStatsCollapsed}
            onToggleCollapsed={() => setCollectionStatsCollapsed(!collectionStatsCollapsed)}
          />
        </aside>

        {/* Right column: Filters + Card Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4">
            <CardFiltersBar
              filters={filters}
              onFiltersChange={setFilters}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
              totalCards={totalCount}
              filteredCount={unlockedCount}
            />
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <p className="text-xs text-warm-500 mb-4">
              <Icon icon="mdi:cards" className="inline mr-1" />
              {unlockedCount} / {totalCount} cards unlocked
            </p>
            <CollectionCardGrid
              cards={allCollectionCards}
              onAddCard={onAddCard}
              onViewCard={onViewCard}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Card grid that shows locked/unlocked state */
function CollectionCardGrid({
  cards,
  onAddCard,
  onViewCard,
}: {
  cards: CollectionCardData[]
  onAddCard: (id: string) => void
  onViewCard: (card: CardDefinition) => void
}) {
  if (cards.length === 0) {
    return (
      <div className="text-center text-warm-500 py-12">
        <Icon icon="mdi:cards-outline" className="text-4xl mb-2 opacity-50" />
        <p>No cards in collection</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-5 lg:gap-6" style={{
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    }}>
      {cards.map(({ def, locked, unlockCondition }) => (
        <div key={def.id} className="relative p-1">
          <button
            onClick={() => !locked && onAddCard(def.id)}
            onContextMenu={(e) => { e.preventDefault(); onViewCard(def) }}
            disabled={locked}
            className={`group relative w-full transition-all duration-300 ease-out rounded-lg
              ${locked
                ? 'opacity-50 grayscale cursor-not-allowed'
                : 'hover:scale-105 hover:z-20 hover:shadow-[0_0_25px_5px_rgba(251,191,36,0.4)]'
              }`}
            style={{ transformOrigin: 'center' }}
          >
            <Card {...getCardDefProps(def)} variant="hand" playable={!locked} />

            {/* Lock overlay for locked cards */}
            {locked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                <Icon icon="mdi:lock" className="text-3xl text-warm-400 mb-2" />
                {unlockCondition && (
                  <p className="text-xs text-warm-300 text-center px-2 leading-tight">
                    {formatUnlockCondition(unlockCondition)}
                  </p>
                )}
              </div>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}

export default CollectionTab
