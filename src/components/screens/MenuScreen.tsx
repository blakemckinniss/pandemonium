import { useEffect, useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import {
  getCustomDecks,
  getRunStats,
  getCollection,
  initializeStarterCollection,
  getAllDungeonDecks,
  saveCustomDeck,
  updateCustomDeck,
  deleteCustomDeck,
  addToCollection,
  type CustomDeckRecord,
  type CollectionCard,
} from '../../stores/db'
import type { DungeonDeckDefinition, CardDefinition, CardFilters, SortOption, SortDirection } from '../../types'
import { getStarterCardIds, getStarterHeroId, getAllHeroes, getCardDefinition } from '../../game/cards'
import { seedBaseContent, isContentSeeded } from '../../game/seed-content'
import { generatePack, type PackConfig } from '../../game/card-generator'
import { generateUid } from '../../lib/utils'
import { THEMES, getTheme } from '../../config/themes'
import { Card, getCardDefProps } from '../Card/Card'
import { CardFiltersBar, filterCards, sortCards } from '../CardFilters'
import { CardDetailModal } from '../CardDetailModal'
import { DeckAnalytics } from '../DeckAnalytics'
import { CollectionStats } from '../CollectionStats'
import { GachaReveal } from '../PackOpening'

type HubTab = 'play' | 'collection' | 'build' | 'packs'

const INITIAL_FILTERS: CardFilters = {
  themes: [],
  rarities: [],
  elements: [],
  energyRange: [0, 10],
  owned: null,
  searchQuery: '',
}

interface MenuScreenProps {
  onStartRun: (deckId: string | null, heroId: string, dungeonDeckId?: string) => void
  onDeckBuilder?: () => void // Kept for backwards compat but not used
}

export function MenuScreen({ onStartRun }: MenuScreenProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<HubTab>('play')

  // Play tab state
  const [customDecks, setCustomDecks] = useState<CustomDeckRecord[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedHeroId, setSelectedHeroId] = useState<string>(getStarterHeroId())
  const [stats, setStats] = useState({ totalRuns: 0, totalWins: 0, bestFloor: 0 })
  const [availableHeroes, setAvailableHeroes] = useState<CardDefinition[]>([])
  const [deckValidation, setDeckValidation] = useState<{ valid: boolean; missing: string[] }>({
    valid: true,
    missing: [],
  })
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [dungeonDecks, setDungeonDecks] = useState<DungeonDeckDefinition[]>([])
  const [selectedDungeonId, setSelectedDungeonId] = useState<string | undefined>(undefined)

  // Collection & deck building state
  const [collection, setCollection] = useState<CollectionCard[]>([])
  const [currentDeck, setCurrentDeck] = useState<string[]>([])
  const [deckName, setDeckName] = useState('Custom Deck')
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)

  // Filter & Sort state
  const [filters, setFilters] = useState<CardFilters>(INITIAL_FILTERS)
  const [sortBy, setSortBy] = useState<SortOption>('rarity')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // UI state
  const [selectedCard, setSelectedCard] = useState<CardDefinition | null>(null)
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false)
  const [collectionStatsCollapsed, setCollectionStatsCollapsed] = useState(false)

  // Pack opening state
  const [isGenerating, setIsGenerating] = useState(false)
  const [packError, setPackError] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string>('standard')
  const [packSize, setPackSize] = useState(6)
  const [revealedCards, setRevealedCards] = useState<CardDefinition[]>([])
  const [showGacha, setShowGacha] = useState(false)
  const [pendingCards, setPendingCards] = useState<CardDefinition[]>([])

  // Load data on mount
  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    await initializeStarterCollection(getStarterCardIds())

    const [decks, runStats, owned, dungeons, contentSeeded] = await Promise.all([
      getCustomDecks(),
      getRunStats(),
      getCollection(),
      getAllDungeonDecks(),
      isContentSeeded(),
    ])

    setCustomDecks(decks)
    setStats({ totalRuns: runStats.totalRuns, totalWins: runStats.totalWins, bestFloor: runStats.bestFloor })
    setCollection(owned)
    setDungeonDecks(dungeons)
    setSeeded(contentSeeded)

    // Load heroes
    const allHeroes = getAllHeroes()
    const ownedCardIds = new Set(owned.map((c) => c.cardId))
    const starterHeroId = getStarterHeroId()
    const heroes = allHeroes.filter((h) => h.id === starterHeroId || ownedCardIds.has(h.id))
    const starterHero = getCardDefinition(starterHeroId)
    const finalHeroes = starterHero && !heroes.find((h) => h.id === starterHeroId)
      ? [starterHero, ...heroes]
      : heroes
    setAvailableHeroes(finalHeroes)
  }

  // Validate selected deck against collection
  useEffect(() => {
    if (!selectedDeckId) {
      setDeckValidation({ valid: true, missing: [] })
      return
    }
    const deck = customDecks.find((d) => d.deckId === selectedDeckId)
    if (!deck) {
      setDeckValidation({ valid: false, missing: [] })
      return
    }
    const ownedCardIds = new Set(collection.map((c) => c.cardId))
    const missing = deck.cardIds.filter((cardId) => !ownedCardIds.has(cardId))
    setDeckValidation({ valid: missing.length === 0, missing: [...new Set(missing)] })
  }, [selectedDeckId, customDecks, collection])

  // Memoized card data
  const ownedCardIds = useMemo(() => new Set(collection.map((c) => c.cardId)), [collection])

  const collectionCardDefs = useMemo(() => {
    return collection
      .map((c) => {
        const def = getCardDefinition(c.cardId)
        return def ? { def, quantity: c.quantity } : null
      })
      .filter((c): c is { def: CardDefinition; quantity: number } => c !== null)
  }, [collection])

  const filteredCollectionCards = useMemo(() => {
    const defs = collectionCardDefs.map((c) => c.def)
    const filtered = filterCards(defs, filters, ownedCardIds)
    const sorted = sortCards(filtered, sortBy, sortDirection)
    return sorted.map((def) => ({
      def,
      quantity: collectionCardDefs.find((c) => c.def.id === def.id)?.quantity || 1,
    }))
  }, [collectionCardDefs, filters, sortBy, sortDirection, ownedCardIds])

  // Deck management
  const handleAddCard = (cardId: string) => setCurrentDeck((prev) => [...prev, cardId])
  const handleRemoveCard = (index: number) => setCurrentDeck((prev) => prev.filter((_, i) => i !== index))

  const handleSaveDeck = async () => {
    if (currentDeck.length === 0) return
    if (editingDeckId) {
      await updateCustomDeck(editingDeckId, { name: deckName, cardIds: currentDeck })
    } else {
      await saveCustomDeck({
        deckId: generateUid(),
        name: deckName,
        heroId: selectedHeroId,
        cardIds: currentDeck,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    const decks = await getCustomDecks()
    setCustomDecks(decks)
    setEditingDeckId(null)
  }

  const handleLoadDeck = (deck: CustomDeckRecord) => {
    setCurrentDeck(deck.cardIds)
    setDeckName(deck.name)
    setEditingDeckId(deck.deckId)
    setActiveTab('build')
  }

  const handleDeleteDeck = async (deckId: string) => {
    await deleteCustomDeck(deckId)
    const decks = await getCustomDecks()
    setCustomDecks(decks)
    if (editingDeckId === deckId) {
      setEditingDeckId(null)
      setCurrentDeck([])
      setDeckName('Custom Deck')
    }
  }

  const handleClearDeck = () => {
    setCurrentDeck([])
    setDeckName('Custom Deck')
    setEditingDeckId(null)
  }

  // Pack opening
  async function handleOpenPack() {
    setIsGenerating(true)
    setPackError(null)
    setRevealedCards([])
    try {
      const theme = getTheme(selectedTheme)
      const config: Partial<PackConfig> = {
        size: packSize,
        theme: theme?.hints[Math.floor(Math.random() * theme.hints.length)],
        guaranteedRare: packSize >= 5,
      }
      const cards = await generatePack(config)
      setPendingCards(cards)
      setShowGacha(true)
    } catch (err) {
      setPackError(err instanceof Error ? err.message : 'Pack generation failed')
      setIsGenerating(false)
    }
  }

  async function handleGachaComplete() {
    setShowGacha(false)
    setRevealedCards(pendingCards)
    for (const card of pendingCards) {
      await addToCollection(card.id, 1, 'pack')
    }
    const owned = await getCollection()
    setCollection(owned)
    setPendingCards([])
    setIsGenerating(false)
  }

  // Dev: seed content
  async function handleSeedContent() {
    setSeeding(true)
    const result = await seedBaseContent()
    setSeeding(false)
    setSeeded(result.enemies > 0 || result.dungeons > 0)
    alert(`Seeded: ${result.enemies} enemies, ${result.dungeons} dungeons`)
  }

  // Deck counts for display
  const deckCounts = currentDeck.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="MenuScreen h-screen flex flex-col">
      {/* Header with Title and Tabs */}
      <header className="menu-header">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="menu-title">Pandemonium</h1>
          <div className="flex gap-3">
            <span className="stat-badge">
              <Icon icon="mdi:counter" className="text-accent-ember" />
              Runs: {stats.totalRuns}
            </span>
            <span className="stat-badge">
              <Icon icon="mdi:trophy" className="text-gold" />
              Wins: {stats.totalWins}
            </span>
            <span className="stat-badge">
              <Icon icon="mdi:stairs" className="text-accent-warm" />
              Best: Floor {stats.bestFloor}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="menu-tabs">
          {([
            { id: 'play', icon: 'mdi:play-circle', label: 'Play' },
            { id: 'collection', icon: 'mdi:cards', label: `Collection (${collection.length})` },
            { id: 'build', icon: 'mdi:pencil', label: 'Build Deck' },
            { id: 'packs', icon: 'mdi:package-variant', label: 'Open Packs' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`menu-tab ${activeTab === tab.id ? 'menu-tab--active' : ''}`}
            >
              <Icon icon={tab.icon} className="inline mr-2 opacity-70" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {activeTab === 'play' && (
          <PlayTab
            availableHeroes={availableHeroes}
            selectedHeroId={selectedHeroId}
            setSelectedHeroId={setSelectedHeroId}
            customDecks={customDecks}
            selectedDeckId={selectedDeckId}
            setSelectedDeckId={setSelectedDeckId}
            dungeonDecks={dungeonDecks}
            selectedDungeonId={selectedDungeonId}
            setSelectedDungeonId={setSelectedDungeonId}
            deckValidation={deckValidation}
            onStartRun={onStartRun}
            onLoadDeck={handleLoadDeck}
            seeding={seeding}
            seeded={seeded}
            onSeedContent={handleSeedContent}
          />
        )}

        {activeTab === 'collection' && (
          <CollectionTab
            collection={collection}
            filteredCards={filteredCollectionCards}
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={(s, d) => { setSortBy(s); setSortDirection(d) }}
            collectionStatsCollapsed={collectionStatsCollapsed}
            setCollectionStatsCollapsed={setCollectionStatsCollapsed}
            onAddCard={handleAddCard}
            onViewCard={setSelectedCard}
          />
        )}

        {activeTab === 'build' && (
          <BuildTab
            currentDeck={currentDeck}
            deckName={deckName}
            setDeckName={setDeckName}
            editingDeckId={editingDeckId}
            deckCounts={deckCounts}
            customDecks={customDecks}
            filteredCards={filteredCollectionCards}
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={(s, d) => { setSortBy(s); setSortDirection(d) }}
            analyticsCollapsed={analyticsCollapsed}
            setAnalyticsCollapsed={setAnalyticsCollapsed}
            onAddCard={handleAddCard}
            onRemoveCard={handleRemoveCard}
            onSaveDeck={handleSaveDeck}
            onClearDeck={handleClearDeck}
            onLoadDeck={handleLoadDeck}
            onDeleteDeck={handleDeleteDeck}
            onViewCard={setSelectedCard}
          />
        )}

        {activeTab === 'packs' && (
          <PacksTab
            isGenerating={isGenerating}
            packError={packError}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
            packSize={packSize}
            setPackSize={setPackSize}
            revealedCards={revealedCards}
            showGacha={showGacha}
            pendingCards={pendingCards}
            onOpenPack={handleOpenPack}
            onGachaComplete={handleGachaComplete}
            onGachaSkip={handleGachaComplete}
          />
        )}
      </main>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          collectionData={
            collection.find((c) => c.cardId === selectedCard.id)
              ? {
                  quantity: collection.find((c) => c.cardId === selectedCard.id)!.quantity,
                  obtainedAt: collection.find((c) => c.cardId === selectedCard.id)!.obtainedAt,
                  source: collection.find((c) => c.cardId === selectedCard.id)!.source,
                }
              : undefined
          }
          onClose={() => setSelectedCard(null)}
          onAddToDeck={() => { handleAddCard(selectedCard.id); setActiveTab('build') }}
        />
      )}
    </div>
  )
}

// ============================================
// TAB COMPONENTS
// ============================================

function PlayTab({
  availableHeroes, selectedHeroId, setSelectedHeroId,
  customDecks, selectedDeckId, setSelectedDeckId,
  dungeonDecks, selectedDungeonId, setSelectedDungeonId,
  deckValidation, onStartRun, onLoadDeck,
  seeding, seeded, onSeedContent,
}: {
  availableHeroes: CardDefinition[]
  selectedHeroId: string
  setSelectedHeroId: (id: string) => void
  customDecks: CustomDeckRecord[]
  selectedDeckId: string | null
  setSelectedDeckId: (id: string | null) => void
  dungeonDecks: DungeonDeckDefinition[]
  selectedDungeonId: string | undefined
  setSelectedDungeonId: (id: string | undefined) => void
  deckValidation: { valid: boolean; missing: string[] }
  onStartRun: (deckId: string | null, heroId: string, dungeonDeckId?: string) => void
  onLoadDeck: (deck: CustomDeckRecord) => void
  seeding: boolean
  seeded: boolean
  onSeedContent: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Hero Selection */}
      {availableHeroes.length > 0 && (
        <div className="mb-8">
          <p className="section-header">Select Hero</p>
          <div className="flex gap-4 flex-wrap justify-center max-w-3xl">
            {availableHeroes.map((hero) => (
              <div
                key={hero.id}
                onClick={() => setSelectedHeroId(hero.id)}
                className="cursor-pointer transition-all duration-200 hover:opacity-100"
                style={selectedHeroId === hero.id ? {
                  filter: 'drop-shadow(0 0 12px rgba(255, 200, 100, 0.6))',
                  transform: 'scale(1.05)',
                } : {
                  opacity: 0.75,
                }}
              >
                <Card
                  variant="hand"
                  {...getCardDefProps(hero)}
                />
                {/* Hero stats below card */}
                {hero.heroStats && (
                  <div className="mt-2 text-center text-sm text-warm-400">
                    <span className="text-heal">{hero.heroStats.health} HP</span>
                    <span className="mx-2">·</span>
                    <span className="text-energy">{hero.heroStats.energy} Energy</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deck Selection */}
      <div className="mb-8">
        <p className="section-header">Select Deck</p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => setSelectedDeckId(null)}
            className={`selection-btn ${selectedDeckId === null ? 'selection-btn--selected' : ''}`}
          >
            <Icon icon="mdi:sword" className="text-xl opacity-70" />
            <span className="selection-btn__label">Starter Deck</span>
          </button>
          {customDecks.map((deck) => (
            <button
              key={deck.deckId}
              onClick={() => setSelectedDeckId(deck.deckId)}
              onDoubleClick={() => onLoadDeck(deck)}
              className={`selection-btn ${selectedDeckId === deck.deckId ? 'selection-btn--selected' : ''}`}
              title="Double-click to edit"
            >
              <Icon icon="mdi:cards" className="text-xl opacity-70" />
              <span className="selection-btn__label">{deck.name}</span>
              <span className="selection-btn__meta">{deck.cardIds.length} cards</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dungeon Selection */}
      {dungeonDecks.length > 0 && (
        <div className="mb-8">
          <p className="section-header">Select Dungeon</p>
          <div className="flex gap-3 flex-wrap justify-center max-w-3xl">
            <button
              onClick={() => setSelectedDungeonId(undefined)}
              className={`selection-btn ${selectedDungeonId === undefined ? 'selection-btn--selected' : ''}`}
            >
              <Icon icon="mdi:dice-multiple" className="text-xl opacity-70" />
              <span className="selection-btn__label">Random</span>
            </button>
            {dungeonDecks.map((dungeon) => (
              <button
                key={dungeon.id}
                onClick={() => setSelectedDungeonId(dungeon.id)}
                className={`selection-btn ${selectedDungeonId === dungeon.id ? 'selection-btn--selected' : ''}`}
              >
                <Icon icon="mdi:castle" className="text-xl opacity-70" />
                <span className="selection-btn__label">{dungeon.name}</span>
                <span className="selection-btn__meta">★{dungeon.difficulty}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {!deckValidation.valid && deckValidation.missing.length > 0 && (
        <div className="mb-6 p-4 bg-damage/20 border border-damage/50 rounded-lg text-damage text-sm max-w-md text-center">
          <Icon icon="mdi:alert" className="inline mr-2" />
          Deck contains {deckValidation.missing.length} card(s) not in your collection
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={() => onStartRun(selectedDeckId, selectedHeroId, selectedDungeonId)}
        disabled={!deckValidation.valid}
        className="action-btn-primary"
      >
        <Icon icon="mdi:play" className="inline mr-2 text-xl" />
        Begin Your Descent
      </button>

      {/* Dev: Seed Content */}
      {import.meta.env.DEV && (
        <button
          onClick={onSeedContent}
          disabled={seeding || seeded}
          className="mt-8 px-4 py-2 text-xs border border-border text-warm-500 rounded hover:border-accent-warm/50 hover:text-warm-400 disabled:opacity-50 font-display tracking-wide uppercase"
        >
          <Icon icon="mdi:database-plus" className="inline mr-1" />
          {seeding ? 'Generating...' : seeded ? 'Content Seeded' : 'Seed Base Content'}
        </button>
      )}
    </div>
  )
}

function CollectionTab({
  collection, filteredCards, filters, setFilters,
  sortBy, sortDirection, onSortChange,
  collectionStatsCollapsed, setCollectionStatsCollapsed,
  onAddCard, onViewCard,
}: {
  collection: CollectionCard[]
  filteredCards: { def: CardDefinition; quantity: number }[]
  filters: CardFilters
  setFilters: (f: CardFilters) => void
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (s: SortOption, d: SortDirection) => void
  collectionStatsCollapsed: boolean
  setCollectionStatsCollapsed: (c: boolean) => void
  onAddCard: (id: string) => void
  onViewCard: (card: CardDefinition) => void
}) {
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
              filteredCount={filteredCards.length}
            />
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <CardGrid cards={filteredCards} onAddCard={onAddCard} onViewCard={onViewCard} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BuildTab({
  currentDeck, deckName, setDeckName, editingDeckId, deckCounts,
  customDecks, filteredCards, filters, setFilters,
  sortBy, sortDirection, onSortChange,
  analyticsCollapsed, setAnalyticsCollapsed,
  onAddCard, onRemoveCard, onSaveDeck, onClearDeck, onLoadDeck, onDeleteDeck, onViewCard,
}: {
  currentDeck: string[]
  deckName: string
  setDeckName: (n: string) => void
  editingDeckId: string | null
  deckCounts: Record<string, number>
  customDecks: CustomDeckRecord[]
  filteredCards: { def: CardDefinition; quantity: number }[]
  filters: CardFilters
  setFilters: (f: CardFilters) => void
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (s: SortOption, d: SortDirection) => void
  analyticsCollapsed: boolean
  setAnalyticsCollapsed: (c: boolean) => void
  onAddCard: (id: string) => void
  onRemoveCard: (idx: number) => void
  onSaveDeck: () => void
  onClearDeck: () => void
  onLoadDeck: (deck: CustomDeckRecord) => void
  onDeleteDeck: (id: string) => void
  onViewCard: (card: CardDefinition) => void
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Deck Editor */}
      <aside className="w-72 bg-surface border-warm-800 flex flex-col">
        {/* Saved Decks */}
        <div className="p-4 border-b border-warm-800">
          <h3 className="text-xs uppercase tracking-wide text-warm-500 mb-2">Saved Decks</h3>
          <div className="space-y-1 max-h-32 overflow-auto">
            {customDecks.length === 0 ? (
              <p className="text-warm-600 text-sm">No saved decks</p>
            ) : (
              customDecks.map((deck) => (
                <div
                  key={deck.deckId}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                    editingDeckId === deck.deckId
                      ? 'bg-energy/20 text-energy'
                      : 'hover:bg-warm-800 text-warm-300'
                  }`}
                  onClick={() => onLoadDeck(deck)}
                >
                  <Icon icon="mdi:cards" />
                  <span className="flex-1 truncate">{deck.name}</span>
                  <span className="text-xs opacity-60">{deck.cardIds.length}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); void onDeleteDeck(deck.deckId) }}
                    className="p-1 text-warm-500 hover:text-damage"
                  >
                    <Icon icon="mdi:delete" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Deck */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wide text-warm-500">Current Deck</h3>
            <span className="text-xs text-warm-500">{currentDeck.length} cards</span>
          </div>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full px-3 py-2 bg-warm-800 border border-warm-700 rounded text-sm text-warm-200 mb-3"
            placeholder="Deck name"
          />
          <div className="space-y-1 mb-4">
            {Object.entries(deckCounts).map(([cardId, count]) => {
              const card = getCardDefinition(cardId)
              if (!card) return null
              return (
                <div key={cardId} className="flex items-center gap-2 p-2 bg-warm-800/50 rounded text-sm">
                  <span className="text-energy">{count}x</span>
                  <span className="flex-1 text-warm-300 truncate">{card.name}</span>
                  <button
                    onClick={() => {
                      const idx = currentDeck.indexOf(cardId)
                      if (idx >= 0) onRemoveCard(idx)
                    }}
                    className="p-1 text-warm-500 hover:text-damage"
                  >
                    <Icon icon="mdi:minus" />
                  </button>
                </div>
              )
            })}
          </div>
          <DeckAnalytics
            cardIds={currentDeck}
            collapsed={analyticsCollapsed}
            onToggleCollapsed={() => setAnalyticsCollapsed(!analyticsCollapsed)}
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-warm-800 space-y-2">
          <button
            onClick={() => void onSaveDeck()}
            disabled={currentDeck.length === 0}
            className="w-full px-4 py-2 bg-energy text-warm-900 font-medium rounded disabled:opacity-50"
          >
            <Icon icon="mdi:content-save" className="inline mr-2" />
            {editingDeckId ? 'Update Deck' : 'Save Deck'}
          </button>
          <button onClick={onClearDeck} className="w-full px-4 py-2 border border-warm-600 text-warm-400 rounded hover:text-white">
            <Icon icon="mdi:eraser" className="inline mr-2" />
            Clear
          </button>
        </div>
      </aside>

      {/* Card Pool */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4">
          <CardFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            totalCards={filteredCards.length}
            filteredCount={filteredCards.length}
          />
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <p className="text-xs text-warm-500 mb-4">Click to add to deck · Right-click to view details</p>
          <CardGrid cards={filteredCards} onAddCard={onAddCard} onViewCard={onViewCard} />
        </div>
      </div>
    </div>
  )
}

function PacksTab({
  isGenerating, packError, selectedTheme, setSelectedTheme,
  packSize, setPackSize, revealedCards,
  showGacha, pendingCards,
  onOpenPack, onGachaComplete, onGachaSkip,
}: {
  isGenerating: boolean
  packError: string | null
  selectedTheme: string
  setSelectedTheme: (t: string) => void
  packSize: number
  setPackSize: (s: number) => void
  revealedCards: CardDefinition[]
  showGacha: boolean
  pendingCards: CardDefinition[]
  onOpenPack: () => void
  onGachaComplete: () => void
  onGachaSkip: () => void
}) {
  return (
    <>
      {showGacha && pendingCards.length > 0 && (
        <GachaReveal cards={pendingCards} onComplete={onGachaComplete} onSkip={onGachaSkip} />
      )}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Pack Controls */}
        <div className="flex items-end gap-4 p-4 bg-warm-800/50 rounded-lg max-w-2xl mx-auto">
          <div className="flex-1">
            <label className="block text-xs text-warm-500 mb-1">Theme</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full px-3 py-2 bg-warm-800 border border-warm-700 rounded text-sm text-warm-200"
            >
              {THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} - {theme.description}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-warm-500 mb-1">Pack Size</label>
            <select
              value={packSize}
              onChange={(e) => setPackSize(Number(e.target.value))}
              className="w-full px-3 py-2 bg-warm-800 border border-warm-700 rounded text-sm text-warm-200"
            >
              <option value={3}>3 cards</option>
              <option value={6}>6 cards</option>
              <option value={10}>10 cards</option>
            </select>
          </div>
          <button
            onClick={onOpenPack}
            disabled={isGenerating}
            className="px-6 py-2 bg-energy text-warm-900 font-medium rounded disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-warm-900 border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Icon icon="mdi:package-variant" />
                Open Pack
              </>
            )}
          </button>
        </div>

        {packError && (
          <div className="p-4 bg-damage/20 border border-damage/50 rounded-lg text-damage max-w-2xl mx-auto">
            {packError}
          </div>
        )}

        {revealedCards.length > 0 && (
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
            <h3 className="text-sm font-medium text-warm-400 mb-4 flex items-center gap-2">
              <Icon icon="mdi:star" className="text-energy" />
              Pack Contents ({revealedCards.length} cards)
            </h3>
            <div className="grid gap-4 sm:gap-5 lg:gap-6" style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            }}>
              {revealedCards.map((card, idx) => {
                const glowColor = card.rarity === 'legendary' ? 'rgba(249,115,22,0.5)'
                  : card.rarity === 'rare' ? 'rgba(234,179,8,0.4)'
                  : card.rarity === 'uncommon' ? 'rgba(59,130,246,0.4)'
                  : 'rgba(156,163,175,0.3)'
                return (
                  <div key={`${card.id}-${idx}`} className="relative p-1">
                    <div
                      className="flex flex-col transition-all duration-300 ease-out
                                 hover:scale-105 hover:z-20 rounded-lg cursor-pointer"
                      style={{
                        transformOrigin: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 25px 5px ${glowColor}`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <Card {...getCardDefProps(card)} variant="hand" playable />
                      <div className="text-center mt-2">
                        <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                          card.rarity === 'legendary' ? 'text-orange-400 bg-orange-400/10'
                            : card.rarity === 'rare' ? 'text-yellow-400 bg-yellow-400/10'
                            : card.rarity === 'uncommon' ? 'text-blue-400 bg-blue-400/10'
                            : 'text-warm-400 bg-warm-700/50'
                        }`}>
                          {card.rarity}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {revealedCards.length === 0 && !isGenerating && (
          <div className="text-center text-warm-500 py-12">
            <Icon icon="mdi:package-variant-closed" className="text-6xl mb-4 opacity-30" />
            <p className="text-lg">Ready to open a pack?</p>
            <p className="text-sm mt-2">Choose a theme and click Open Pack to generate new cards!</p>
          </div>
        )}
      </div>
    </>
  )
}

// ============================================
// SHARED COMPONENTS
// ============================================

function CardGrid({
  cards,
  onAddCard,
  onViewCard,
}: {
  cards: { def: CardDefinition; quantity: number }[]
  onAddCard: (id: string) => void
  onViewCard: (card: CardDefinition) => void
}) {
  if (cards.length === 0) {
    return (
      <div className="text-center text-warm-500 py-12">
        <Icon icon="mdi:cards-outline" className="text-4xl mb-2 opacity-50" />
        <p>No cards found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
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
            className="group relative w-full transition-all duration-300 ease-out
                       hover:scale-105 hover:z-20
                       hover:shadow-[0_0_25px_5px_rgba(251,191,36,0.4)]
                       rounded-lg"
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

export default MenuScreen
