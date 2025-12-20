import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { MenuScreen } from './components/screens/MenuScreen'
import { loadGeneratedCardsIntoRegistry } from './game/card-generator'
import { useRunRecovery, formatRecoveryInfo } from './hooks/useRunRecovery'
import { restoreRunFromLocked } from './game/run-lock'
import type { RunState, RunRecoveryInfo } from './types'

// Lazy load heavy components - MenuScreen is now the unified hub
const GameScreen = lazy(() => import('./components/screens/GameScreen'))
const AmbientBackground = lazy(() => import('./components/AmbientBackground/AmbientBackground'))

function App() {
  const [ready, setReady] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game'>('menu')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedHeroId, setSelectedHeroId] = useState<string>('hero_ironclad')
  const [selectedDungeonId, setSelectedDungeonId] = useState<string | undefined>(undefined)
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([])
  const [restoredRunState, setRestoredRunState] = useState<RunState | null>(null)

  // Handle run recovery from browser close
  const handleResume = useCallback((info: RunRecoveryInfo) => {
    const restored = restoreRunFromLocked()
    if (restored) {
      setRestoredRunState(restored)
      setSelectedHeroId(info.heroId ?? 'hero_ironclad')
      setSelectedDungeonId(info.dungeonDeckId)
      setCurrentScreen('game')
    }
  }, [])

  const handleAbandonRecovery = useCallback(() => {
    // User chose not to resume, stay on menu
    setCurrentScreen('menu')
  }, [])

  const { state: recoveryState, actions: recoveryActions } = useRunRecovery({
    onResume: handleResume,
    onAbandon: handleAbandonRecovery,
    autoCheck: ready, // Only check after app is ready
  })

  useEffect(() => {
    void loadGeneratedCardsIntoRegistry()
      .then((count) => {
        if (count > 0) console.log(`Loaded ${count} generated cards into registry`)
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return null

  const handleStartRun = (deckId: string | null, heroId: string, dungeonDeckId?: string, modifierIds?: string[]) => {
    setSelectedDeckId(deckId)
    setSelectedHeroId(heroId)
    setSelectedDungeonId(dungeonDeckId)
    setSelectedModifierIds(modifierIds ?? [])
    setCurrentScreen('game')
  }

  const handleReturnToMenu = () => {
    setSelectedDeckId(null)
    setSelectedHeroId('hero_ironclad')
    setSelectedDungeonId(undefined)
    setSelectedModifierIds([])
    setRestoredRunState(null)
    setCurrentScreen('menu')
  }

  // Render content based on current screen
  const renderScreen = () => {
    if (currentScreen === 'game') {
      return (
        <GameScreen
          deckId={selectedDeckId}
          heroId={selectedHeroId}
          dungeonDeckId={selectedDungeonId}
          selectedModifierIds={selectedModifierIds}
          initialState={restoredRunState}
          onReturnToMenu={handleReturnToMenu}
        />
      )
    }
    return <MenuScreen onStartRun={handleStartRun} />
  }

  // Format recovery info for display
  const recoveryDisplay = recoveryState.recoveryInfo
    ? formatRecoveryInfo(recoveryState.recoveryInfo)
    : null

  return (
    <>
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>
      <Suspense fallback={<div className="min-h-screen" />}>
        {renderScreen()}
      </Suspense>

      {/* Run Recovery Modal */}
      {recoveryState.showRecoveryPrompt && recoveryDisplay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="mx-4 w-full max-w-md rounded-lg border border-amber-500/30 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-2 text-xl font-bold text-amber-400">{recoveryDisplay.title}</h2>
            <p className="mb-1 text-lg text-white">{recoveryDisplay.subtitle}</p>
            <p className="mb-1 text-sm text-gray-400">{recoveryDisplay.progress}</p>
            <p className="mb-6 text-xs text-gray-500">{recoveryDisplay.timeAgo}</p>

            <div className="flex gap-3">
              <button
                onClick={recoveryActions.resumeRun}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-amber-500"
              >
                Continue Run
              </button>
              <button
                onClick={recoveryActions.abandonRecovery}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2 font-semibold text-gray-300 transition-colors hover:bg-gray-600"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
