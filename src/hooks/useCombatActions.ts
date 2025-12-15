import { useCallback } from 'react'
import type { RunState, CombatState } from '../types'
import { applyAction } from '../game/actions'
import { getCardDefinition } from '../game/cards'

interface CombatActionsConfig {
  combat: CombatState | null
  isAnimating: boolean
  setState: React.Dispatch<React.SetStateAction<RunState | null>>
  animateDiscardHand: (onComplete: () => void) => void
}

export interface CombatActions {
  handleDragPlayCard: (cardUid: string, targetId: string | null) => void
  handleClickPlayCard: (cardUid: string) => void
  handleEndTurn: () => void
  handleUseActivated: () => void
  handleUseUltimate: () => void
}

export function useCombatActions({
  combat,
  isAnimating,
  setState,
  animateDiscardHand,
}: CombatActionsConfig): CombatActions {
  const handleDragPlayCard = useCallback(
    (cardUid: string, targetId: string | null) => {
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, { type: 'playCard', cardUid, targetId: targetId ?? undefined })
      })
    },
    [setState]
  )

  const handleClickPlayCard = useCallback(
    (cardUid: string) => {
      if (!combat) return

      const card = combat.hand.find((c) => c.uid === cardUid)
      if (!card) return

      const def = getCardDefinition(card.definitionId)
      if (!def) return

      // Only auto-play cards that don't need a target
      if (def.target === 'self' || def.target === 'allEnemies') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, { type: 'playCard', cardUid })
        })
      }
    },
    [combat, setState]
  )

  const handleEndTurn = useCallback(() => {
    if (!combat || isAnimating) return

    const processEndTurn = () => {
      setState((prev) => {
        if (!prev?.combat) return prev
        return applyAction(prev, { type: 'endTurn' })
      })

      // Enemy turn after short delay
      setTimeout(() => {
        setState((prev) => {
          if (!prev?.combat) return prev

          let newState = prev
          for (const enemy of prev.combat.enemies) {
            newState = applyAction(newState, { type: 'enemyAction', enemyId: enemy.id })
          }

          newState = applyAction(newState, { type: 'startTurn' })
          return newState
        })
      }, 600)
    }

    animateDiscardHand(processEndTurn)
  }, [combat, isAnimating, setState, animateDiscardHand])

  const handleUseActivated = useCallback(() => {
    if (!combat || isAnimating) return
    setState((prev) => {
      if (!prev) return prev
      return applyAction(prev, { type: 'useActivatedAbility' })
    })
  }, [combat, isAnimating, setState])

  const handleUseUltimate = useCallback(() => {
    if (!combat || isAnimating) return
    setState((prev) => {
      if (!prev) return prev
      return applyAction(prev, { type: 'useUltimateAbility' })
    })
  }, [combat, isAnimating, setState])

  return {
    handleDragPlayCard,
    handleClickPlayCard,
    handleEndTurn,
    handleUseActivated,
    handleUseUltimate,
  }
}
