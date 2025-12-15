import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  getCustomDecks,
  getRunStats,
  getCollection,
  initializeStarterCollection,
  getAllDungeonDecks,
  type CustomDeckRecord,
  type CollectionCard,
} from '../../stores/db'
import type { DungeonDeckDefinition } from '../../types'
import { getStarterCardIds, getStarterHeroId, getAllHeroes, getCardDefinition } from '../../game/cards'
import { seedBaseContent, isContentSeeded } from '../../game/seed-content'
import type { CardDefinition } from '../../types'

interface MenuScreenProps {
  onStartRun: (deckId: string | null, heroId: string, dungeonDeckId?: string) => void
  onDeckBuilder: () => void
}

export function MenuScreen({ onStartRun, onDeckBuilder }: MenuScreenProps) {
  const [customDecks, setCustomDecks] = useState<CustomDeckRecord[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedHeroId, setSelectedHeroId] = useState<string>(getStarterHeroId())
  const [stats, setStats] = useState({ totalRuns: 0, totalWins: 0, bestFloor: 0 })
  const [collection, setCollection] = useState<CollectionCard[]>([])
  const [availableHeroes, setAvailableHeroes] = useState<CardDefinition[]>([])
  const [deckValidation, setDeckValidation] = useState<{ valid: boolean; missing: string[] }>({
    valid: true,
    missing: [],
  })
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [dungeonDecks, setDungeonDecks] = useState<DungeonDeckDefinition[]>([])
  const [selectedDungeonId, setSelectedDungeonId] = useState<string | undefined>(undefined)

  // Load custom decks, stats, collection, and heroes on mount
  useEffect(() => {
    async function loadData() {
      // Initialize starter collection if needed
      await initializeStarterCollection(getStarterCardIds())

      const [decks, runStats, owned] = await Promise.all([
        getCustomDecks(),
        getRunStats(),
        getCollection(),
      ])
      setCustomDecks(decks)
      setStats({ totalRuns: runStats.totalRuns, totalWins: runStats.totalWins, bestFloor: runStats.bestFloor })
      setCollection(owned)

      // Load available heroes - all hero cards from registry
      // Filter to owned heroes or include starter hero
      const allHeroes = getAllHeroes()
      const ownedCardIds = new Set(owned.map((c) => c.cardId))
      const starterHeroId = getStarterHeroId()

      // Include starter hero + any owned hero cards
      const heroes = allHeroes.filter(
        (h) => h.id === starterHeroId || ownedCardIds.has(h.id)
      )

      // Always ensure starter hero is available (even if not in registry yet)
      const starterHero = getCardDefinition(starterHeroId)
      const finalHeroes = starterHero && !heroes.find((h) => h.id === starterHeroId)
        ? [starterHero, ...heroes]
        : heroes

      setAvailableHeroes(finalHeroes)

      // Check if content already seeded
      const contentSeeded = await isContentSeeded()
      setSeeded(contentSeeded)

      // Load available dungeon decks
      const dungeons = await getAllDungeonDecks()
      setDungeonDecks(dungeons)
    }
    void loadData()
  }, [])

  // Validate selected deck against collection
  useEffect(() => {
    if (!selectedDeckId) {
      // Starter deck always valid (uses hardcoded starters)
      setDeckValidation({ valid: true, missing: [] })
      return
    }

    const deck = customDecks.find((d) => d.deckId === selectedDeckId)
    if (!deck) {
      setDeckValidation({ valid: false, missing: [] })
      return
    }

    // Check each card in deck is owned
    const ownedCardIds = new Set(collection.map((c) => c.cardId))
    const missing = deck.cardIds.filter((cardId) => !ownedCardIds.has(cardId))
    const uniqueMissing = [...new Set(missing)]

    setDeckValidation({
      valid: uniqueMissing.length === 0,
      missing: uniqueMissing,
    })
  }, [selectedDeckId, customDecks, collection])

  // Dev: seed base content
  async function handleSeedContent() {
    setSeeding(true)
    const result = await seedBaseContent()
    setSeeding(false)
    setSeeded(result.enemies > 0 || result.dungeons > 0)
    alert(`Seeded: ${result.enemies} enemies, ${result.dungeons} dungeons${result.errors.length ? `\nErrors: ${result.errors.join(', ')}` : ''}`)
  }

  return (
    <div className="MenuScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Title */}
      <h1 className="text-6xl font-bold mb-2 text-energy tracking-wider">PANDEMONIUM</h1>
      <p className="text-gray-500 mb-8">A Roguelike Deckbuilder</p>

      {/* Hero Selection */}
      {availableHeroes.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-400 mb-3 text-sm uppercase tracking-wide">Select Hero</p>
          <div className="flex gap-3 flex-wrap justify-center max-w-2xl">
            {availableHeroes.map((hero) => (
              <button
                key={hero.id}
                onClick={() => setSelectedHeroId(hero.id)}
                className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center min-w-[120px] ${
                  selectedHeroId === hero.id
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <Icon icon="mdi:shield-account" className="text-2xl mb-1" />
                <span className="font-medium">{hero.name}</span>
                {hero.heroStats && (
                  <span className="text-xs opacity-60 mt-1">
                    {hero.heroStats.health} HP · {hero.heroStats.energy} Energy
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Deck Selection */}
      <div className="mb-8">
        <p className="text-gray-400 mb-3 text-sm uppercase tracking-wide">Select Deck</p>
        <div className="flex gap-3">
          {/* Starter Deck */}
          <button
            onClick={() => setSelectedDeckId(null)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              selectedDeckId === null
                ? 'border-energy bg-energy/20 text-energy'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
          >
            <Icon icon="mdi:sword" className="inline mr-2" />
            Starter Deck
          </button>

          {/* Custom Decks */}
          {customDecks.map((deck) => (
            <button
              key={deck.deckId}
              onClick={() => setSelectedDeckId(deck.deckId)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedDeckId === deck.deckId
                  ? 'border-energy bg-energy/20 text-energy'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Icon icon="mdi:cards" className="inline mr-2" />
              {deck.name}
              <span className="ml-2 text-xs opacity-60">({deck.cardIds.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dungeon Selection */}
      {dungeonDecks.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-400 mb-3 text-sm uppercase tracking-wide">Select Dungeon</p>
          <div className="flex gap-3 flex-wrap justify-center max-w-2xl">
            {/* Random Dungeon (default) */}
            <button
              onClick={() => setSelectedDungeonId(undefined)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedDungeonId === undefined
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Icon icon="mdi:dice-multiple" className="inline mr-2" />
              Random
            </button>
            {dungeonDecks.map((dungeon) => (
              <button
                key={dungeon.id}
                onClick={() => setSelectedDungeonId(dungeon.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedDungeonId === dungeon.id
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <Icon icon="mdi:castle" className="inline mr-2" />
                {dungeon.name}
                <span className="ml-2 text-xs opacity-60">★{dungeon.difficulty}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {!deckValidation.valid && deckValidation.missing.length > 0 && (
        <div className="mb-4 p-3 bg-damage/20 border border-damage/50 rounded-lg text-damage text-sm max-w-md text-center">
          <Icon icon="mdi:alert" className="inline mr-2" />
          Deck contains {deckValidation.missing.length} card(s) not in your collection
        </div>
      )}

      {/* Primary Actions */}
      <div className="flex flex-col gap-3 mb-12">
        <button
          onClick={() => onStartRun(selectedDeckId, selectedHeroId, selectedDungeonId)}
          disabled={!deckValidation.valid}
          className={`px-8 py-3 font-bold rounded-lg transition-colors text-lg ${
            deckValidation.valid
              ? 'bg-energy text-gray-900 hover:bg-energy/90'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Icon icon="mdi:play" className="inline mr-2 text-xl" />
          Start Run
        </button>

        <button
          onClick={onDeckBuilder}
          className="px-8 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
        >
          <Icon icon="mdi:cards-outline" className="inline mr-2" />
          Deck Builder
        </button>
      </div>

      {/* Stats */}
      <div className="text-gray-500 text-sm flex gap-6">
        <span>
          <Icon icon="mdi:counter" className="inline mr-1" />
          Runs: {stats.totalRuns}
        </span>
        <span>
          <Icon icon="mdi:trophy" className="inline mr-1" />
          Wins: {stats.totalWins}
        </span>
        <span>
          <Icon icon="mdi:stairs" className="inline mr-1" />
          Best: Floor {stats.bestFloor}
        </span>
      </div>

      {/* Dev: Seed Content (only in dev mode) */}
      {import.meta.env.DEV && (
        <button
          onClick={handleSeedContent}
          disabled={seeding || seeded}
          className="mt-6 px-4 py-2 text-xs border border-gray-700 text-gray-500 rounded hover:border-gray-600 hover:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:database-plus" className="inline mr-1" />
          {seeding ? 'Generating...' : seeded ? 'Content Seeded' : 'Seed Base Content'}
        </button>
      )}
    </div>
  )
}

export default MenuScreen
