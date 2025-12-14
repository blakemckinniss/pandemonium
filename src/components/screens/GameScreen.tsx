import { useState, useCallback, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Hand, type CardPosition } from '../Hand/Hand'
import { CardAnimationOverlay, type PendingCardAnimation } from '../Hand/CardAnimationOverlay'
import { Field } from '../Field/Field'
import { CombatNumbers } from '../CombatNumbers/CombatNumbers'
import { RoomSelect } from '../DungeonDeck/RoomSelect'
import { RewardScreen } from './RewardScreen'
import { CampfireScreen } from './CampfireScreen'
import { TreasureScreen } from './TreasureScreen'
import { UnlockNotification } from '../UnlockNotification/UnlockNotification'
import { ParticleEffects } from '../ParticleEffects/ParticleEffects'
import { emitParticle } from '../ParticleEffects/emitParticle'
import { CardPileModal, type PileType } from '../Modal/CardPileModal'
import { CardSelectionModal } from '../Modal/CardSelectionModal'
import { RelicBar } from '../RelicBar/RelicBar'
import type { RunState, CombatNumber, Element } from '../../types'
import { applyAction, createCardInstance } from '../../game/actions'
import { createNewRun, createEnemiesFromRoom } from '../../game/new-game'
import { getCardDefinition } from '../../game/cards'
import { getEnergyCostNumber } from '../../lib/effects'
import { drawRoomChoices } from '../../game/dungeon-deck'
import { getRoomDefinition } from '../../content/rooms'
import { enableDragDrop, disableDragDrop, gsap } from '../../lib/dragdrop'
import { generateUid } from '../../lib/utils'
import { useMetaStore, checkUnlocks } from '../../stores/metaStore'
import { saveRun, getCustomDeckById } from '../../stores/db'

interface GameScreenProps {
  deckId?: string | null
  onReturnToMenu?: () => void
}

