// LARGE_FILE_OK: Active refactoring - extracting handlers to reduce size
import { useState, useEffect, useRef } from 'react'
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
import { emitParticle } from '../ParticleEffects/emitParticle'
import { CardPileModal, type PileType } from '../Modal/CardPileModal'
import { CardSelectionModal } from '../Modal/CardSelectionModal'
import { RelicBar } from '../RelicBar/RelicBar'
import type { RunState } from '../../types'
import { getCardDefinition } from '../../game/cards'
import { createNewRun } from '../../game/new-game'
import { getRoomDefinition } from '../../content/rooms'
import { handleDungeonBeaten } from '../../game/handlers/rooms'
import { getEnergyCostNumber } from '../../lib/effects'
import { gsap } from '../../lib/animations'
import { enableDragDrop, disableDragDrop } from '../../lib/dragdrop'
import { useMetaStore, checkUnlocks } from '../../stores/metaStore'
import { saveRun, getCustomDeckById, getDungeonDeck } from '../../stores/db'
import { useCampfireHandlers } from '../../hooks/useCampfireHandlers'
import { useTreasureHandlers } from '../../hooks/useTreasureHandlers'
import { useRewardHandlers } from '../../hooks/useRewardHandlers'
import { useSelectionHandlers } from '../../hooks/useSelectionHandlers'
import { useAnimationCoordinator } from '../../hooks/useAnimationCoordinator'
import { useVisualEventProcessor } from '../../hooks/useVisualEventProcessor'
import { useCombatActions } from '../../hooks/useCombatActions'
import { useRoomHandlers } from '../../hooks/useRoomHandlers'
import { registerDebugAPI, unregisterDebugAPI } from '../../test/debug'

interface GameScreenProps {
  deckId?: string | null
  heroId?: string
  dungeonDeckId?: string
  onReturnToMenu?: () => void
}

