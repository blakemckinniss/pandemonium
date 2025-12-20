import { useCallback } from 'react'
import type { RunState } from '../types'
import { createCardInstance } from '../game/actions'
import { drawRoomChoices } from '../game/dungeon-deck'
import { generateUid } from '../lib/utils'
import type { RoomCompleteParams } from './useRoomHandlers'

type SetState = (fn: (prev: RunState | null) => RunState | null) => void

export interface RewardHandlersConfig {
  setState: SetState
  getCurrentRoomUid: () => string | undefined
  onRoomComplete?: (params: RoomCompleteParams) => void
  goldMultiplier?: number
}

export interface RewardHandlers {
  handleAddCard: (cardId: string) => void
  handleSkipReward: () => void
  handleAddRelic: (relicId: string) => void
}

export function useRewardHandlers({
  setState,
  getCurrentRoomUid,
  onRoomComplete,
  goldMultiplier = 1,
}: RewardHandlersConfig): RewardHandlers {
  const handleAddCard = useCallback((cardId: string) => {
    const roomUid = getCurrentRoomUid()
    const goldReward = Math.floor((15 + Math.floor(Math.random() * 10)) * goldMultiplier)

    setState((prev) => {
      if (!prev) return prev

      const newCard = createCardInstance(cardId)

      // If run-lock is active, let it handle room transition
      if (onRoomComplete && roomUid) {
        return {
          ...prev,
          deck: [...prev.deck, newCard],
          gold: prev.gold + goldReward,
        }
      }

      // Fallback: Draw new room choices directly
      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      if (choices.length === 0) {
        return {
          ...prev,
          gamePhase: 'gameOver' as const,
          deck: [...prev.deck, newCard],
          gold: prev.gold + goldReward,
          floor: prev.floor + 1,
        }
      }

      return {
        ...prev,
        gamePhase: 'roomSelect',
        deck: [...prev.deck, newCard],
        gold: prev.gold + goldReward,
        dungeonDeck: remaining,
        roomChoices: choices,
        floor: prev.floor + 1,
      }
    })

    // Trigger room completion via run-lock if available
    if (onRoomComplete && roomUid) {
      onRoomComplete({ roomUid, goldEarned: goldReward })
    }
  }, [setState, getCurrentRoomUid, onRoomComplete, goldMultiplier])

  const handleSkipReward = useCallback(() => {
    const roomUid = getCurrentRoomUid()
    const goldReward = Math.floor((15 + Math.floor(Math.random() * 10)) * goldMultiplier)

    setState((prev) => {
      if (!prev) return prev

      // If run-lock is active, let it handle room transition
      if (onRoomComplete && roomUid) {
        return {
          ...prev,
          gold: prev.gold + goldReward,
        }
      }

      // Fallback: Draw new room choices directly
      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      if (choices.length === 0) {
        return {
          ...prev,
          gamePhase: 'gameOver' as const,
          gold: prev.gold + goldReward,
          floor: prev.floor + 1,
        }
      }

      return {
        ...prev,
        gamePhase: 'roomSelect',
        gold: prev.gold + goldReward,
        dungeonDeck: remaining,
        roomChoices: choices,
        floor: prev.floor + 1,
      }
    })

    // Trigger room completion via run-lock if available
    if (onRoomComplete && roomUid) {
      onRoomComplete({ roomUid, goldEarned: goldReward })
    }
  }, [setState, getCurrentRoomUid, onRoomComplete, goldMultiplier])

  const handleAddRelic = useCallback((relicId: string) => {
    const roomUid = getCurrentRoomUid()
    const goldReward = Math.floor((15 + Math.floor(Math.random() * 10)) * goldMultiplier)

    setState((prev) => {
      if (!prev) return prev

      const newRelic = { id: generateUid(), definitionId: relicId }

      // If run-lock is active, let it handle room transition
      if (onRoomComplete && roomUid) {
        return {
          ...prev,
          relics: [...prev.relics, newRelic],
          gold: prev.gold + goldReward,
        }
      }

      // Fallback: Draw new room choices directly
      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      if (choices.length === 0) {
        return {
          ...prev,
          gamePhase: 'gameOver' as const,
          relics: [...prev.relics, newRelic],
          gold: prev.gold + goldReward,
          floor: prev.floor + 1,
        }
      }

      return {
        ...prev,
        gamePhase: 'roomSelect',
        relics: [...prev.relics, newRelic],
        gold: prev.gold + goldReward,
        dungeonDeck: remaining,
        roomChoices: choices,
        floor: prev.floor + 1,
      }
    })

    // Trigger room completion via run-lock if available
    if (onRoomComplete && roomUid) {
      onRoomComplete({ roomUid, goldEarned: goldReward })
    }
  }, [setState, getCurrentRoomUid, onRoomComplete, goldMultiplier])

  return {
    handleAddCard,
    handleSkipReward,
    handleAddRelic,
  }
}
