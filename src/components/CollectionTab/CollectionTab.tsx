import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import type { CardDefinition, CardFilters, SortOption, SortDirection } from '../../types'
import { getCardDefinition } from '../../game/cards'
import { Card } from '../Card/Card'
import { getCardDefProps } from '../Card/utils'
import { CardFiltersBar, filterCards, sortCards } from '../CardFilters'
import { CollectionStats } from '../CollectionStats'

interface LegacyCollectionCard {
  cardId: string
  quantity: number
  source: string
  obtainedAt: Date
}

interface CollectionCardData {
  def: CardDefinition
  quantity: number
}

interface CollectionTabProps {
  collection: LegacyCollectionCard[]
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
  collection, filters, setFilters,
  sortBy, sortDirection, onSortChange,
  collectionStatsCollapsed, setCollectionStatsCollapsed,
  onAddCard, onViewCard,
}: CollectionTabProps) {
  // Build set of owned card IDs for quick lookup
  const ownedCardIds = useMemo(() => new Set(collection.map(c => c.cardId)), [collection])

  // Build collection display from owned AI-generated cards
  const allCollectionCards = useMemo(() => {
    const cards: CollectionCardData[] = []

    for (const item of collection) {
      const def = getCardDefinition(item.cardId)
      if (!def) continue
      cards.push({ def, quantity: item.quantity })
    }

    // Apply filters and sorting
    const defs = cards.map(c => c.def)
    const filtered = filterCards(defs, filters, ownedCardIds)
    const sorted = sortCards(filtered, sortBy, sortDirection)

    return sorted.map(def => ({
      def,
      quantity: cards.find(c => c.def.id === def.id)?.quantity || 1,
    }))
  }, [collection, filters, sortBy, sortDirection, ownedCardIds])

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
              totalCards={collection.length}
              filteredCount={totalCount}
            />
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <p className="text-xs text-warm-500 mb-4">
              <Icon icon="mdi:cards" className="inline mr-1" />
              {totalCount} cards in collection
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

/** Card grid for collection display */
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
        <p className="text-sm mt-2">Open packs to add AI-generated cards!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-5 lg:gap-6" style={{
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    }}>
      {cards.map(({ def, quantity }) => (
        <div key={def.id} className="relative p-1">
          <button
            onClick={() => onAddCard(def.id)}
            onContextMenu={(e) => { e.preventDefault(); onViewCard(def) }}
            className="group relative w-full transition-all duration-300 ease-out rounded-lg
              hover:scale-105 hover:z-20 hover:shadow-[0_0_25px_5px_rgba(251,191,36,0.4)]"
            style={{ transformOrigin: 'center' }}
          >
            <Card {...getCardDefProps(def)} variant="hand" playable />
            {quantity > 1 && (
              <span className="absolute top-2 right-2 bg-energy text-warm-900 text-xs font-bold px-2 py-1 rounded-full shadow-md z-10">
                x{quantity}
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}

export default CollectionTab
