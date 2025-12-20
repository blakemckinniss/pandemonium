import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { MenuScreen } from './components/screens/MenuScreen'
import { loadGeneratedCardsIntoRegistry } from './game/card-generator'
import { useRunRecovery, formatRecoveryInfo } from './hooks/useRunRecovery'
import { restoreRunFromLocked } from './game/run-lock'
import { primeCache } from './game/card-cache'
import { checkServiceHealth } from './lib/image-gen'
import type { RunState, RunRecoveryInfo } from './types'

// Lazy load heavy components - MenuScreen is now the unified hub
const GameScreen = lazy(() => import('./components/screens/GameScreen'))
const AmbientBackground = lazy(() => import('./components/AmbientBackground/AmbientBackground'))

function App() {
  const [ready, setReady] = useState(false)
  const [imageServiceReady, setImageServiceReady] = useState(false)
  const [imageServiceChecking, setImageServiceChecking] = useState(true)
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game'>('menu')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedHeroId, setSelectedHeroId] = useState<string>('hero_ironclad')
  const [selectedDungeonId, setSelectedDungeonId] = useState<string | undefined>(undefined)
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([])
  const [restoredRunState, setRestoredRunState] = useState<RunState | null>(null)

  // Check image-gen service health - REQUIRED for gameplay
  useEffect(() => {
    let cancelled = false
    let retryTimeout: ReturnType<typeof setTimeout>

    async function checkService() {
      setImageServiceChecking(true)
      const healthy = await checkServiceHealth()
      if (cancelled) return

      setImageServiceReady(healthy)
      setImageServiceChecking(false)

      // If not healthy, retry every 3 seconds
      if (!healthy) {
        retryTimeout = setTimeout(checkService, 3000)
      }
    }

    void checkService()

    return () => {
      cancelled = true
      clearTimeout(retryTimeout)
    }
  }, [])

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

  // Block gameplay until image-gen service is available
  if (!imageServiceReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-void-900 via-void-950 to-black flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-md">
          <h1 className="text-4xl font-display text-energy mb-4">✧ Pandemonium ✧</h1>
          <div className="mb-8">
            {imageServiceChecking ? (
              <>
                <div className="animate-spin w-8 h-8 border-2 border-energy border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-warm-300">Connecting to AI services...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-damage/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-display text-damage mb-2">Image Service Required</h2>
                <p className="text-warm-400 mb-6">
                  Pandemonium requires the AI image generation service to create card art.
                </p>
                <div className="bg-surface/50 rounded-lg p-4 text-left mb-6">
                  <p className="text-warm-300 text-sm mb-2">Start the service:</p>
                  <code className="text-energy text-xs block bg-black/30 p-2 rounded font-mono">
                    cd services/image-gen && python server.py
                  </code>
                  <p className="text-warm-500 text-xs mt-2">
                    Requires ComfyUI running on port 8188
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-warm-500">
                  <div className="animate-spin w-4 h-4 border-2 border-warm-500 border-t-transparent rounded-full" />
                  <span className="text-sm">Retrying connection...</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleStartRun = (deckId: string | null, heroId: string, dungeonDeckId?: string, modifierIds?: string[]) => {
    // Prime the AI card cache for instant rewards
    primeCache()

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
