import { lazy, Suspense, useEffect, useState } from 'react'
import type { AppScreen } from './types'
import { MenuScreen } from './components/screens/MenuScreen'
import { loadGeneratedCardsIntoRegistry } from './game/card-generator'

// Lazy load heavy components - only MenuScreen needed at startup
const GameScreen = lazy(() => import('./components/screens/GameScreen'))
const DeckBuilderScreen = lazy(() => import('./components/screens/DeckBuilderScreen'))
const AmbientBackground = lazy(() => import('./components/AmbientBackground/AmbientBackground'))

function App() {
  const [ready, setReady] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)

  useEffect(() => {
    void loadGeneratedCardsIntoRegistry()
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

  // Render content based on current screen
  const renderScreen = () => {
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

  return (
    <>
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>
      <Suspense fallback={<div className="min-h-screen" />}>
        {renderScreen()}
      </Suspense>
    </>
  )
}

export default App
