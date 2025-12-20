import { useCallback } from 'react'
import type { RunState } from '../types'
import { drawRoomChoices } from '../game/dungeon-deck'
import type { RoomCompleteParams } from './useRoomHandlers'

type SetState = (fn: (prev: RunState | null) => RunState | null) => void

export interface CampfireHandlersConfig {
  setState: SetState
  getCurrentRoomUid: () => string | undefined
  onRoomComplete?: (params: RoomCompleteParams) => void
}

export interface CampfireHandlers {
  handleCampfireRest: () => void
  handleCampfireSmith: (cardUid: string) => void
  handleCampfireSkip: () => void
}

export function useCampfireHandlers({
  setState,
  getCurrentRoomUid,
  onRoomComplete,
}: CampfireHandlersConfig): CampfireHandlers {
  const advanceFromCampfire = useCallback(() => {
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

  const handleCampfireRest = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      const healAmount = Math.floor(prev.hero.maxHealth * 0.3)
      return {
        ...prev,
        hero: {
          ...prev.hero,
          currentHealth: Math.min(prev.hero.maxHealth, prev.hero.currentHealth + healAmount),
        },
      }
    })
    advanceFromCampfire()
  }, [setState, advanceFromCampfire])

  const handleCampfireSmith = useCallback((cardUid: string) => {
    setState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        deck: prev.deck.map(card =>
          card.uid === cardUid ? { ...card, upgraded: true } : card
        ),
      }
    })
    advanceFromCampfire()
  }, [setState, advanceFromCampfire])

  const handleCampfireSkip = useCallback(() => {
    advanceFromCampfire()
  }, [advanceFromCampfire])

  return {
    handleCampfireRest,
    handleCampfireSmith,
    handleCampfireSkip,
  }
}
