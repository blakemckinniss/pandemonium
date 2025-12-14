import { useCallback } from 'react'
import type { RunState } from '../types'
import { drawRoomChoices } from '../game/dungeon-deck'
import { generateUid } from '../lib/utils'

type SetState = (fn: (prev: RunState | null) => RunState | null) => void

export interface TreasureHandlers {
  handleTreasureSelectRelic: (relicId: string) => void
  handleTreasureSkip: () => void
}

export function useTreasureHandlers(setState: SetState): TreasureHandlers {
  const advanceFromTreasure = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev

      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      if (choices.length === 0) {
        return { ...prev, gamePhase: 'gameOver' as const, floor: prev.floor + 1 }
      }

      return {
        ...prev,
        gamePhase: 'roomSelect',
        dungeonDeck: remaining,
        roomChoices: choices,
        floor: prev.floor + 1,
      }
    })
  }, [setState])

  const handleTreasureSelectRelic = useCallback((relicId: string) => {
    setState((prev) => {
      if (!prev) return prev
      const newRelic = { id: generateUid(), definitionId: relicId }
      return {
        ...prev,
        relics: [...prev.relics, newRelic],
      }
    })
    advanceFromTreasure()
  }, [setState, advanceFromTreasure])

  const handleTreasureSkip = useCallback(() => {
    advanceFromTreasure()
  }, [advanceFromTreasure])

  return {
    handleTreasureSelectRelic,
    handleTreasureSkip,
  }
}
