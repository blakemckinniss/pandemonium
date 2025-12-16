import { lazy, Suspense, useEffect, useState } from 'react'
import { MenuScreen } from './components/screens/MenuScreen'
import { loadGeneratedCardsIntoRegistry } from './game/card-generator'

// Lazy load heavy components - MenuScreen is now the unified hub
const GameScreen = lazy(() => import('./components/screens/GameScreen'))
const AmbientBackground = lazy(() => import('./components/AmbientBackground/AmbientBackground'))

function App() {
  const [ready, setReady] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game'>('menu')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedHeroId, setSelectedHeroId] = useState<string>('hero_ironclad')
  const [selectedDungeonId, setSelectedDungeonId] = useState<string | undefined>(undefined)

  useEffect(() => {
    void loadGeneratedCardsIntoRegistry()
      .then((count) => {
        if (count > 0) console.log(`Loaded ${count} generated cards into registry`)
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return null

  const handleStartRun = (deckId: string | null, heroId: string, dungeonDeckId?: string) => {
    setSelectedDeckId(deckId)
    setSelectedHeroId(heroId)
    setSelectedDungeonId(dungeonDeckId)
    setCurrentScreen('game')
  }

  const handleReturnToMenu = () => {
    setSelectedDeckId(null)
    setSelectedHeroId('hero_ironclad')
    setSelectedDungeonId(undefined)
    setCurrentScreen('menu')
  }

  // Render content based on current screen
  const renderScreen = () => {
    if (currentScreen === 'game') {
      return <GameScreen deckId={selectedDeckId} heroId={selectedHeroId} dungeonDeckId={selectedDungeonId} onReturnToMenu={handleReturnToMenu} />
    }
    return <MenuScreen onStartRun={handleStartRun} />
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
