import { useCallback } from 'react'
import type { RunState } from '../types'
import { createCardInstance } from '../game/actions'
import { drawRoomChoices } from '../game/dungeon-deck'
import { generateUid } from '../lib/utils'

type SetState = (fn: (prev: RunState | null) => RunState | null) => void

export interface RewardHandlers {
  handleAddCard: (cardId: string) => void
  handleSkipReward: () => void
  handleAddRelic: (relicId: string) => void
}

export function useRewardHandlers(setState: SetState): RewardHandlers {
  const handleAddCard = useCallback((cardId: string) => {
    setState((prev) => {
      if (!prev) return prev

      const newCard = createCardInstance(cardId)
      const goldReward = 15 + Math.floor(Math.random() * 10)

      // Draw new room choices
      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      // Check if dungeon complete (no more rooms)
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
  }, [setState])

  const handleSkipReward = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev

      const goldReward = 15 + Math.floor(Math.random() * 10)
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
  }, [setState])

  const handleAddRelic = useCallback((relicId: string) => {
    setState((prev) => {
      if (!prev) return prev

      const goldReward = 15 + Math.floor(Math.random() * 10)
      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      const newRelic = { id: generateUid(), definitionId: relicId }

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
  }, [setState])

  return {
    handleAddCard,
    handleSkipReward,
    handleAddRelic,
  }
}
