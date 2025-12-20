import { useCallback } from 'react'
import type { RunState } from '../types'
import { applyAction } from '../game/actions'
import { createNewRun, createEnemiesFromRoom } from '../game/new-game'
import { getRoomDefinition } from '../content/rooms'
import { selectRoom as selectLockedRoom, completeRoom as completeLockedRoom, drawRoomChoices as drawLockedRoomChoices } from '../game/run-lock'
import { useRunLockStore } from '../stores/runLockStore'

interface RoomHandlersConfig {
  setState: React.Dispatch<React.SetStateAction<RunState | null>>
  setCurrentRoomId: React.Dispatch<React.SetStateAction<string | null>>
  setPendingUnlocks: React.Dispatch<React.SetStateAction<string[]>>
  prevHealthRef: React.MutableRefObject<Record<string, number>>
  runStartRef: React.MutableRefObject<Date>
  runRecordedRef: React.MutableRefObject<boolean>
  lastTurnRef: React.MutableRefObject<number>
  resetVisuals: () => void
  onReturnToMenu?: () => void
}

export interface RoomCompleteParams {
  roomUid: string
  goldEarned?: number
  enemiesKilled?: number
  cardsPlayed?: number
  damageDealt?: number
  damageTaken?: number
}

export interface RoomHandlers {
  handleSelectRoom: (roomUid: string) => void
  handleRoomComplete: (params: RoomCompleteParams) => void
  handleRestart: () => Promise<void>
  handleUnlocksDismissed: () => void
}

export function useRoomHandlers({
  setState,
  setCurrentRoomId,
  setPendingUnlocks,
  prevHealthRef,
  runStartRef,
  runRecordedRef,
  lastTurnRef,
  resetVisuals,
  onReturnToMenu,
}: RoomHandlersConfig): RoomHandlers {
  const handleSelectRoom = useCallback((roomUid: string) => {
    // Update run-lock store if active run exists
    const hasActiveRun = useRunLockStore.getState().hasActiveRun()
    if (hasActiveRun) {
      const result = selectLockedRoom(roomUid)
      if (!result.success) {
        console.warn('[RoomHandlers] Failed to select room in lock store:', result.error)
      }
    }

    setState((prev) => {
      if (!prev) return prev

      const room = prev.roomChoices.find((r) => r.uid === roomUid)
      if (!room) return prev

      setCurrentRoomId(room.definitionId)

      // Store the room UID for tracking completion
      const updatedState = { ...prev, currentRoomUid: roomUid }

      const roomDef = getRoomDefinition(room.definitionId)

      // Handle campfire rooms
      if (roomDef?.type === 'campfire') {
        return {
          ...updatedState,
          gamePhase: 'campfire',
          roomChoices: [],
        }
      }

      // Handle treasure rooms
      if (roomDef?.type === 'treasure') {
        return {
          ...updatedState,
          gamePhase: 'treasure',
          roomChoices: [],
        }
      }

      // Handle shop rooms
      if (roomDef?.type === 'shop') {
        return {
          ...updatedState,
          gamePhase: 'shop',
          roomChoices: [],
        }
      }

      // Handle event rooms
      if (roomDef?.type === 'event') {
        return {
          ...updatedState,
          gamePhase: 'event',
          roomChoices: [],
        }
      }

      // Get active modifiers and heat for enemy stat scaling
      const runLockState = useRunLockStore.getState()
      const activeModifiers = runLockState.lockedRun?.activeModifiers ?? []
      const heatLevel = runLockState.heat?.current ?? 0

      // Create enemies from room (use override enemyCardIds if provided by seeded dungeon)
      const enemies = createEnemiesFromRoom(room.definitionId, room.enemyCardIds, activeModifiers, heatLevel)

      // Start combat
      let newState = applyAction(
        { ...updatedState, roomChoices: [] },
        { type: 'startCombat', enemies }
      )
      newState = applyAction(newState, { type: 'startTurn' })

      // Reset tracking refs for new combat
      prevHealthRef.current = {}
      lastTurnRef.current = 0

      return newState
    })
  }, [setState, setCurrentRoomId, prevHealthRef, lastTurnRef])

  // Called after completing a room (combat victory, campfire rest, treasure claimed)
  const handleRoomComplete = useCallback((params: RoomCompleteParams) => {
    const hasActiveRun = useRunLockStore.getState().hasActiveRun()
    if (hasActiveRun) {
      // Mark room complete in lock store
      const result = completeLockedRoom(params)
      if (!result.success) {
        console.warn('[RoomHandlers] Failed to complete room in lock store:', result.error)
        return
      }

      // Draw new room choices for next floor
      const drawResult = drawLockedRoomChoices()
      if (drawResult.success && drawResult.choices) {
        // Update game state with new choices
        setState((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            roomChoices: drawResult.choices!,
            floor: prev.floor + 1,
            gamePhase: 'roomSelect',
          }
        })
      }
    }
  }, [setState])

  const handleRestart = useCallback(async () => {
    if (onReturnToMenu) {
      onReturnToMenu()
    } else {
      prevHealthRef.current = {}
      runStartRef.current = new Date()
      runRecordedRef.current = false
      resetVisuals()
      setPendingUnlocks([])
      setCurrentRoomId(null)
      setState(await createNewRun('hero_ironclad'))
    }
  }, [onReturnToMenu, prevHealthRef, runStartRef, runRecordedRef, resetVisuals, setPendingUnlocks, setCurrentRoomId, setState])

  const handleUnlocksDismissed = useCallback(() => {
    setPendingUnlocks([])
  }, [setPendingUnlocks])

  return {
    handleSelectRoom,
    handleRoomComplete,
    handleRestart,
    handleUnlocksDismissed,
  }
}
