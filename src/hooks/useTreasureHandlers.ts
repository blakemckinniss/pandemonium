import { useCallback } from 'react'
import type { RunState } from '../types'
import { drawRoomChoices } from '../game/dungeon-deck'
import { generateUid } from '../lib/utils'
import type { RoomCompleteParams } from './useRoomHandlers'

type SetState = (fn: (prev: RunState | null) => RunState | null) => void

export interface TreasureHandlersConfig {
  setState: SetState
  getCurrentRoomUid: () => string | undefined
  onRoomComplete?: (params: RoomCompleteParams) => void
}

export interface TreasureHandlers {
  handleTreasureSelectRelic: (relicId: string) => void
  handleTreasureSkip: () => void
}

export function useTreasureHandlers({
  setState,
  getCurrentRoomUid,
  onRoomComplete,
}: TreasureHandlersConfig): TreasureHandlers {
  const advanceFromTreasure = useCallback(() => {
    const roomUid = getCurrentRoomUid()

    // If run-lock is active, let it handle room transition
    if (onRoomComplete && roomUid) {
      onRoomComplete({ roomUid })
      return
    }

    // Fallback: Draw new room choices directly
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
  }, [setState, getCurrentRoomUid, onRoomComplete])

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
