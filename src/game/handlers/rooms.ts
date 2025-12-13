// Room and dungeon handlers
import type { RunState } from '../../types'

export function handleSelectRoom(draft: RunState, roomUid: string): void {
  const room = draft.roomChoices.find((r) => r.uid === roomUid)
  if (!room) return

  draft.roomChoices = []
  draft.gamePhase = 'combat'
}

export function handleDealRoomChoices(draft: RunState): void {
  const choices: typeof draft.roomChoices = []

  for (let i = 0; i < 3 && draft.dungeonDeck.length > 0; i++) {
    const room = draft.dungeonDeck.pop()
    if (room) {
      room.revealed = true
      choices.push(room)
    }
  }

  draft.roomChoices = choices
  draft.gamePhase = 'roomSelect'
}
