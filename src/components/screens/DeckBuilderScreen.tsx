import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Card } from '../Card/Card'
import { getCardDefinition, getAllCards } from '../../game/cards'
import { getEnergyCost } from '../../lib/effects'
import { generateRandomCard, type GenerationOptions } from '../../game/card-generator'
import {
  getCustomDecks,
  saveCustomDeck,
  updateCustomDeck,
  deleteCustomDeck,
  getAllGeneratedCards,
  type CustomDeckRecord,
  type GeneratedCardRecord,
} from '../../stores/db'
import { useMetaStore } from '../../stores/metaStore'
import { generateUid } from '../../lib/utils'
import type { CardDefinition, CardTheme } from '../../types'

type Tab = 'unlocked' | 'generated' | 'dev'

interface DeckBuilderScreenProps {
  onBack: () => void
}

export function DeckBuilderScreen({ onBack }: DeckBuilderScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('unlocked')
  const [currentDeck, setCurrentDeck] = useState<string[]>([])
  const [deckName, setDeckName] = useState('Custom Deck')
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [savedDecks, setSavedDecks] = useState<CustomDeckRecord[]>([])
  const [generatedCards, setGeneratedCards] = useState<GeneratedCardRecord[]>([])
  const { unlockedCards } = useMetaStore()

  // Load data on mount
  useEffect(() => {
    getCustomDecks().then(setSavedDecks)
    getAllGeneratedCards().then(setGeneratedCards)
  }, [])

  // Get card definitions for unlocked cards
  const unlockedCardDefs = unlockedCards
    .map((id) => getCardDefinition(id))
    .filter((c): c is CardDefinition => c !== undefined)

  // Get all cards for full pool
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
  const handleDeleteDeck = async (deckId: string) => {
    await deleteCustomDeck(deckId)
    const decks = await getCustomDecks()
    setSavedDecks(decks)
    if (editingDeckId === deckId) {
      setEditingDeckId(null)
      setCurrentDeck([])
      setDeckName('Custom Deck')
    }
  }

  // Clear current deck
  const handleClearDeck = () => {
    setCurrentDeck([])
    setDeckName('Custom Deck')
    setEditingDeckId(null)
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
            onClick={handleSaveDeck}
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
          {(['unlocked', 'generated', 'dev'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-energy border-b-2 border-energy'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'unlocked' && <Icon icon="mdi:lock-open" className="inline mr-2" />}
              {tab === 'generated' && <Icon icon="mdi:auto-fix" className="inline mr-2" />}
              {tab === 'dev' && <Icon icon="mdi:flask" className="inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'unlocked' && (
            <CardGrid
              cards={unlockedCardDefs.length > 0 ? unlockedCardDefs : allCards}
              onAddCard={handleAddCard}
            />
          )}
          {activeTab === 'generated' && (
            <GeneratedCardsGrid records={generatedCards} onAddCard={handleAddCard} />
          )}
          {activeTab === 'dev' && (
            <DevModePanel
              onCardGenerated={(card) => {
                getAllGeneratedCards().then(setGeneratedCards)
                handleAddCard(card.id)
              }}
            />
          )}
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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onAddCard(card.id)}
          className="group transition-transform hover:scale-105"
        >
          <Card
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

function GeneratedCardsGrid({
  records,
  onAddCard,
}: {
  records: GeneratedCardRecord[]
  onAddCard: (id: string) => void
}) {
  if (records.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Icon icon="mdi:auto-fix" className="text-4xl mb-2 opacity-50" />
        <p>No generated cards yet</p>
        <p className="text-sm">Use Dev Mode to generate cards with AI</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {records.map((record) => (
        <button
          key={record.cardId}
          onClick={() => onAddCard(record.cardId)}
          className="group transition-transform hover:scale-105"
        >
          <Card
            variant="hand"
            theme={record.definition.theme}
            name={record.definition.name}
            description={record.definition.description}
            energy={getEnergyCost(record.definition.energy)}
            playable
          />
        </button>
      ))}
    </div>
  )
}

function DevModePanel({ onCardGenerated }: { onCardGenerated: (card: CardDefinition) => void }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<GenerationOptions>({})
  const [previewCard, setPreviewCard] = useState<CardDefinition | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    try {
      const card = await generateRandomCard(options)
      setPreviewCard(card)
      onCardGenerated(card)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex gap-8">
      {/* Generation Controls */}
      <div className="w-64 space-y-4">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Icon icon="mdi:flask" className="text-energy" />
          AI Card Generator
        </h3>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Theme</label>
          <select
            value={options.theme || ''}
            onChange={(e) =>
              setOptions({ ...options, theme: (e.target.value as CardTheme) || undefined })
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200"
          >
            <option value="">Any Theme</option>
            <option value="attack">Attack</option>
            <option value="skill">Skill</option>
            <option value="power">Power</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Rarity</label>
          <select
            value={options.rarity || ''}
            onChange={(e) =>
              setOptions({
                ...options,
                rarity: (e.target.value as 'common' | 'uncommon' | 'rare') || undefined,
              })
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200"
          >
            <option value="">Any Rarity</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Theme Hint</label>
          <input
            type="text"
            value={options.hint || ''}
            onChange={(e) => setOptions({ ...options, hint: e.target.value || undefined })}
            placeholder="e.g., fire magic, poison, defense"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full px-4 py-3 bg-energy text-gray-900 font-medium rounded disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <Icon icon="mdi:auto-fix" />
              Generate Card
            </>
          )}
        </button>

        {error && <p className="text-damage text-sm">{error}</p>}
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-start justify-center">
        {previewCard ? (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Last Generated (added to deck)</p>
            <div className="transform scale-125 origin-top">
              <Card
                variant="hand"
                theme={previewCard.theme}
                name={previewCard.name}
                description={previewCard.description}
                energy={getEnergyCost(previewCard.energy)}
                playable
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600 py-12">
            <Icon icon="mdi:card-plus" className="text-6xl mb-4 opacity-30" />
            <p>Generate a card to preview</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeckBuilderScreen
