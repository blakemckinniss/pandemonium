import { useCallback } from 'react'
import type { RunState } from '../types'
import { applyAction } from '../game/actions'
import { createNewRun, createEnemiesFromRoom } from '../game/new-game'
import { getRoomDefinition } from '../content/rooms'

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

export interface RoomHandlers {
  handleSelectRoom: (roomUid: string) => void
  handleRestart: () => void
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
    setState((prev) => {
      if (!prev) return prev

      const room = prev.roomChoices.find((r) => r.uid === roomUid)
      if (!room) return prev

      setCurrentRoomId(room.definitionId)

      const roomDef = getRoomDefinition(room.definitionId)

      // Handle campfire rooms
      if (roomDef?.type === 'campfire') {
        return {
          ...prev,
          gamePhase: 'campfire',
          roomChoices: [],
        }
      }

      // Handle treasure rooms
      if (roomDef?.type === 'treasure') {
        return {
          ...prev,
          gamePhase: 'treasure',
          roomChoices: [],
        }
      }

      // Create enemies from room
      const enemies = createEnemiesFromRoom(room.definitionId)

      // Start combat
      let newState = applyAction(
        { ...prev, roomChoices: [] },
        { type: 'startCombat', enemies }
      )
      newState = applyAction(newState, { type: 'startTurn' })

      // Reset tracking refs for new combat
      prevHealthRef.current = {}
      lastTurnRef.current = 0

      return newState
    })
  }, [setState, setCurrentRoomId, prevHealthRef, lastTurnRef])

  const handleRestart = useCallback(() => {
    if (onReturnToMenu) {
      onReturnToMenu()
    } else {
      prevHealthRef.current = {}
      runStartRef.current = new Date()
      runRecordedRef.current = false
      resetVisuals()
      setPendingUnlocks([])
      setCurrentRoomId(null)
      setState(createNewRun('warrior'))
    }
  }, [onReturnToMenu, prevHealthRef, runStartRef, runRecordedRef, resetVisuals, setPendingUnlocks, setCurrentRoomId, setState])

  const handleUnlocksDismissed = useCallback(() => {
    setPendingUnlocks([])
  }, [setPendingUnlocks])

  return {
    handleSelectRoom,
    handleRestart,
    handleUnlocksDismissed,
  }
}