export function GameScreen({ deckId, heroId, dungeonDeckId, onReturnToMenu }: GameScreenProps) {
  const [state, setState] = useState<RunState | null>(null)
  const [pendingUnlocks, setPendingUnlocks] = useState<string[]>([])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [pileModalOpen, setPileModalOpen] = useState<PileType | null>(null)
  const [triggeredRelicId, setTriggeredRelicId] = useState<string | null>(null)
  const [dungeonReward, setDungeonReward] = useState<number | null>(null)
  const prevHealthRef = useRef<Record<string, number>>({})
  const victoryRef = useRef<HTMLDivElement>(null)
  const defeatRef = useRef<HTMLDivElement>(null)

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
    resetVisuals,
  } = useVisualEventProcessor({
    combat: state?.combat ?? null,
    queryContainer,
    queryHand,
    containerRef,
    setState,
    setTriggeredRelicId,
  })

  // Combat actions (play card, end turn, hero abilities)
  const { handleDragPlayCard, handleClickPlayCard, handleEndTurn, handleUseActivated, handleUseUltimate } = useCombatActions({
    combat: state?.combat ?? null,
    isAnimating,
    setState,
    animateDiscardHand,
  })

  // Room selection & restart
  const { handleSelectRoom, handleRestart, handleUnlocksDismissed } = useRoomHandlers({
    setState,
    setCurrentRoomId,
    setPendingUnlocks,
    prevHealthRef,
    runStartRef,
    runRecordedRef,
    lastTurnRef,
    resetVisuals,
    onReturnToMenu,
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

      setState(await createNewRun(heroId ?? 'hero_ironclad', customCardIds, dungeonDeckId))
    }
    void init()
  }, [deckId, heroId, dungeonDeckId])

  // Register debug API in development
  useEffect(() => {
    registerDebugAPI(() => state, setState)
    return () => unregisterDebugAPI()
  }, [state])

  // Animate cards and visual cues when a new turn starts
  useEffect(() => {
    if (!state?.combat) return

    const currentTurn = state.combat.turn
    if (currentTurn === lastTurnRef.current) return

    // New turn started
    lastTurnRef.current = currentTurn

    // Energy orb refill glow
    const energyOrb = queryContainer('[data-energy-orb]')
    if (energyOrb) {
      ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).energyPulse(energyOrb, { color: 'oklch(0.8 0.2 70)' })
      emitParticle(energyOrb, 'energy')
    }

    // Player card glow on turn start
    const playerCard = queryContainer('[data-entity="player"]')
    if (playerCard && currentTurn > 1) {
      ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).pulse(playerCard, { color: 'oklch(0.6 0.15 145)' })
    }

    // Use setTimeout to ensure React has committed DOM changes for card dealing
    setTimeout(() => animateDealCards(), 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.combat?.turn, state?.combat?.hand.length, animateDealCards, queryContainer])

  // Visual cues when enemy turn starts
  useEffect(() => {
    if (!state?.combat || state.combat.phase !== 'enemyTurn') return

    // Pulse all enemy cards to show they're about to act
    const enemyCards = containerRef.current?.querySelectorAll('[data-entity="enemy"]')
    enemyCards?.forEach((enemy, i) => {
      // Stagger the enemy pulses slightly
      setTimeout(() => {
        ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).pulse(enemy, { color: 'oklch(0.6 0.2 25)' }) // Red/orange warning
        emitParticle(enemy, 'attack')
      }, i * 100)
    })

    // Dim the end turn button during enemy turn
    const endTurnBtn = containerRef.current?.querySelector('[data-end-turn]')
    if (endTurnBtn) {
      gsap.to(endTurnBtn, { opacity: 0.5, duration: 0.2 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.combat?.phase])

  // Restore end turn button when player turn starts
  useEffect(() => {
    if (!state?.combat || state.combat.phase !== 'playerTurn') return

    const endTurnBtn = containerRef.current?.querySelector('[data-end-turn]')
    if (endTurnBtn) {
      gsap.to(endTurnBtn, { opacity: 1, duration: 0.2 })
      ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).pulse(endTurnBtn, { color: 'oklch(0.7 0.15 145)' }) // Green ready pulse
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.combat?.phase])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isAnimating])

  // Handle victory transition to reward or dungeon complete
  useEffect(() => {
    if (state?.combat?.phase === 'victory') {
      // Check if this was a boss room (dungeon complete)
      const isBoss = currentRoomId?.includes('boss') ?? false

      setTimeout(async () => {
        if (isBoss && state) {
          // Boss defeated - dungeon complete!
          const dungeon = state.dungeonDeckId ? await getDungeonDeck(state.dungeonDeckId) : undefined
          const difficulty = dungeon?.difficulty ?? 1
          const { goldReward } = await handleDungeonBeaten(state, difficulty)
          setDungeonReward(goldReward)
          setState((prev) => {
            if (!prev) return prev
            return { ...prev, gamePhase: 'dungeonComplete', combat: null, gold: prev.gold + goldReward }
          })
        } else {
          // Normal combat - go to reward screen
          setState((prev) => {
            if (!prev) return prev
            return { ...prev, gamePhase: 'reward', combat: null }
          })
        }
      }, 1500)
    }
  }, [state?.combat?.phase, currentRoomId, state])

  // Victory animation
  useEffect(() => {
    if (state?.combat?.phase === 'victory' && victoryRef.current) {
      const overlay = victoryRef.current
      const title = overlay.querySelector('h2')
      const subtitle = overlay.querySelector('p')

      // Initial state
      gsap.set(overlay, { opacity: 0 })
      gsap.set(title, { scale: 0, opacity: 0 })
      gsap.set(subtitle, { opacity: 0, y: 20 })

      // Animate in
      gsap.to(overlay, { opacity: 1, duration: 0.3 })
      gsap.to(title, { scale: 1, opacity: 1, duration: 0.5, delay: 0.2, ease: 'back.out(1.7)' })
      gsap.to(subtitle, { opacity: 1, y: 0, duration: 0.4, delay: 0.5 })

      // Screen flash effect
      const flash = document.createElement('div')
      flash.style.cssText = 'position:fixed;inset:0;background:white;pointer-events:none;z-index:100'
      document.body.appendChild(flash)
      gsap.fromTo(flash, { opacity: 0.6 }, { opacity: 0, duration: 0.4, onComplete: () => flash.remove() })

      // Particle burst from center
      const rect = overlay.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const win = window as unknown as { spawnParticles?: (x: number, y: number, type: string) => void }
      if (win.spawnParticles) {
        // Initial burst
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            win.spawnParticles!(centerX + (Math.random() - 0.5) * 150, centerY + (Math.random() - 0.5) * 80, 'gold')
            win.spawnParticles!(centerX + (Math.random() - 0.5) * 150, centerY + (Math.random() - 0.5) * 80, 'heal')
            win.spawnParticles!(centerX + (Math.random() - 0.5) * 100, centerY + (Math.random() - 0.5) * 50, 'spark')
          }, i * 80)
        }
      }
    }
  }, [state?.combat?.phase])

  // Defeat animation
  useEffect(() => {
    if (state?.combat?.phase === 'defeat' && defeatRef.current) {
      const overlay = defeatRef.current
      const title = overlay.querySelector('h2')
      const content = overlay.querySelector('.defeat-content')

      // Initial state
      gsap.set(overlay, { opacity: 0 })
      gsap.set(title, { opacity: 0, y: -30 })
      if (content) gsap.set(content, { opacity: 0, y: 20 })

      // Animate in with shake
      gsap.to(overlay, { opacity: 1, duration: 0.4 })
      gsap.to(title, { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' })
      if (content) gsap.to(content, { opacity: 1, y: 0, duration: 0.5, delay: 0.5 })

      // Screen shake
      if (containerRef.current) {
        ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).shake(containerRef.current, { intensity: 15 })
      }

      // Red vignette flash
      const vignette = document.createElement('div')
      vignette.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99;box-shadow:inset 0 0 150px 50px rgba(180,0,0,0.8)'
      document.body.appendChild(vignette)
      gsap.fromTo(vignette, { opacity: 0.8 }, { opacity: 0, duration: 0.8, onComplete: () => vignette.remove() })

      // Dark/explosion particles
      const rect = overlay.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const win = window as unknown as { spawnParticles?: (x: number, y: number, type: string) => void }
      if (win.spawnParticles) {
        // Explosion burst
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            win.spawnParticles!(centerX + (Math.random() - 0.5) * 120, centerY + (Math.random() - 0.5) * 60, 'explosion')
            win.spawnParticles!(centerX + (Math.random() - 0.5) * 80, centerY, 'banish')
          }, i * 100)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      heroId: state.hero.heroCardId ?? state.hero.id ?? 'unknown',
    }

    // Record in meta store and check unlocks
    const store = useMetaStore.getState()
    const unlocks = checkUnlocks(runResult, store)
    store.recordRun(runResult)

    if (unlocks.length > 0) {
      setPendingUnlocks(unlocks)
    }

    // Save to IndexedDB
    void saveRun({
      startedAt: runStartRef.current,
      endedAt: new Date(),
      heroId: state.hero.heroCardId ?? state.hero.id ?? 'unknown',
      won: isWin,
      floor: state.floor,
      gold: state.gold,
      enemiesKilled: state.stats.enemiesKilled,
      cardsPlayed: state.stats.cardsPlayed,
      damageDealt: state.stats.damageDealt,
      damageTaken: state.stats.damageTaken,
      finalDeck: state.deck.map((c) => c.definitionId),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.gamePhase, state?.combat?.phase])

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

  // Dungeon complete (boss defeated)
  if (state.gamePhase === 'dungeonComplete') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/20 to-gray-950">
        <UnlockNotification unlocks={pendingUnlocks} onComplete={handleUnlocksDismissed} />
        <div className="text-center">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-5xl font-bold text-energy mb-4">Dungeon Conquered!</h1>
          <p className="text-xl text-gray-300 mb-6">You have defeated the dungeon boss!</p>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-energy/30">
            <h2 className="text-2xl font-bold text-energy mb-4">Rewards</h2>
            <div className="flex items-center justify-center gap-2 text-3xl">
              <Icon icon="mdi:gold" className="text-energy" />
              <span className="text-energy font-bold">+{dungeonReward ?? 0}</span>
            </div>
            <p className="text-gray-400 mt-2">Total Gold: {state.gold}</p>
          </div>

          <div className="text-sm text-gray-500 mb-8 space-y-1">
            <p>Floors Cleared: {state.floor}</p>
            <p>Enemies Slain: {state.stats.enemiesKilled}</p>
            <p>Damage Dealt: {state.stats.damageDealt}</p>
          </div>

          <button
            onClick={handleRestart}
            className="px-8 py-3 bg-energy text-black font-bold rounded-lg text-lg hover:brightness-110 transition"
          >
            Return to Menu
          </button>
        </div>
      </div>
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
          data-end-turn
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
      <div className="flex-1 flex flex-col justify-center items-center overflow-visible">
        <Field
          player={combat.player}
          enemies={combat.enemies}
          onUseActivated={handleUseActivated}
          onUseUltimate={handleUseUltimate}
        />
      </div>

      {/* Hand area - fixed height to prevent layout shift during discard */}
      <div ref={handRef} className="pb-4 min-h-[280px]">
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
        <div ref={victoryRef} className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-4 text-heal">Victory!</h2>
            <p className="text-gray-400">Proceeding to rewards...</p>
          </div>
        </div>
      )}

      {isDefeat && (
        <div ref={defeatRef} className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6 text-damage">Defeat</h2>
            <div className="defeat-content">
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
