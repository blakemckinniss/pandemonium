import { useEffect, useState } from 'react'
import type { AppScreen } from './types'
import { GameScreen } from './components/screens/GameScreen'
import { MenuScreen } from './components/screens/MenuScreen'
import { DeckBuilderScreen } from './components/screens/DeckBuilderScreen'
import { loadGeneratedCardsIntoRegistry } from './game/card-generator'

function App() {
  const [ready, setReady] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)

  useEffect(() => {
    loadGeneratedCardsIntoRegistry()
      .then((count) => {
        if (count > 0) console.log(`Loaded ${count} generated cards into registry`)
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return null

  const handleStartRun = (deckId: string | null) => {
    setSelectedDeckId(deckId)
    setCurrentScreen('game')
  }

  const handleReturnToMenu = () => {
    setSelectedDeckId(null)
    setCurrentScreen('menu')
  }

  switch (currentScreen) {
    case 'menu':
      return (
        <MenuScreen
          onStartRun={handleStartRun}
          onDeckBuilder={() => setCurrentScreen('deckBuilder')}
        />
      )
    case 'deckBuilder':
      return <DeckBuilderScreen onBack={() => setCurrentScreen('menu')} />
    case 'game':
      return <GameScreen deckId={selectedDeckId} onReturnToMenu={handleReturnToMenu} />
  }
}

export default App
