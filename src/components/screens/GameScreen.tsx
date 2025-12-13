import { useState, useCallback, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Hand } from '../Hand/Hand'
import { Field } from '../Field/Field'
import { CombatNumbers } from '../CombatNumbers/CombatNumbers'
import { RoomSelect } from '../DungeonDeck/RoomSelect'
import { RewardScreen } from './RewardScreen'
import { UnlockNotification } from '../UnlockNotification/UnlockNotification'
import type { RunState, CombatNumber } from '../../types'
import { applyAction, createCardInstance } from '../../game/actions'
import { createNewRun, createEnemiesFromRoom } from '../../game/new-game'
import { getCardDefinition } from '../../game/cards'
import { drawRoomChoices } from '../../game/dungeon-deck'
import { getRoomDefinition } from '../../content/rooms'
import { enableDragDrop, disableDragDrop, gsap } from '../../lib/dragdrop'
import { generateUid } from '../../lib/utils'
import { useMetaStore, checkUnlocks } from '../../stores/metaStore'
import { saveRun } from '../../stores/db'

export function GameScreen() {
  const [state, setState] = useState<RunState | null>(null)
  const [combatNumbers, setCombatNumbers] = useState<CombatNumber[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [pendingUnlocks, setPendingUnlocks] = useState<string[]>([])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const prevHealthRef = useRef<Record<string, number>>({})
  const runStartRef = useRef<Date>(new Date())
  const runRecordedRef = useRef(false)
  const lastTurnRef = useRef<number>(0)

  // Meta store for progression
  const metaStore = useMetaStore()

  // Initialize game
  useEffect(() => {
    setState(createNewRun('warrior'))
  }, [])

  // Animate cards only when a new turn starts (not on every hand change)
  useEffect(() => {
    if (!handRef.current || !state?.combat) return

    const currentTurn = state.combat.turn
    if (currentTurn === lastTurnRef.current) return

    // New turn started - animate dealing cards
    lastTurnRef.current = currentTurn

    // Small delay to let React render the cards first
    requestAnimationFrame(() => {
      const cards = handRef.current?.querySelectorAll('.Card')
      if (cards && cards.length > 0) {
        gsap.effects.dealCards(cards, { stagger: 0.08 })
      }
    })
  }, [state?.combat?.turn, state?.combat?.hand.length])

  // Track health changes for combat numbers
  useEffect(() => {
    if (!state?.combat) return

    const newHealthMap: Record<string, number> = {
      player: state.combat.player.currentHealth,
    }
    state.combat.enemies.forEach((e) => {
      newHealthMap[e.id] = e.currentHealth
    })

    Object.entries(newHealthMap).forEach(([id, health]) => {
      const prevHealth = prevHealthRef.current[id]
      if (prevHealth !== undefined && prevHealth !== health) {
        const diff = health - prevHealth
        spawnCombatNumber(id, Math.abs(diff), diff < 0 ? 'damage' : 'heal')
      }
    })

    prevHealthRef.current = newHealthMap
  }, [state?.combat?.player.currentHealth, state?.combat?.enemies])

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

        return state.combat.player.energy >= def.energy
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
    const unlocks = checkUnlocks(runResult, metaStore)
    metaStore.recordRun(runResult)

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
  }, [state?.gamePhase, state?.combat?.phase, metaStore])

  const spawnCombatNumber = useCallback(
    (targetId: string, value: number, type: 'damage' | 'heal' | 'block') => {
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

  // ============================================
  // ROOM SELECTION
  // ============================================

  const handleSelectRoom = useCallback((roomUid: string) => {
    setState((prev) => {
      if (!prev) return prev

      const room = prev.roomChoices.find((r) => r.uid === roomUid)
      if (!room) return prev

      setCurrentRoomId(room.definitionId)

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

      if (def.target === 'self' || def.target === 'none') {
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
    prevHealthRef.current = {}
    runStartRef.current = new Date()
    runRecordedRef.current = false
    lastTurnRef.current = 0
    setCombatNumbers([])
    setPendingUnlocks([])
    setCurrentRoomId(null)
    setState(createNewRun('warrior'))
  }, [])

  const handleUnlocksDismissed = useCallback(() => {
    setPendingUnlocks([])
  }, [])

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
        onAddCard={handleAddCard}
        onSkip={handleSkipReward}
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
          <div className="Chip">
            <Icon icon="game-icons:card-pickup" className="text-gray-400" />
            <span>{combat.drawPile.length}</span>
          </div>
          <div className="Chip">
            <Icon icon="game-icons:card-discard" className="text-gray-400" />
            <span>{combat.discardPile.length}</span>
          </div>
        </div>
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
        />
      </div>

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
    </div>
  )
}

export default GameScreen
