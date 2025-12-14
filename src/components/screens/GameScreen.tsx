// LARGE_FILE_OK: Active refactoring - extracting handlers to reduce size
import { useState, useCallback, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Hand } from '../Hand/Hand'
import { CardAnimationOverlay } from '../Hand/CardAnimationOverlay'
import { Field } from '../Field/Field'
import { CombatNumbers } from '../CombatNumbers/CombatNumbers'
import { RoomSelect } from '../DungeonDeck/RoomSelect'
import { RewardScreen } from './RewardScreen'
import { CampfireScreen } from './CampfireScreen'
import { TreasureScreen } from './TreasureScreen'
import { UnlockNotification } from '../UnlockNotification/UnlockNotification'
import { ParticleEffects } from '../ParticleEffects/ParticleEffects'
import { CardPileModal, type PileType } from '../Modal/CardPileModal'
import { CardSelectionModal } from '../Modal/CardSelectionModal'
import { RelicBar } from '../RelicBar/RelicBar'
import type { RunState } from '../../types'
import { applyAction } from '../../game/actions'
import { createNewRun, createEnemiesFromRoom } from '../../game/new-game'
import { getCardDefinition } from '../../game/cards'
import { getEnergyCostNumber } from '../../lib/effects'
import { getRoomDefinition } from '../../content/rooms'
import { enableDragDrop, disableDragDrop } from '../../lib/dragdrop'
import { useMetaStore, checkUnlocks } from '../../stores/metaStore'
import { saveRun, getCustomDeckById } from '../../stores/db'
import { useCampfireHandlers } from '../../hooks/useCampfireHandlers'
import { useTreasureHandlers } from '../../hooks/useTreasureHandlers'
import { useRewardHandlers } from '../../hooks/useRewardHandlers'
import { useSelectionHandlers } from '../../hooks/useSelectionHandlers'
import { useAnimationCoordinator } from '../../hooks/useAnimationCoordinator'
import { useVisualEventProcessor } from '../../hooks/useVisualEventProcessor'

interface GameScreenProps {
  deckId?: string | null
  onReturnToMenu?: () => void
}

export function GameScreen({ deckId, onReturnToMenu }: GameScreenProps) {
  const [state, setState] = useState<RunState | null>(null)
  const [pendingUnlocks, setPendingUnlocks] = useState<string[]>([])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [pileModalOpen, setPileModalOpen] = useState<PileType | null>(null)
  const [triggeredRelicId, setTriggeredRelicId] = useState<string | null>(null)
  const prevHealthRef = useRef<Record<string, number>>({})

  // Animation coordination (refs + isAnimating state)
  const { isAnimating, containerRef, handRef, animateDiscardHand, animateDealCards, queryContainer, queryHand } = useAnimationCoordinator()
  const runStartRef = useRef<Date>(new Date())
  const runRecordedRef = useRef(false)

  // Visual event processor (combat numbers, pending animations, visual queue handling)
  const {
    combatNumbers,
    pendingAnimations,
    removeCombatNumber,
    handleAnimationComplete,
    handleCardPositionsUpdate,
    lastTurnRef,
  } = useVisualEventProcessor({
    combat: state?.combat ?? null,
    queryContainer,
    queryHand,
    containerRef,
    setState,
    setTriggeredRelicId,
  })

  // Extracted handlers
  const campfireHandlers = useCampfireHandlers(setState)
  const treasureHandlers = useTreasureHandlers(setState)
  const rewardHandlers = useRewardHandlers(setState)
  const selectionHandlers = useSelectionHandlers(setState, state?.combat?.pendingSelection)

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
    if (!state?.combat) return

    const currentTurn = state.combat.turn
    if (currentTurn === lastTurnRef.current) return

    // New turn started - animate dealing cards
    lastTurnRef.current = currentTurn

    // Use setTimeout to ensure React has committed DOM changes
    setTimeout(() => animateDealCards(), 50)
  }, [state?.combat?.turn, state?.combat?.hand.length, animateDealCards])

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

    const processEndTurn = () => {
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
      }, 600)
    }

    animateDiscardHand(processEndTurn)
  }, [state, isAnimating, animateDiscardHand])

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
        onAddCard={rewardHandlers.handleAddCard}
        onAddRelic={rewardHandlers.handleAddRelic}
        onSkip={rewardHandlers.handleSkipReward}
      />
    )
  }

  // Campfire phase
  if (state.gamePhase === 'campfire') {
    return (
      <CampfireScreen
        hero={state.hero}
        deck={state.deck}
        onRest={campfireHandlers.handleCampfireRest}
        onSmith={campfireHandlers.handleCampfireSmith}
        onSkip={campfireHandlers.handleCampfireSkip}
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
        onSelectRelic={treasureHandlers.handleTreasureSelectRelic}
        onSkip={treasureHandlers.handleTreasureSkip}
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
          onClose={selectionHandlers.handleSelectionClose}
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
          onConfirm={selectionHandlers.handleSelectionConfirm}
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
