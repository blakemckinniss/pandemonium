import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Card } from '../Card/Card'
import { getCardDefinition, getAllCards, getStarterCardIds } from '../../game/cards'
import { getEnergyCost } from '../../lib/effects'
import { generatePack, type PackConfig } from '../../game/card-generator'
import {
  getCustomDecks,
  saveCustomDeck,
  updateCustomDeck,
  deleteCustomDeck,
  getAllGeneratedCards,
  getCollection,
  addToCollection,
  initializeStarterCollection,
  type CustomDeckRecord,
  type GeneratedCardRecord,
  type CollectionCard,
} from '../../stores/db'
import { generateUid } from '../../lib/utils'
import { THEMES, getTheme } from '../../config/themes'
import type { CardDefinition } from '../../types'

type Tab = 'collection' | 'packs' | 'all'

interface DeckBuilderScreenProps {
  onBack: () => void
}

export function DeckBuilderScreen({ onBack }: DeckBuilderScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('collection')
  const [currentDeck, setCurrentDeck] = useState<string[]>([])
  const [deckName, setDeckName] = useState('Custom Deck')
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [savedDecks, setSavedDecks] = useState<CustomDeckRecord[]>([])
  const [_generatedCards, setGeneratedCards] = useState<GeneratedCardRecord[]>([])
  const [collection, setCollection] = useState<CollectionCard[]>([])

  // Load data on mount
  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    // Initialize starter collection if needed
    await initializeStarterCollection(getStarterCardIds())

    const [decks, cards, owned] = await Promise.all([
      getCustomDecks(),
      getAllGeneratedCards(),
      getCollection(),
    ])
    setSavedDecks(decks)
    setGeneratedCards(cards)
    setCollection(owned)
  }

  // Get card definitions for collection (owned cards)
  const collectionCardDefs = collection
    .map((c) => {
      const def = getCardDefinition(c.cardId)
      return def ? { def, quantity: c.quantity } : null
    })
    .filter((c): c is { def: CardDefinition; quantity: number } => c !== null)

  // Get all cards (starters + generated)
  const allCards = getAllCards()

  // Add card to current deck
  const handleAddCard = (cardId: string) => {
    setCurrentDeck((prev) => [...prev, cardId])
  }

  // Remove card from current deck by index
  const handleRemoveCard = (index: number) => {
    setCurrentDeck((prev) => prev.filter((_, i) => i !== index))
  }

  // Save current deck
  const handleSaveDeck = async () => {
    if (currentDeck.length === 0) return

    if (editingDeckId) {
      await updateCustomDeck(editingDeckId, { name: deckName, cardIds: currentDeck })
    } else {
      await saveCustomDeck({
        deckId: generateUid(),
        name: deckName,
        heroId: 'warrior',
        cardIds: currentDeck,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Refresh list
    const decks = await getCustomDecks()
    setSavedDecks(decks)
    setEditingDeckId(null)
  }

  // Load a saved deck for editing
  const handleLoadDeck = (deck: CustomDeckRecord) => {
    setCurrentDeck(deck.cardIds)
    setDeckName(deck.name)
    setEditingDeckId(deck.deckId)
  }

  // Delete a saved deck
  const handleDeleteDeck = (deckId: string) => {
    void (async () => {
      await deleteCustomDeck(deckId)
      const decks = await getCustomDecks()
      setSavedDecks(decks)
      if (editingDeckId === deckId) {
        setEditingDeckId(null)
        setCurrentDeck([])
        setDeckName('Custom Deck')
      }
    })()
  }

  // Clear current deck
  const handleClearDeck = () => {
    setCurrentDeck([])
    setDeckName('Custom Deck')
    setEditingDeckId(null)
  }

  // Handle new cards from pack opening
  const handleCardsObtained = async (cards: CardDefinition[]) => {
    for (const card of cards) {
      await addToCollection(card.id, 1, 'pack')
    }
    // Refresh collection and generated cards
    const [owned, generated] = await Promise.all([getCollection(), getAllGeneratedCards()])
    setCollection(owned)
    setGeneratedCards(generated)
  }

  // Group current deck cards by ID for display
  const deckCounts = currentDeck.reduce(
    (acc, id) => {
      acc[id] = (acc[id] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="DeckBuilderScreen h-screen flex bg-gray-950">
      {/* Left Sidebar - Saved Decks & Current Deck */}
      <aside className="w-72 bg-surface border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="text-xl" />
          </button>
          <h2 className="text-lg font-bold text-gray-200">Deck Builder</h2>
        </div>

        {/* Saved Decks */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Saved Decks</h3>
          <div className="space-y-1">
            {savedDecks.length === 0 ? (
              <p className="text-gray-600 text-sm">No saved decks</p>
            ) : (
              savedDecks.map((deck) => (
                <div
                  key={deck.deckId}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                    editingDeckId === deck.deckId
                      ? 'bg-energy/20 text-energy'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                  onClick={() => handleLoadDeck(deck)}
                >
                  <Icon icon="mdi:cards" />
                  <span className="flex-1 truncate">{deck.name}</span>
                  <span className="text-xs opacity-60">{deck.cardIds.length}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteDeck(deck.deckId)
                    }}
                    className="p-1 text-gray-500 hover:text-damage"
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
            <h3 className="text-xs uppercase tracking-wide text-gray-500">Current Deck</h3>
            <span className="text-xs text-gray-500">{currentDeck.length} cards</span>
          </div>

          {/* Deck Name Input */}
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 mb-3"
            placeholder="Deck name"
          />

          {/* Card List */}
          <div className="space-y-1 mb-4">
            {Object.entries(deckCounts).map(([cardId, count]) => {
              const card = getCardDefinition(cardId)
              if (!card) return null
              return (
                <div
                  key={cardId}
                  className="flex items-center gap-2 p-2 bg-gray-800/50 rounded text-sm"
                >
                  <span className="text-energy">{count}x</span>
                  <span className="flex-1 text-gray-300 truncate">{card.name}</span>
                  <button
                    onClick={() => {
                      const idx = currentDeck.indexOf(cardId)
                      if (idx >= 0) handleRemoveCard(idx)
                    }}
                    className="p-1 text-gray-500 hover:text-damage"
                  >
                    <Icon icon="mdi:minus" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={() => void handleSaveDeck()}
            disabled={currentDeck.length === 0}
            className="w-full px-4 py-2 bg-energy text-gray-900 font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:content-save" className="inline mr-2" />
            {editingDeckId ? 'Update Deck' : 'Save Deck'}
          </button>
          <button
            onClick={handleClearDeck}
            className="w-full px-4 py-2 border border-gray-600 text-gray-400 rounded hover:text-white hover:border-gray-500"
          >
            <Icon icon="mdi:eraser" className="inline mr-2" />
            Clear
          </button>
        </div>
      </aside>

      {/* Main Area - Card Pool */}
      <main className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['collection', 'packs', 'all'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-energy border-b-2 border-energy'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'collection' && <Icon icon="mdi:cards" className="inline mr-2" />}
              {tab === 'packs' && <Icon icon="mdi:package-variant" className="inline mr-2" />}
              {tab === 'all' && <Icon icon="mdi:view-grid" className="inline mr-2" />}
              {tab === 'collection' && `Collection (${collection.length})`}
              {tab === 'packs' && 'Open Packs'}
              {tab === 'all' && 'All Cards'}
            </button>
          ))}
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'collection' && (
            <CollectionGrid cards={collectionCardDefs} onAddCard={handleAddCard} />
          )}
          {activeTab === 'packs' && <PackOpeningPanel onCardsObtained={handleCardsObtained} />}
          {activeTab === 'all' && <CardGrid cards={allCards} onAddCard={handleAddCard} />}
        </div>
      </main>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CardGrid({
  cards,
  onAddCard,
}: {
  cards: CardDefinition[]
  onAddCard: (id: string) => void
}) {
  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Icon icon="mdi:cards-outline" className="text-4xl mb-2 opacity-50" />
        <p>No cards available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onAddCard(card.id)}
          className="group transition-transform hover:scale-105"
        >
          <Card
            cardId={card.id}
            variant="hand"
            theme={card.theme}
            name={card.name}
            description={card.description}
            energy={getEnergyCost(card.energy)}
            playable
          />
        </button>
      ))}
    </div>
  )
}

function CollectionGrid({
  cards,
  onAddCard,
}: {
  cards: { def: CardDefinition; quantity: number }[]
  onAddCard: (id: string) => void
}) {
  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Icon icon="mdi:cards-outline" className="text-4xl mb-2 opacity-50" />
        <p>Your collection is empty</p>
        <p className="text-sm mt-2">Open some packs to get cards!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map(({ def, quantity }) => (
        <button
          key={def.id}
          onClick={() => onAddCard(def.id)}
          className="group transition-transform hover:scale-105 relative"
        >
          <Card
            cardId={def.id}
            variant="hand"
            theme={def.theme}
            name={def.name}
            description={def.description}
            energy={getEnergyCost(def.energy)}
            playable
          />
          {quantity > 1 && (
            <span className="absolute top-2 right-2 bg-energy text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
              x{quantity}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function PackOpeningPanel({
  onCardsObtained,
}: {
  onCardsObtained: (cards: CardDefinition[]) => Promise<void>
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string>('standard')
  const [packSize, setPackSize] = useState(6)
  const [revealedCards, setRevealedCards] = useState<CardDefinition[]>([])
  const [_isRevealing, setIsRevealing] = useState(false)

  async function handleOpenPack() {
    setIsGenerating(true)
    setError(null)
    setRevealedCards([])

    try {
      const theme = getTheme(selectedTheme)
      const config: Partial<PackConfig> = {
        size: packSize,
        theme: theme?.hints[Math.floor(Math.random() * theme.hints.length)],
        guaranteedRare: packSize >= 5,
      }

      const cards = await generatePack(config)

      // Reveal cards one by one
      setIsRevealing(true)
      for (let i = 0; i < cards.length; i++) {
        await new Promise((r) => setTimeout(r, 300))
        setRevealedCards((prev) => [...prev, cards[i]])
      }
      setIsRevealing(false)

      // Add to collection
      await onCardsObtained(cards)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pack generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pack Controls */}
      <div className="flex items-end gap-4 p-4 bg-gray-800/50 rounded-lg">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Theme</label>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200"
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name} - {theme.description}
              </option>
            ))}
          </select>
        </div>

        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">Pack Size</label>
          <select
            value={packSize}
            onChange={(e) => setPackSize(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200"
          >
            <option value={3}>3 cards</option>
            <option value={6}>6 cards</option>
            <option value={10}>10 cards</option>
          </select>
        </div>

        <button
          onClick={() => void handleOpenPack()}
          disabled={isGenerating}
          className="px-6 py-2 bg-energy text-gray-900 font-medium rounded disabled:opacity-50 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full" />
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

      {error && (
        <div className="p-4 bg-damage/20 border border-damage/50 rounded-lg text-damage">
          {error}
        </div>
      )}

      {/* Revealed Cards */}
      {revealedCards.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Icon icon="mdi:star" className="text-energy" />
            Pack Contents ({revealedCards.length} cards)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {revealedCards.map((card, idx) => (
              <div
                key={`${card.id}-${idx}`}
                className="transform transition-all duration-300"
                style={{
                  animation: 'fadeInUp 0.3s ease-out',
                  animationFillMode: 'backwards',
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                <Card
                  cardId={card.id}
                  variant="hand"
                  theme={card.theme}
                  name={card.name}
                  description={card.description}
                  energy={getEnergyCost(card.energy)}
                  playable
                />
                <div className="text-center mt-1">
                  <span
                    className={`text-xs font-medium ${
                      card.rarity === 'rare'
                        ? 'text-yellow-400'
                        : card.rarity === 'uncommon'
                          ? 'text-blue-400'
                          : 'text-gray-400'
                    }`}
                  >
                    {card.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {revealedCards.length === 0 && !isGenerating && (
        <div className="text-center text-gray-500 py-12">
          <Icon icon="mdi:package-variant-closed" className="text-6xl mb-4 opacity-30" />
          <p className="text-lg">Ready to open a pack?</p>
          <p className="text-sm mt-2">Choose a theme and click Open Pack to generate new cards!</p>
        </div>
      )}
    </div>
  )
}

export default DeckBuilderScreen
