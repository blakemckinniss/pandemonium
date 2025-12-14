import { useState, useCallback, useEffect, useRef } from 'react'
import type { CombatState, CombatNumber, Element as GameElement, RunState, VisualEvent } from '../types'
import type { PendingCardAnimation } from '../components/Hand/CardAnimationOverlay'
import type { CardPosition } from '../components/Hand/Hand'
import { getCardDefinition } from '../game/cards'
import { applyAction } from '../game/actions'
import { emitParticle } from '../components/ParticleEffects/emitParticle'
import { gsap } from '../lib/dragdrop'
import { generateUid } from '../lib/utils'

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
        gsap.effects.shake(targetEl)
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
  }, [combat?.visualQueue])

  function processVisualEvent(event: VisualEvent) {
    switch (event.type) {
      case 'damage': {
        // Use 'critical' variant for high damage hits (15+)
        const isCritical = event.amount >= 15
        const effectiveVariant = isCritical && !event.variant ? 'execute' : event.variant

        spawnCombatNumber(event.targetId, event.amount, 'damage', {
          element: event.element,
          variant: effectiveVariant,
          comboName: isCritical ? (event.comboName ?? 'CRITICAL') : event.comboName,
        })

        // Spawn particles on target
        const damageTarget = queryContainer(`[data-target="${event.targetId}"]`)
        if (damageTarget) {
          // Critical hits get extra particle burst
          if (isCritical) {
            emitParticle(damageTarget, 'critical')
            emitParticle(damageTarget, 'spark')
            // Screen shake for critical
            if (containerRef.current) {
              gsap.effects.shake(containerRef.current, { intensity: 8 })
            }
          } else {
            emitParticle(damageTarget, 'spark')
          }

          // Hit flash and shake for enemies
          if (event.targetId !== 'player') {
            const elementColors: Record<string, string> = {
              fire: '#ff6348',
              ice: '#00d4ff',
              lightning: '#ffd700',
              void: '#a55eea',
              physical: '#ff4757',
            }
            gsap.effects.enemyHit(damageTarget, { color: elementColors[event.element ?? 'physical'] })
            // Stronger shake for higher damage
            if (isCritical) {
              gsap.effects.enemyShake(damageTarget, { intensity: 12 })
            } else if (event.amount >= 5) {
              gsap.effects.enemyShake(damageTarget)
            }
          }
        }
        break
      }
      case 'heal': {
        spawnCombatNumber(event.targetId, event.amount, 'heal')
        const healTarget = queryContainer(`[data-target="${event.targetId}"]`)
        if (healTarget) emitParticle(healTarget, 'heal')
        break
      }
      case 'block': {
        spawnCombatNumber(event.targetId, event.amount, 'block')
        const blockTarget = queryContainer(`[data-target="${event.targetId}"]`)
        if (blockTarget) emitParticle(blockTarget, 'block')
        break
      }
      case 'draw':
        // Animate mid-turn draws (turn-start draws handled by turn change effect)
        if (lastTurnRef.current === combat?.turn) {
          setTimeout(() => {
            const handCards = queryHand('.HandCard')
            if (handCards && handCards.length > 0) {
              const newCards = Array.from(handCards).slice(-event.count)
              if (newCards.length > 0) {
                gsap.effects.dealCards(newCards, { stagger: 0.05 })
              }
            }
          }, 50)
        }
        break
      case 'discard': {
        const discardAnims: PendingCardAnimation[] = []
        for (const cardUid of event.cardUids) {
          const cached = cardPositionsRef.current.get(cardUid)
          if (!cached) continue

          const cardDef = getCardDefinition(cached.definitionId)
          if (!cardDef) continue

          discardAnims.push({
            id: `discard-${cardUid}-${Date.now()}`,
            cardDef,
            position: { x: cached.x, y: cached.y },
            type: 'discard',
          })
        }
        if (discardAnims.length > 0) {
          setPendingAnimations((prev) => [...prev, ...discardAnims])
        }
        break
      }
      case 'exhaust': {
        const exhaustAnims: PendingCardAnimation[] = []
        for (const cardUid of event.cardUids) {
          const cached = cardPositionsRef.current.get(cardUid)
          if (!cached) continue

          const cardDef = getCardDefinition(cached.definitionId)
          if (!cardDef) continue

          const animType = cardDef.ethereal ? 'etherealExhaust' : 'exhaust'

          exhaustAnims.push({
            id: `exhaust-${cardUid}-${Date.now()}`,
            cardDef,
            position: { x: cached.x, y: cached.y },
            type: animType,
          })
        }
        if (exhaustAnims.length > 0) {
          setPendingAnimations((prev) => [...prev, ...exhaustAnims])
        }
        break
      }
      case 'banish': {
        const playerEl = queryContainer('[data-target="player"]')
        if (playerEl) {
          emitParticle(playerEl, 'banish')
          gsap.effects.pulse(playerEl, {
            color: 'oklch(0.25 0.12 300)',
            scale: 0.95,
          })
        }
        break
      }
      case 'powerApply': {
        const targetEl = queryContainer(`[data-target="${event.targetId}"]`)
        if (targetEl) {
          const isDebuff = event.powerId.match(/vulnerable|weak|frail|poison/)
          gsap.effects.pulse(targetEl, {
            color: isDebuff
              ? 'oklch(0.55 0.18 20)'
              : 'oklch(0.5 0.12 145)',
          })
          if (event.powerId === 'poison') {
            emitParticle(targetEl, 'poison')
          }
        }
        break
      }
      case 'powerRemove':
        // PowerIndicators handles fade reactively
        break
      case 'energy': {
        const energyOrb = queryContainer('[data-energy-orb]')
        if (energyOrb) {
          gsap.effects.energyPulse(energyOrb, {
            color: event.delta > 0
              ? 'oklch(0.7 0.15 70)'
              : 'oklch(0.4 0.1 70)',
          })
          if (event.delta > 0) {
            emitParticle(energyOrb, 'energy')
          }
        }
        break
      }
      case 'shuffle': {
        const deckPile = queryContainer('[data-deck-pile]')
        if (deckPile) {
          gsap.effects.shuffleDeck(deckPile)
        }
        break
      }
      case 'addCard': {
        const destName = event.destination === 'hand' ? 'hand'
          : event.destination === 'drawPile' ? 'draw pile'
          : 'discard pile'
        const cardDef = getCardDefinition(event.cardId)
        const cardName = cardDef?.name ?? event.cardId
        if (event.destination === 'hand') {
          setTimeout(() => {
            const handCards = queryHand('.HandCard')
            if (handCards && handCards.length > 0) {
              const newCards = Array.from(handCards).slice(-event.count)
              if (newCards.length > 0) {
                gsap.effects.dealCards(newCards, { stagger: 0.05 })
              }
            }
          }, 50)
        }
        console.log(`+${event.count} ${cardName} → ${destName}`)
        break
      }
      case 'costModify': {
        for (const cardUid of event.cardUids) {
          const cardEl = queryContainer(`[data-card-uid="${cardUid}"]`)
          if (cardEl) {
            gsap.effects.pulse(cardEl, {
              color: event.delta < 0
                ? 'oklch(0.7 0.15 145)'
                : 'oklch(0.6 0.15 25)',
            })
          }
        }
        break
      }
      case 'conditionalTrigger': {
        const playerEl = queryContainer('[data-entity="player"]')
        if (playerEl) {
          gsap.effects.pulse(playerEl, {
            color: event.branch === 'then'
              ? 'oklch(0.7 0.15 145)'
              : 'oklch(0.6 0.12 60)',
          })
        }
        console.log(`Conditional: ${event.branch} branch`)
        break
      }
      case 'repeatEffect': {
        const playerEl = queryContainer('[data-entity="player"]')
        if (playerEl && event.current === 1) {
          gsap.effects.pulse(playerEl, {
            color: 'oklch(0.65 0.15 280)',
          })
        }
        console.log(`Repeat: ${event.current}/${event.times}`)
        break
      }
      case 'replay': {
        const playerEl = queryContainer('[data-entity="player"]')
        if (playerEl) {
          gsap.effects.pulse(playerEl, {
            color: 'oklch(0.7 0.18 220)',
            scale: 1.08,
          })
          emitParticle(playerEl, 'combo')
        }
        break
      }
      case 'playTopCard': {
        const pileSelector = event.fromPile === 'drawPile' ? '[data-deck-pile]' : '[data-discard-pile]'
        const pileEl = queryContainer(pileSelector)
        const playerEl = queryContainer('[data-entity="player"]')

        if (pileEl) {
          gsap.effects.pulse(pileEl, {
            color: 'oklch(0.7 0.15 70)',
          })
        }
        if (playerEl) {
          emitParticle(playerEl, 'spark')
        }

        const cardDef = getCardDefinition(event.cardId)
        console.log(`Auto-play: ${cardDef?.name ?? event.cardId} from ${event.fromPile}`)
        break
      }
      case 'gold': {
        const playerEl = queryContainer('[data-entity="player"]')
        if (playerEl) {
          gsap.effects.pulse(playerEl, {
            color: event.delta > 0
              ? 'oklch(0.75 0.18 85)'
              : 'oklch(0.5 0.1 25)',
          })
          if (event.delta > 0) {
            emitParticle(playerEl, 'gold')
          }
          const rect = playerEl.getBoundingClientRect()
          const num: CombatNumber = {
            id: generateUid(),
            value: event.delta,
            type: 'gold',
            targetId: 'player',
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 3,
          }
          setCombatNumbers((prev) => [...prev, num])
        }
        break
      }
      case 'maxHealth': {
        const targetEl = queryContainer(`[data-target="${event.targetId}"]`)
        if (targetEl) {
          gsap.effects.maxHealthPulse(targetEl, {
            color: event.delta > 0
              ? 'oklch(0.6 0.2 145)'
              : 'oklch(0.6 0.2 25)',
          })
          emitParticle(targetEl, event.delta > 0 ? 'heal' : 'spark')

          const rect = targetEl.getBoundingClientRect()
          const num: CombatNumber = {
            id: generateUid(),
            value: event.delta,
            type: 'maxHealth',
            targetId: event.targetId,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 3,
            label: 'Max HP',
          }
          setCombatNumbers((prev) => [...prev, num])
        }
        break
      }
      case 'upgrade': {
        for (const cardUid of event.cardUids) {
          const cardEl = queryContainer(`[data-card-uid="${cardUid}"]`)
          if (cardEl) {
            gsap.effects.upgradeCard(cardEl)
            emitParticle(cardEl, 'upgrade')
          }
        }
        console.log(`Upgraded ${event.cardUids.length} card(s)`)
        break
      }
      case 'retain': {
        for (const cardUid of event.cardUids) {
          const cardEl = queryContainer(`[data-card-uid="${cardUid}"]`)
          if (cardEl) {
            gsap.effects.retainCard(cardEl)
            emitParticle(cardEl, 'retain')
          }
        }
        console.log(`Retained ${event.cardUids.length} card(s)`)
        break
      }
      case 'transform': {
        const cardEl = queryContainer(`[data-card-uid="${event.cardUid}"]`)
        if (cardEl) {
          gsap.effects.transformCard(cardEl)
          emitParticle(cardEl, 'transform')
        }
        const fromDef = getCardDefinition(event.fromCardId)
        const toDef = getCardDefinition(event.toCardId)
        console.log(`Transform: ${fromDef?.name ?? event.fromCardId} → ${toDef?.name ?? event.toCardId}`)
        break
      }
      case 'putOnDeck': {
        const deckAnims: PendingCardAnimation[] = []
        for (const cardUid of event.cardUids) {
          const cached = cardPositionsRef.current.get(cardUid)
          if (!cached) continue

          const cardDef = getCardDefinition(cached.definitionId)
          if (!cardDef) continue

          deckAnims.push({
            id: `deck-${cardUid}-${Date.now()}`,
            cardDef,
            position: { x: cached.x, y: cached.y },
            type: 'putOnDeck',
          })
        }
        if (deckAnims.length > 0) {
          setPendingAnimations((prev) => [...prev, ...deckAnims])
        }
        console.log(`Put ${event.cardUids.length} card(s) on ${event.position} of deck`)
        break
      }
      case 'relicTrigger': {
        setTriggeredRelicId(event.relicId)
        setTimeout(() => setTriggeredRelicId(null), 600)

        const playerEl = queryContainer('[data-entity="player"]')
        if (playerEl) {
          gsap.effects.pulse(playerEl, {
            color: 'oklch(0.6 0.15 300)',
          })
          emitParticle(playerEl, 'energy')
        }
        console.log(`Relic triggered: ${event.relicDefId} (${event.trigger})`)
        break
      }
      case 'powerTrigger': {
        const targetEl = queryContainer(`[data-target="${event.targetId}"]`)
        if (targetEl) {
          const powerColors: Record<string, string> = {
            thorns: 'oklch(0.55 0.2 25)',
            poison: 'oklch(0.45 0.18 145)',
            burn: 'oklch(0.6 0.2 40)',
            burning: 'oklch(0.6 0.2 40)',
            regen: 'oklch(0.6 0.18 145)',
            metallicize: 'oklch(0.5 0.1 250)',
            platedArmor: 'oklch(0.5 0.1 250)',
          }
          const particleTypes: Record<string, 'thorns' | 'poison' | 'spark' | 'heal' | 'block'> = {
            thorns: 'thorns',
            poison: 'poison',
            burn: 'spark',
            burning: 'spark',
            regen: 'heal',
            metallicize: 'block',
            platedArmor: 'block',
          }

          const color = powerColors[event.powerId] ?? 'oklch(0.6 0.15 280)'
          const particleType = particleTypes[event.powerId] ?? 'spark'

          gsap.effects.pulse(targetEl, { color })
          emitParticle(targetEl, particleType)
        }
        console.log(`Power triggered: ${event.powerId} on ${event.targetId} (${event.triggerEvent})`)
        break
      }
      case 'cardPlayed': {
        const targetEl = event.targetId
          ? queryContainer(`[data-target="${event.targetId}"]`)
          : queryContainer('[data-entity="player"]')
        if (targetEl) {
          if (event.theme === 'attack' || event.theme === 'skill' || event.theme === 'power') {
            emitParticle(targetEl, event.theme)
            gsap.effects.cardPlayFlash(targetEl, { theme: event.theme })
          }
        }
        break
      }
      case 'comboMilestone': {
        const playerEl = queryContainer('[data-entity="player"]')
        if (playerEl) {
          const burstCount = event.count >= 7 ? 3 : event.count >= 5 ? 2 : 1
          for (let i = 0; i < burstCount; i++) {
            setTimeout(() => emitParticle(playerEl, 'combo'), i * 80)
          }
          spawnCombatNumber('player', event.count, 'combo')
          if (event.count >= 5) {
            gsap.effects.shake(containerRef.current, { intensity: event.count >= 7 ? 6 : 3 })
          }
        }
        break
      }
    }
  }

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
