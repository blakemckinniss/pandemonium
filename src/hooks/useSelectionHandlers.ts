import { useCallback } from 'react'
import type { RunState, PendingSelection } from '../types'
import { applyAction } from '../game/actions'

type SetState = (fn: (prev: RunState | null) => RunState | null) => void

export interface SelectionHandlers {
  handleSelectionConfirm: (selectedUids: string[], discardedUids?: string[]) => void
  handleSelectionClose: () => void
}

export function useSelectionHandlers(
  setState: SetState,
  pendingSelection: PendingSelection | undefined
): SelectionHandlers {
  const handleSelectionConfirm = useCallback(
    (selectedUids: string[], discardedUids?: string[]) => {
      if (!pendingSelection) return

      if (pendingSelection.type === 'scry') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveScry',
            keptUids: selectedUids,
            discardedUids: discardedUids ?? [],
          })
        })
      } else if (pendingSelection.type === 'tutor') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveTutor',
            selectedUids,
          })
        })
      } else if (pendingSelection.type === 'discover') {
        // For discover, selectedUids are actually card definition IDs
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveDiscover',
            selectedCardIds: selectedUids,
          })
        })
      } else if (pendingSelection.type === 'banish') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveBanish',
            selectedUids,
          })
        })
      }
    },
    [setState, pendingSelection]
  )

  const handleSelectionClose = useCallback(() => {
    // For now, closing without selection = empty selection
    if (!pendingSelection) return

    if (pendingSelection.type === 'scry') {
      // Put all cards back on top in original order
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveScry',
          keptUids: pendingSelection.cards.map((c) => c.uid),
          discardedUids: [],
        })
      })
    } else if (pendingSelection.type === 'tutor') {
      // Skip tutor selection
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveTutor',
          selectedUids: [],
        })
      })
    } else if (pendingSelection.type === 'discover') {
      // Skip discover selection (add nothing)
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveDiscover',
          selectedCardIds: [],
        })
      })
    } else if (pendingSelection.type === 'banish') {
      // Skip banish selection (banish nothing)
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveBanish',
          selectedUids: [],
        })
      })
    }
  }, [setState, pendingSelection])

  return {
    handleSelectionConfirm,
    handleSelectionClose,
  }
}
