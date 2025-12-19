import { useState, useCallback, useEffect, useRef } from 'react'
import type { CombatState, CombatNumber, Element as GameElement, RunState, VisualEvent } from '../types'
import type { PendingCardAnimation } from '../components/Hand/CardAnimationOverlay'
import type { CardPosition } from '../components/Hand/Hand'
import { applyAction } from '../game/actions'
import { generateUid } from '../lib/utils'
import { processVisualEvent as processEvent, effects } from './visualEventHandlers'
import type { HandlerContext } from './visualEventHandlers'

interface VisualEventProcessorConfig {
  combat: CombatState | null
  queryContainer: (selector: string) => Element | null
  queryHand: (selector: string) => NodeListOf<Element> | null
  containerRef: React.RefObject<HTMLDivElement | null>
  setState: React.Dispatch<React.SetStateAction<RunState | null>>
  setTriggeredRelicId: React.Dispatch<React.SetStateAction<string | null>>
}

export interface VisualEventProcessor {
  combatNumbers: CombatNumber[]
  pendingAnimations: PendingCardAnimation[]
  removeCombatNumber: (id: string) => void
  handleAnimationComplete: (id: string) => void
  handleCardPositionsUpdate: (positions: Map<string, CardPosition>) => void
  lastTurnRef: React.MutableRefObject<number>
  resetVisuals: () => void
}

export function useVisualEventProcessor({
  combat,
  queryContainer,
  queryHand,
  containerRef,
  setState,
  setTriggeredRelicId,
}: VisualEventProcessorConfig): VisualEventProcessor {
  const [combatNumbers, setCombatNumbers] = useState<CombatNumber[]>([])
  const [pendingAnimations, setPendingAnimations] = useState<PendingCardAnimation[]>([])
  const cardPositionsRef = useRef<Map<string, CardPosition>>(new Map())
  const lastTurnRef = useRef<number>(0)

  const spawnCombatNumber = useCallback(
    (
      targetId: string,
      value: number,
      type: 'damage' | 'heal' | 'block' | 'combo',
      options?: {
        element?: GameElement
        variant?: 'poison' | 'piercing' | 'combo' | 'chain' | 'execute'
        comboName?: string
      }
    ) => {
      const targetEl = queryContainer(
        `[data-target="${targetId}"], [data-target-type="${targetId}"]`
      )

      let x = window.innerWidth / 2
      let y = window.innerHeight / 2

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect()
        x = rect.left + rect.width / 2
        y = rect.top + rect.height / 3
      }

      const num: CombatNumber = {
        id: generateUid(),
        value,
        type,
        targetId,
        x,
        y,
        element: options?.element,
        variant: options?.variant,
        comboName: options?.comboName,
      }

      setCombatNumbers((prev) => [...prev, num])

      if (type === 'damage' && targetEl) {
        effects.shake(targetEl)
      }
    },
    [queryContainer]
  )

  const removeCombatNumber = useCallback((id: string) => {
    setCombatNumbers((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleCardPositionsUpdate = useCallback((positions: Map<string, CardPosition>) => {
    cardPositionsRef.current = positions
  }, [])

  const handleAnimationComplete = useCallback((id: string) => {
    setPendingAnimations((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // Process a single visual event using modular handlers
  const processVisualEvent = useCallback((event: VisualEvent) => {
    const ctx: HandlerContext = {
      combat,
      queryContainer,
      queryHand,
      containerRef,
      cardPositionsRef,
      lastTurnRef,
      effects,
      setCombatNumbers,
      setPendingAnimations,
      setTriggeredRelicId,
      spawnCombatNumber,
    }
    processEvent(event, ctx)
   
  }, [combat, spawnCombatNumber, queryContainer, queryHand, containerRef, setTriggeredRelicId])

  // Process visual event queue
  useEffect(() => {
    if (!combat?.visualQueue?.length) return

    const queue = combat.visualQueue

    for (const event of queue) {
      processVisualEvent(event)
    }

    // Clear the queue after processing
    setState((prev) => {
      if (!prev) return prev
      return applyAction(prev, { type: 'clearVisualQueue' })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat?.visualQueue, processVisualEvent])

  const resetVisuals = useCallback(() => {
    setCombatNumbers([])
    setPendingAnimations([])
    cardPositionsRef.current = new Map()
    lastTurnRef.current = 0
  }, [])

  return {
    combatNumbers,
    pendingAnimations,
    removeCombatNumber,
    handleAnimationComplete,
    handleCardPositionsUpdate,
    lastTurnRef,
    resetVisuals,
  }
}
