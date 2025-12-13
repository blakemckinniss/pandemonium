import { useEffect, useState } from 'react'
import { GameScreen } from './components/screens/GameScreen'
import { loadGeneratedCardsIntoRegistry } from './game/card-generator'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadGeneratedCardsIntoRegistry()
      .then((count) => {
        if (count > 0) console.log(`Loaded ${count} generated cards into registry`)
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return null

  return <GameScreen />
}

export default App
