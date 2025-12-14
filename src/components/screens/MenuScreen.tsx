import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { getCustomDecks, getRunStats, type CustomDeckRecord } from '../../stores/db'

interface MenuScreenProps {
  onStartRun: (deckId: string | null) => void
  onDeckBuilder: () => void
}

export function MenuScreen({ onStartRun, onDeckBuilder }: MenuScreenProps) {
  const [customDecks, setCustomDecks] = useState<CustomDeckRecord[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalRuns: 0, totalWins: 0, bestFloor: 0 })

  // Load custom decks and stats on mount
  useEffect(() => {
    void getCustomDecks().then(setCustomDecks)
    void getRunStats().then((s) =>
      setStats({ totalRuns: s.totalRuns, totalWins: s.totalWins, bestFloor: s.bestFloor })
    )
  }, [])

  return (
    <div className="MenuScreen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Title */}
      <h1 className="text-6xl font-bold mb-2 text-energy tracking-wider">PANDEMONIUM</h1>
      <p className="text-gray-500 mb-12">A Roguelike Deckbuilder</p>

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

      {/* Primary Actions */}
      <div className="flex flex-col gap-3 mb-12">
        <button
          onClick={() => onStartRun(selectedDeckId)}
          className="px-8 py-3 bg-energy text-gray-900 font-bold rounded-lg hover:bg-energy/90 transition-colors text-lg"
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
    </div>
  )
}

export default MenuScreen