export function GameScreen({ deckId, onReturnToMenu }: GameScreenProps) {
  const [state, setState] = useState<RunState | null>(null)
  const [combatNumbers, setCombatNumbers] = useState<CombatNumber[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [pendingUnlocks, setPendingUnlocks] = useState<string[]>([])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [pendingAnimations, setPendingAnimations] = useState<PendingCardAnimation[]>([])
  const [pileModalOpen, setPileModalOpen] = useState<PileType | null>(null)
  const [triggeredRelicId, setTriggeredRelicId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const prevHealthRef = useRef<Record<string, number>>({})
  const runStartRef = useRef<Date>(new Date())
  const runRecordedRef = useRef(false)
  const lastTurnRef = useRef<number>(0)
  const cardPositionsRef = useRef<Map<string, CardPosition>>(new Map())

  // Meta store accessed via getState() to avoid full-store subscription

  // Initialize game
  useEffect(() => {
    async function init() {
      let customCardIds: string[] | undefined

      if (deckId) {
        const deck = await getCustomDeckById(deckId)
        if (deck) customCardIds = deck.cardIds
      }

      setState(createNewRun('warrior', customCardIds))
    }
    init()
  }, [deckId])

  // Animate cards when a new turn starts
  useEffect(() => {
    if (!handRef.current || !state?.combat) return

    const currentTurn = state.combat.turn
    if (currentTurn === lastTurnRef.current) return

    // New turn started - animate dealing cards
    lastTurnRef.current = currentTurn

    // Use setTimeout to ensure React has committed DOM changes
    setTimeout(() => {
      const handCards = handRef.current?.querySelectorAll('.HandCard')
      if (handCards && handCards.length > 0) {
        gsap.effects.dealCards(handCards, { stagger: 0.08 })
      }
    }, 50)
  }, [state?.combat?.turn, state?.combat?.hand.length])

  // Process visual event queue
  useEffect(() => {
    if (!state?.combat?.visualQueue?.length) return

    const queue = state.combat.visualQueue

    // Process each visual event
    for (const event of queue) {
      switch (event.type) {
        case 'damage': {
          spawnCombatNumber(event.targetId, event.amount, 'damage', {
            element: event.element,
            variant: event.variant,
            comboName: event.comboName,
          })
          // Spawn spark particles on target
          const damageTarget = containerRef.current?.querySelector(`[data-target="${event.targetId}"]`)
          if (damageTarget) emitParticle(damageTarget, 'spark')
          break
        }
        case 'heal': {
          spawnCombatNumber(event.targetId, event.amount, 'heal')
          // Spawn heal particles on target
          const healTarget = containerRef.current?.querySelector(`[data-target="${event.targetId}"]`)
          if (healTarget) emitParticle(healTarget, 'heal')
          break
        }
        case 'block': {
          spawnCombatNumber(event.targetId, event.amount, 'block')
          // Spawn block particles on target
          const blockTarget = containerRef.current?.querySelector(`[data-target="${event.targetId}"]`)
          if (blockTarget) emitParticle(blockTarget, 'block')
          break
        }
        case 'draw':
          // Animate mid-turn draws (turn-start draws handled by turn change effect)
          if (lastTurnRef.current === state.combat?.turn) {
            // Mid-turn draw - animate the newly drawn cards
            setTimeout(() => {
              const handCards = handRef.current?.querySelectorAll('.HandCard')
              if (handCards && handCards.length > 0) {
                // Animate just the last N cards (newly drawn)
                const newCards = Array.from(handCards).slice(-event.count)
                if (newCards.length > 0) {
                  gsap.effects.dealCards(newCards, { stagger: 0.05 })
                }
              }
            }, 50)
          }
          break
        case 'discard': {
          // Create ghost animations using cached positions
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
          // Create ghost animations using cached positions
          const exhaustAnims: PendingCardAnimation[] = []
          for (const cardUid of event.cardUids) {
            const cached = cardPositionsRef.current.get(cardUid)
            if (!cached) continue

            const cardDef = getCardDefinition(cached.definitionId)
            if (!cardDef) continue

            // Use ethereal exhaust animation for ethereal cards (ghostly purple fade)
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
          // Banish visual - emit particles on player (card is removed from game)
          const playerEl = containerRef.current?.querySelector('[data-target="player"]')
          if (playerEl) {
            emitParticle(playerEl, 'spark')
            gsap.effects.pulse(playerEl, {
              color: 'oklch(0.3 0.15 300)', // dark purple for void
            })
          }
          console.log(`Banish: ${event.cardUids.length} card(s) removed from combat`)
          break
        }
        case 'powerApply': {
          // Pulse the target entity when power applied
          const targetEl = containerRef.current?.querySelector(
            `[data-target="${event.targetId}"]`
          )
          if (targetEl) {
            const isDebuff = event.powerId.match(/vulnerable|weak|frail|poison/)
            gsap.effects.pulse(targetEl, {
              color: isDebuff
                ? 'oklch(0.55 0.18 20)'  // Debuff = red
                : 'oklch(0.5 0.12 145)', // Buff = green
            })
            // Poison gets special particles
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
          const energyOrb = containerRef.current?.querySelector('[data-energy-orb]')
          if (energyOrb) {
            gsap.effects.energyPulse(energyOrb, {
              color: event.delta > 0
                ? 'oklch(0.7 0.15 70)'  // Gain = bright gold
                : 'oklch(0.4 0.1 70)',  // Spend = dim
            })
            // Spawn energy particles on gain
            if (event.delta > 0) {
              emitParticle(energyOrb, 'energy')
            }
          }
          break
        }
        case 'shuffle': {
          const deckPile = containerRef.current?.querySelector('[data-deck-pile]')
          if (deckPile) {
            gsap.effects.shuffleDeck(deckPile)
          }
          break
        }
        case 'addCard': {
          // Show notification for card creation
          const destName = event.destination === 'hand' ? 'hand'
            : event.destination === 'drawPile' ? 'draw pile'
            : 'discard pile'
          const cardDef = getCardDefinition(event.cardId)
          const cardName = cardDef?.name ?? event.cardId
          // Spawn a status message (could be toast, for now use combat number on player)
          if (event.destination === 'hand') {
            // Animate new cards in hand
            setTimeout(() => {
              const handCards = handRef.current?.querySelectorAll('.HandCard')
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
          // Flash cards whose cost changed
          for (const cardUid of event.cardUids) {
            const cardEl = containerRef.current?.querySelector(`[data-card-uid="${cardUid}"]`)
            if (cardEl) {
              gsap.effects.pulse(cardEl, {
                color: event.delta < 0
                  ? 'oklch(0.7 0.15 145)' // Cost reduced = green
                  : 'oklch(0.6 0.15 25)', // Cost increased = red
              })
            }
          }
          break
        }
        case 'conditionalTrigger': {
          // Flash to indicate conditional branch triggered
          const playerEl = containerRef.current?.querySelector('[data-entity="player"]')
          if (playerEl) {
            gsap.effects.pulse(playerEl, {
              color: event.branch === 'then'
                ? 'oklch(0.7 0.15 145)' // then = green (condition met)
                : 'oklch(0.6 0.12 60)', // else = yellow (fallback)
            })
          }
          console.log(`Conditional: ${event.branch} branch`)
          break
        }
        case 'repeatEffect': {
          // Show repeat indicator
          const playerEl = containerRef.current?.querySelector('[data-entity="player"]')
          if (playerEl && event.current === 1) {
            // Only pulse on first iteration
            gsap.effects.pulse(playerEl, {
              color: 'oklch(0.65 0.15 280)', // purple for repeat
            })
          }
          console.log(`Repeat: ${event.current}/${event.times}`)
          break
        }
        case 'replay': {
          // Visual feedback when a card is replayed (Echo Form, Double Tap, etc.)
          const playerEl = containerRef.current?.querySelector('[data-entity="player"]')
          if (playerEl) {
            gsap.effects.pulse(playerEl, {
              color: 'oklch(0.7 0.18 220)', // cyan/blue for replay
            })
            emitParticle(playerEl, 'energy')
          }
          console.log(`Replay: card replayed ${event.times}x`)
          break
        }
        case 'playTopCard': {
          // Visual feedback when playing a card from draw/discard pile (Havoc, Mayhem, etc.)
          const pileSelector = event.fromPile === 'drawPile' ? '[data-deck-pile]' : '[data-discard-pile]'
          const pileEl = containerRef.current?.querySelector(pileSelector)
          const playerEl = containerRef.current?.querySelector('[data-entity="player"]')

          if (pileEl) {
            gsap.effects.pulse(pileEl, {
              color: 'oklch(0.7 0.15 70)', // gold for auto-play
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
          // Visual feedback for gold gain/loss
          const playerEl = containerRef.current?.querySelector('[data-entity="player"]')
          if (playerEl) {
            gsap.effects.pulse(playerEl, {
              color: event.delta > 0
                ? 'oklch(0.75 0.18 85)' // gold gain = bright gold
                : 'oklch(0.5 0.1 25)',  // gold loss = dim red
            })
            if (event.delta > 0) {
              emitParticle(playerEl, 'energy')
            }
          }
          console.log(`Gold: ${event.delta > 0 ? '+' : ''}${event.delta}`)
          break
        }
        case 'maxHealth': {
          // Visual feedback for max health change
          const targetEl = containerRef.current?.querySelector(`[data-target="${event.targetId}"]`)
          if (targetEl) {
            gsap.effects.maxHealthPulse(targetEl, {
              color: event.delta > 0
                ? 'oklch(0.6 0.2 145)' // gain = green
                : 'oklch(0.6 0.2 25)',  // lose = red
            })
            emitParticle(targetEl, event.delta > 0 ? 'heal' : 'spark')

            // Spawn floating text
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
          // Golden sparkle on upgraded cards
          for (const cardUid of event.cardUids) {
            const cardEl = containerRef.current?.querySelector(`[data-card-uid="${cardUid}"]`)
            if (cardEl) {
              gsap.effects.upgradeCard(cardEl)
              emitParticle(cardEl, 'upgrade')
            }
          }
          console.log(`Upgraded ${event.cardUids.length} card(s)`)
          break
        }
        case 'retain': {
          // Cyan glow on retained cards
          for (const cardUid of event.cardUids) {
            const cardEl = containerRef.current?.querySelector(`[data-card-uid="${cardUid}"]`)
            if (cardEl) {
              gsap.effects.retainCard(cardEl)
              emitParticle(cardEl, 'retain')
            }
          }
          console.log(`Retained ${event.cardUids.length} card(s)`)
          break
        }
        case 'transform': {
          // Morph effect on transformed card
          const cardEl = containerRef.current?.querySelector(`[data-card-uid="${event.cardUid}"]`)
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
          // Create ghost animations for cards going to deck
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
          // Flash the triggered relic
          setTriggeredRelicId(event.relicId)
          setTimeout(() => setTriggeredRelicId(null), 600)

          // Pulse player when relic triggers
          const playerEl = containerRef.current?.querySelector('[data-entity="player"]')
          if (playerEl) {
            gsap.effects.pulse(playerEl, {
              color: 'oklch(0.6 0.15 300)', // purple for relic
            })
            emitParticle(playerEl, 'energy')
          }
          console.log(`Relic triggered: ${event.relicDefId} (${event.trigger})`)
          break
        }
      }
    }

    // Clear the queue after processing
    setState((prev) => {
      if (!prev) return prev
      return applyAction(prev, { type: 'clearVisualQueue' })
    })
  }, [state?.combat?.visualQueue])

  // Setup drag-drop when in combat
  useEffect(() => {
    if (!containerRef.current || !state?.combat || isAnimating) {
      disableDragDrop()
      return
    }

    const isPlayerTurn = state.combat.phase === 'playerTurn'
    if (!isPlayerTurn) {
      disableDragDrop()
      return
    }

    enableDragDrop({
      container: containerRef.current,
      onPlayCard: handleDragPlayCard,
      getCardTarget: (cardEl) => cardEl.dataset.cardTarget || null,
      canPlay: (cardEl) => {
        const cardId = cardEl.dataset.cardId
        if (!cardId || !state.combat) return false

        const card = state.combat.hand.find((c) => c.uid === cardId)
        if (!card) return false

        const def = getCardDefinition(card.definitionId)
        if (!def) return false

        return state.combat.player.energy >= getEnergyCostNumber(def.energy)
      },
    })

    return () => disableDragDrop()
  }, [state, isAnimating])

  // Handle victory transition to reward
  useEffect(() => {
    if (state?.combat?.phase === 'victory') {
      setTimeout(() => {
        setState((prev) => {
          if (!prev) return prev
          return { ...prev, gamePhase: 'reward', combat: null }
        })
      }, 1000)
    }
  }, [state?.combat?.phase])

  // Record run on game over (win or loss)
  useEffect(() => {
    if (!state) return
    if (runRecordedRef.current) return

    const isWin = state.gamePhase === 'gameOver'
    const isLoss = state.combat?.phase === 'defeat'

    if (!isWin && !isLoss) return

    runRecordedRef.current = true

    const runResult = {
      won: isWin,
      floor: state.floor,
      gold: state.gold,
      enemiesKilled: state.stats.enemiesKilled,
      heroId: state.hero.id,
    }

    // Record in meta store and check unlocks
    const store = useMetaStore.getState()
    const unlocks = checkUnlocks(runResult, store)
    store.recordRun(runResult)

    if (unlocks.length > 0) {
      setPendingUnlocks(unlocks)
    }

    // Save to IndexedDB
    saveRun({
      startedAt: runStartRef.current,
      endedAt: new Date(),
      heroId: state.hero.id,
      won: isWin,
      floor: state.floor,
      gold: state.gold,
      enemiesKilled: state.stats.enemiesKilled,
      cardsPlayed: state.stats.cardsPlayed,
      damageDealt: state.stats.damageDealt,
      damageTaken: state.stats.damageTaken,
      finalDeck: state.deck.map((c) => c.definitionId),
    })
  }, [state?.gamePhase, state?.combat?.phase])

  const spawnCombatNumber = useCallback(
    (
      targetId: string,
      value: number,
      type: 'damage' | 'heal' | 'block',
      options?: {
        element?: Element
        variant?: 'poison' | 'piercing' | 'combo' | 'chain' | 'execute'
        comboName?: string
      }
    ) => {
      const targetEl = containerRef.current?.querySelector(
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
    []
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

  // ============================================
  // ROOM SELECTION
  // ============================================

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
  }, [])

  // ============================================
  // REWARD SCREEN
  // ============================================

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
  }, [])

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
  }, [])

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
  }, [])

  // ============================================
  // CAMPFIRE
  // ============================================

  const advanceFromCampfire = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev

      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      if (choices.length === 0) {
        return { ...prev, gamePhase: 'gameOver' as const, floor: prev.floor + 1 }
      }

      return {
        ...prev,
        gamePhase: 'roomSelect',
        dungeonDeck: remaining,
        roomChoices: choices,
        floor: prev.floor + 1,
      }
    })
  }, [])

  const handleCampfireRest = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      const healAmount = Math.floor(prev.hero.maxHealth * 0.3)
      return {
        ...prev,
        hero: {
          ...prev.hero,
          currentHealth: Math.min(prev.hero.maxHealth, prev.hero.currentHealth + healAmount),
        },
      }
    })
    advanceFromCampfire()
  }, [advanceFromCampfire])

  const handleCampfireSmith = useCallback((cardUid: string) => {
    setState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        deck: prev.deck.map(card =>
          card.uid === cardUid ? { ...card, upgraded: true } : card
        ),
      }
    })
    advanceFromCampfire()
  }, [advanceFromCampfire])

  const handleCampfireSkip = useCallback(() => {
    advanceFromCampfire()
  }, [advanceFromCampfire])

  // ============================================
  // TREASURE
  // ============================================

  const advanceFromTreasure = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev

      const { choices, remaining } = drawRoomChoices(prev.dungeonDeck, 3)

      if (choices.length === 0) {
        return { ...prev, gamePhase: 'gameOver' as const, floor: prev.floor + 1 }
      }

      return {
        ...prev,
        gamePhase: 'roomSelect',
        dungeonDeck: remaining,
        roomChoices: choices,
        floor: prev.floor + 1,
      }
    })
  }, [])

  const handleTreasureSelectRelic = useCallback((relicId: string) => {
    setState((prev) => {
      if (!prev) return prev
      const newRelic = { id: generateUid(), definitionId: relicId }
      return {
        ...prev,
        relics: [...prev.relics, newRelic],
      }
    })
    advanceFromTreasure()
  }, [advanceFromTreasure])

  const handleTreasureSkip = useCallback(() => {
    advanceFromTreasure()
  }, [advanceFromTreasure])

  // ============================================
  // COMBAT
  // ============================================

  const handleDragPlayCard = useCallback(
    (cardUid: string, targetId: string | null) => {
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, { type: 'playCard', cardUid, targetId: targetId ?? undefined })
      })
    },
    []
  )

  const handleClickPlayCard = useCallback(
    (cardUid: string) => {
      if (!state?.combat) return

      const card = state.combat.hand.find((c) => c.uid === cardUid)
      if (!card) return

      const def = getCardDefinition(card.definitionId)
      if (!def) return

      if (def.target === 'self' || def.target === 'allEnemies') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, { type: 'playCard', cardUid })
        })
      }
    },
    [state]
  )

  const handleEndTurn = useCallback(() => {
    if (!state?.combat || isAnimating) return

    setIsAnimating(true)

    const handCards = handRef.current?.querySelectorAll('.Card')
    if (handCards && handCards.length > 0) {
      gsap.effects.discardHand(handCards, {
        onComplete: () => {
          setState((prev) => {
            if (!prev?.combat) return prev
            return applyAction(prev, { type: 'endTurn' })
          })

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

            setIsAnimating(false)
          }, 600)
        },
      })
    } else {
      setState((prev) => {
        if (!prev?.combat) return prev

        let newState = applyAction(prev, { type: 'endTurn' })
        for (const enemy of prev.combat.enemies) {
          newState = applyAction(newState, { type: 'enemyAction', enemyId: enemy.id })
        }
        newState = applyAction(newState, { type: 'startTurn' })
        return newState
      })
      setIsAnimating(false)
    }
  }, [state, isAnimating])

  const handleRestart = useCallback(() => {
    if (onReturnToMenu) {
      onReturnToMenu()
    } else {
      prevHealthRef.current = {}
      runStartRef.current = new Date()
      runRecordedRef.current = false
      lastTurnRef.current = 0
      setCombatNumbers([])
      setPendingUnlocks([])
      setCurrentRoomId(null)
      setState(createNewRun('warrior'))
    }
  }, [onReturnToMenu])

  const handleUnlocksDismissed = useCallback(() => {
    setPendingUnlocks([])
  }, [])

  // Handle scry/tutor/discover selection resolution
  const handleSelectionConfirm = useCallback(
    (selectedUids: string[], discardedUids?: string[]) => {
      if (!state?.combat?.pendingSelection) return

      const pending = state.combat.pendingSelection

      if (pending.type === 'scry') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveScry',
            keptUids: selectedUids,
            discardedUids: discardedUids ?? [],
          })
        })
      } else if (pending.type === 'tutor') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveTutor',
            selectedUids,
          })
        })
      } else if (pending.type === 'discover') {
        // For discover, selectedUids are actually card definition IDs
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveDiscover',
            selectedCardIds: selectedUids,
          })
        })
      } else if (pending.type === 'banish') {
        setState((prev) => {
          if (!prev) return prev
          return applyAction(prev, {
            type: 'resolveBanish',
            selectedUids,
          })
        })
      }
    },
    [state?.combat?.pendingSelection]
  )

  const handleSelectionClose = useCallback(() => {
    // For now, closing without selection = empty selection
    if (!state?.combat?.pendingSelection) return

    const pending = state.combat.pendingSelection
    if (pending.type === 'scry') {
      // Put all cards back on top in original order
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveScry',
          keptUids: pending.cards.map((c) => c.uid),
          discardedUids: [],
        })
      })
    } else if (pending.type === 'tutor') {
      // Skip tutor selection
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveTutor',
          selectedUids: [],
        })
      })
    } else if (pending.type === 'discover') {
      // Skip discover selection (add nothing)
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveDiscover',
          selectedCardIds: [],
        })
      })
    } else if (pending.type === 'banish') {
      // Skip banish selection (banish nothing)
      setState((prev) => {
        if (!prev) return prev
        return applyAction(prev, {
          type: 'resolveBanish',
          selectedUids: [],
        })
      })
    }
  }, [state?.combat?.pendingSelection])

  // ============================================
  // RENDER
  // ============================================

  if (!state) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Room selection phase
  if (state.gamePhase === 'roomSelect') {
    return (
      <RoomSelect
        choices={state.roomChoices}
        floor={state.floor}
        onSelectRoom={handleSelectRoom}
      />
    )
  }

  // Reward phase
  if (state.gamePhase === 'reward') {
    return (
      <RewardScreen
        floor={state.floor}
        gold={state.gold}
        ownedRelicIds={state.relics.map((r) => r.definitionId)}
        onAddCard={handleAddCard}
        onAddRelic={handleAddRelic}
        onSkip={handleSkipReward}
      />
    )
  }

  // Campfire phase
  if (state.gamePhase === 'campfire') {
    return (
      <CampfireScreen
        hero={state.hero}
        deck={state.deck}
        onRest={handleCampfireRest}
        onSmith={handleCampfireSmith}
        onSkip={handleCampfireSkip}
      />
    )
  }

  // Treasure phase
  if (state.gamePhase === 'treasure') {
    const isLargeTreasure = currentRoomId === 'treasure_large'
    return (
      <TreasureScreen
        floor={state.floor}
        isLargeTreasure={isLargeTreasure}
        ownedRelicIds={state.relics.map((r) => r.definitionId)}
        onSelectRelic={handleTreasureSelectRelic}
        onSkip={handleTreasureSkip}
      />
    )
  }

  // Game over (win)
  if (state.gamePhase === 'gameOver') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
        <UnlockNotification unlocks={pendingUnlocks} onComplete={handleUnlocksDismissed} />
        <h1 className="text-5xl font-bold text-heal mb-4">Dungeon Cleared!</h1>
        <p className="text-xl text-gray-400 mb-2">You conquered all {state.floor} floors</p>
        <p className="text-lg text-energy mb-4">Final Gold: {state.gold}</p>
        <div className="text-sm text-gray-500 mb-8 space-y-1 text-center">
          <p>Enemies Slain: {state.stats.enemiesKilled}</p>
          <p>Damage Dealt: {state.stats.damageDealt}</p>
          <p>Cards Played: {state.stats.cardsPlayed}</p>
        </div>
        <button
          onClick={handleRestart}
          className="px-8 py-3 bg-energy text-black font-bold rounded-lg text-lg hover:brightness-110 transition"
        >
          New Run
        </button>
      </div>
    )
  }

  // Combat phase
  if (!state.combat) {
    return <div className="flex items-center justify-center h-screen">Loading combat...</div>
  }

  const { combat } = state
  const isPlayerTurn = combat.phase === 'playerTurn'
  const isVictory = combat.phase === 'victory'
  const isDefeat = combat.phase === 'defeat'

  // Get current room info
  const currentRoom = currentRoomId ? getRoomDefinition(currentRoomId) : null
  const deckRemaining = state.dungeonDeck.length

  return (
    <div
      ref={containerRef}
      className="GameScreen h-screen flex flex-col overflow-hidden relative"
    >
      <ParticleEffects containerRef={containerRef} />
      <CombatNumbers numbers={combatNumbers} onComplete={removeCombatNumber} />
      <UnlockNotification unlocks={pendingUnlocks} onComplete={handleUnlocksDismissed} />

      {/* Top-right UI cluster */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <button
          onClick={handleEndTurn}
          disabled={!isPlayerTurn || isAnimating}
          className="EndTurnBtn"
        >
          End Turn
        </button>
        <div className="flex gap-2">
          <div className="Chip">
            <Icon icon="game-icons:hourglass" className="text-gray-400" />
            <span>Turn {combat.turn}</span>
          </div>
          <div className="Chip">
            <Icon icon="game-icons:two-coins" className="text-gold" />
            <span>{state.gold}</span>
          </div>
        </div>
      </div>

      {/* Top-left room info */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="Chip">
          <Icon icon="game-icons:dungeon-gate" className="text-gray-400" />
          <span>{currentRoom?.name ?? 'Unknown Room'}</span>
          <span className="text-gray-500 ml-1">({deckRemaining} left)</span>
        </div>
        <div className="flex gap-2">
          <div
            className="Chip PileIndicator"
            data-deck-pile
            onClick={() => setPileModalOpen('draw')}
          >
            <Icon icon="game-icons:card-pickup" className="text-gray-400" />
            <span>{combat.drawPile.length}</span>
          </div>
          <div
            className="Chip PileIndicator"
            data-discard-pile
            onClick={() => setPileModalOpen('discard')}
          >
            <Icon icon="game-icons:card-discard" className="text-gray-400" />
            <span>{combat.discardPile.length}</span>
          </div>
          {combat.exhaustPile.length > 0 && (
            <div
              className="Chip PileIndicator"
              onClick={() => setPileModalOpen('exhaust')}
            >
              <Icon icon="game-icons:card-burn" className="text-damage" />
              <span>{combat.exhaustPile.length}</span>
            </div>
          )}
        </div>
        {/* Relic bar */}
        {state.relics.length > 0 && (
          <RelicBar relics={state.relics} triggeredRelicId={triggeredRelicId ?? undefined} />
        )}
      </div>

      {/* Combat field - centered */}
      <div className="flex-1 flex flex-col justify-center">
        <Field player={combat.player} enemies={combat.enemies} />
      </div>

      {/* Hand area - no border/divider */}
      <div ref={handRef} className="pb-4">
        <Hand
          cards={combat.hand}
          energy={combat.player.energy}
          onPlayCard={handleClickPlayCard}
          onPositionsUpdate={handleCardPositionsUpdate}
        />
      </div>

      {/* Card animation overlay for discard/exhaust ghosts */}
      <CardAnimationOverlay
        animations={pendingAnimations}
        onComplete={handleAnimationComplete}
      />

      {isVictory && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-4 text-heal">Victory!</h2>
            <p className="text-gray-400">Proceeding to rewards...</p>
          </div>
        </div>
      )}

      {isDefeat && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6 text-damage">Defeat</h2>
            <p className="text-gray-400 mb-2">You reached floor {state.floor}</p>
            <div className="text-sm text-gray-500 mb-6 space-y-1">
              <p>Enemies Slain: {state.stats.enemiesKilled}</p>
              <p>Damage Dealt: {state.stats.damageDealt}</p>
              <p>Cards Played: {state.stats.cardsPlayed}</p>
            </div>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-energy text-black font-bold rounded-lg text-lg hover:brightness-110 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Card Pile Modal */}
      <CardPileModal
        isOpen={pileModalOpen !== null}
        onClose={() => setPileModalOpen(null)}
        pileType={pileModalOpen ?? 'draw'}
        cards={
          pileModalOpen === 'draw' ? combat.drawPile :
          pileModalOpen === 'discard' ? combat.discardPile :
          combat.exhaustPile
        }
      />

      {/* Card Selection Modal (for scry/tutor/discover/banish) */}
      {combat.pendingSelection && (
        <CardSelectionModal
          isOpen={true}
          onClose={handleSelectionClose}
          title={
            combat.pendingSelection.type === 'scry'
              ? `Scry ${combat.pendingSelection.cards.length}`
              : combat.pendingSelection.type === 'discover'
              ? 'Discover'
              : combat.pendingSelection.type === 'banish'
              ? 'Choose cards to banish'
              : 'Search for a card'
          }
          cards={combat.pendingSelection.cards}
          minSelect={
            combat.pendingSelection.type === 'tutor' ? 0 :
            combat.pendingSelection.type === 'discover' ? 1 :
            combat.pendingSelection.type === 'banish' ? 1 : 0
          }
          maxSelect={
            combat.pendingSelection.type === 'tutor'
              ? combat.pendingSelection.maxSelect
              : combat.pendingSelection.type === 'discover'
              ? combat.pendingSelection.maxSelect
              : combat.pendingSelection.type === 'banish'
              ? combat.pendingSelection.maxSelect
              : combat.pendingSelection.cards.length
          }
          mode={
            combat.pendingSelection.type === 'scry' ? 'scry' :
            combat.pendingSelection.type === 'discover' ? 'discover' : 'pick'
          }
          onConfirm={handleSelectionConfirm}
          confirmText={
            combat.pendingSelection.type === 'scry' ? 'Confirm' :
            combat.pendingSelection.type === 'discover' ? 'Choose' :
            combat.pendingSelection.type === 'banish' ? 'Banish' : 'Add to Hand'
          }
          allowSkip={combat.pendingSelection.type === 'tutor' || combat.pendingSelection.type === 'banish'}
        />
      )}
    </div>
  )
}

export default GameScreen
