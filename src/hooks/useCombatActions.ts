import { useCallback, useRef } from 'react'
import type { RunState, CombatState, VisualEvent } from '../types'
import { applyAction } from '../game/actions'
import { getCardDefinition } from '../game/cards'

// Timing constants for enemy turn animations (ms)
const TELEGRAPH_DURATION = 350  // How long enemy winds up (snappier)
const ACTION_DELAY = 200        // Delay after action before next enemy
const INITIAL_DELAY = 300       // Initial delay before first enemy acts

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
  const enemyTurnInProgressRef = useRef(false)
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
    if (!combat || isAnimating || enemyTurnInProgressRef.current) return

    // Capture enemy IDs at the start of the turn (before any state changes)
    const enemyIds = combat.enemies.map(e => e.id)

    const processEndTurn = () => {
      setState((prev) => {
        if (!prev?.combat) return prev
        return applyAction(prev, { type: 'endTurn' })
      })

      // Process enemies sequentially with animations
      enemyTurnInProgressRef.current = true

      const processEnemy = (index: number) => {
        // All enemies processed - start player turn
        if (index >= enemyIds.length) {
          enemyTurnInProgressRef.current = false
          setState((prev) => {
            if (!prev?.combat) return prev
            return applyAction(prev, { type: 'startTurn' })
          })
          return
        }

        const enemyId = enemyIds[index]

        // Step 1: Emit telegraph visual
        setState((currentState) => {
          if (!currentState?.combat) return currentState

          // Check if enemy still exists
          const enemy = currentState.combat.enemies.find(e => e.id === enemyId)
          if (!enemy) {
            // Enemy died, skip to next
            setTimeout(() => processEnemy(index + 1), 50)
            return currentState
          }

          const intentType = enemy.intent?.type ?? 'attack'
          const telegraphEvent: VisualEvent = {
            type: 'enemyTelegraph',
            enemyId: enemy.id,
            intentType: intentType as 'attack' | 'defend' | 'buff' | 'debuff',
            intentValue: enemy.intent?.value,
          }

          return applyAction(currentState, { type: 'emitVisual', event: telegraphEvent })
        })

        // Step 2: After telegraph, execute attack
        setTimeout(() => {
          setState((afterTelegraph) => {
            if (!afterTelegraph?.combat) return afterTelegraph

            // Check if enemy still exists
            const enemy = afterTelegraph.combat.enemies.find(e => e.id === enemyId)
            if (!enemy) {
              // Enemy died during telegraph, skip to next
              setTimeout(() => processEnemy(index + 1), 50)
              return afterTelegraph
            }

            // Emit action execute visual with intent type
            const intentType = enemy.intent?.type ?? 'attack'
            const executeEvent: VisualEvent = {
              type: 'enemyActionExecute',
              enemyId: enemy.id,
              intentType: intentType as 'attack' | 'defend' | 'buff' | 'debuff',
            }
            let newState = applyAction(afterTelegraph, { type: 'emitVisual', event: executeEvent })

            // Execute the actual enemy action
            newState = applyAction(newState, { type: 'enemyAction', enemyId: enemy.id })

            return newState
          })

          // Step 3: After action delay, process next enemy
          setTimeout(() => processEnemy(index + 1), ACTION_DELAY)
        }, TELEGRAPH_DURATION)
      }

      // Start processing enemies after initial delay
      setTimeout(() => processEnemy(0), INITIAL_DELAY)
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
