// LARGE_FILE_OK: Active refactoring - extracting handlers to reduce size
import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { Hand } from '../Hand/Hand'
import { CardAnimationOverlay } from '../Hand/CardAnimationOverlay'
import { Field } from '../Field/Field'
import { CombatNumbers } from '../CombatNumbers/CombatNumbers'
import { RoomSelect } from '../DungeonDeck/RoomSelect'
import { RewardScreen } from './RewardScreen'
import { CampfireScreen } from './CampfireScreen'
import { TreasureScreen } from './TreasureScreen'
import { PhaseWrapper } from '../ScreenTransition'
import { UnlockNotification } from '../UnlockNotification/UnlockNotification'
import { ParticleEffects } from '../ParticleEffects/ParticleEffects'
import { emitParticle } from '../ParticleEffects/emitParticle'
import { CardPileModal, type PileType } from '../Modal/CardPileModal'
import { CardSelectionModal } from '../Modal/CardSelectionModal'
import { StatusSidebar } from '../StatusSidebar/StatusSidebar'
import type { RunState, ModifierInstance } from '../../types'
import { generateUid } from '../../lib/utils'
import { getCardDefinition } from '../../game/cards'
import { createNewRun } from '../../game/new-game'
import { getRoomDefinition } from '../../content/rooms'
import { handleDungeonBeaten } from '../../game/handlers/rooms'
import { getEnergyCostNumber } from '../../lib/effects'
import { gsap } from '../../lib/animations'
import { enableDragDrop, disableDragDrop } from '../../lib/dragdrop'
import { useMetaStore, checkUnlocks } from '../../stores/metaStore'
import { saveRun, getCustomDeckById, getDungeonDeck } from '../../stores/db'
import { useRunLockStore } from '../../stores/runLockStore'
import { useCampfireHandlers } from '../../hooks/useCampfireHandlers'
import { useTreasureHandlers } from '../../hooks/useTreasureHandlers'
import { useRewardHandlers } from '../../hooks/useRewardHandlers'
import { useSelectionHandlers } from '../../hooks/useSelectionHandlers'
import { useAnimationCoordinator } from '../../hooks/useAnimationCoordinator'
import { useVisualEventProcessor } from '../../hooks/useVisualEventProcessor'
import { useCombatActions } from '../../hooks/useCombatActions'
import { useRoomHandlers } from '../../hooks/useRoomHandlers'
import { lockInRun } from '../../game/run-lock'
import { resolveModifiers } from '../../game/modifier-resolver'
import { registerDebugAPI, unregisterDebugAPI } from '../../test/debug'

interface GameScreenProps {
  deckId?: string | null
  heroId?: string
  dungeonDeckId?: string
  selectedModifierIds?: string[]
  initialState?: RunState | null
  onReturnToMenu?: () => void
}

export function GameScreen({ deckId, heroId, dungeonDeckId, selectedModifierIds, initialState, onReturnToMenu }: GameScreenProps) {
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
  const roomHandlers = useRoomHandlers({
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

  // Get active modifiers from run-lock store for gold multiplier
  const lockedRun = useRunLockStore((s) => s.lockedRun)
  const goldMultiplier = lockedRun?.activeModifiers
    ? resolveModifiers(lockedRun.activeModifiers).goldMultiplier
    : 1

  // Extracted handlers with run-lock integration
  const getCurrentRoomUid = useCallback(() => state?.currentRoomUid, [state?.currentRoomUid])
  const campfireHandlers = useCampfireHandlers({
    setState,
    getCurrentRoomUid,
    onRoomComplete: roomHandlers.handleRoomComplete,
  })
  const treasureHandlers = useTreasureHandlers({
    setState,
    getCurrentRoomUid,
    onRoomComplete: roomHandlers.handleRoomComplete,
  })
  const rewardHandlers = useRewardHandlers({
    setState,
    getCurrentRoomUid,
    onRoomComplete: roomHandlers.handleRoomComplete,
    goldMultiplier,
  })
  const selectionHandlers = useSelectionHandlers(setState, state?.combat?.pendingSelection)

  // Initialize game
  useEffect(() => {
    // If restoring from a locked run, use the initial state directly
    if (initialState) {
      setState(initialState)
      return
    }

    async function init() {
      let customCardIds: string[] | undefined

      if (deckId) {
        const deck = await getCustomDeckById(deckId)
        if (deck) customCardIds = deck.cardIds
      }

      // Convert modifier IDs to instances BEFORE creating run (so effects apply)
      const modifierInstances: ModifierInstance[] = []
      const modifierIds = selectedModifierIds ?? []

      if (modifierIds.length > 0) {
        const { getModifierDefinition, consumeModifier } = useMetaStore.getState()

        for (const defId of modifierIds) {
          const definition = getModifierDefinition(defId)
          if (!definition) continue

          // Consume modifier from player's inventory
          consumeModifier(defId)

          // Create instance with proper usesRemaining for fragile modifiers
          const instance: ModifierInstance = {
            uid: generateUid(),
            definitionId: defId,
            appliedAt: Date.now(),
          }

          // Set usesRemaining for fragile modifiers
          if (definition.durability.type === 'fragile') {
            instance.usesRemaining = definition.durability.uses
          }

          modifierInstances.push(instance)
        }
      }

      // Create run WITH modifiers so effects are applied
      const newRun = await createNewRun(heroId ?? 'hero_ironclad', customCardIds, dungeonDeckId, modifierInstances)
      setState(newRun)

      // Lock the run for browser persistence
      lockInRun({
        dungeonDeckId: dungeonDeckId ?? 'random',
        dungeonDeck: newRun.dungeonDeck,
        modifiers: modifierInstances,
        player: {
          heroId: heroId ?? 'hero_ironclad',
          gold: newRun.gold,
          maxHealth: newRun.hero.maxHealth,
          currentHealth: newRun.hero.currentHealth,
          relics: newRun.relics,
          deck: newRun.deck.map(c => c.definitionId),
        },
      })
    }
    void init()
  }, [deckId, heroId, dungeonDeckId, selectedModifierIds, initialState])

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

    // Screen flash for turn transition (subtle green pulse on container)
    if (containerRef.current && currentTurn > 1) {
      gsap.fromTo(
        containerRef.current,
        { boxShadow: 'inset 0 0 100px 20px rgba(34, 197, 94, 0.3)' },
        { boxShadow: 'inset 0 0 0px 0px rgba(34, 197, 94, 0)', duration: 0.5, ease: 'power2.out' }
      )
    }

    // Energy orb refill glow with enhanced particles
    const energyOrb = queryContainer('[data-energy-orb]')
    if (energyOrb) {
      ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).energyPulse(energyOrb, { color: 'oklch(0.8 0.2 70)' })
      // Burst of energy particles
      emitParticle(energyOrb, 'energy')
      setTimeout(() => emitParticle(energyOrb, 'energy'), 50)
      setTimeout(() => emitParticle(energyOrb, 'energy'), 100)
      // Scale bounce for satisfying refill feel
      gsap.fromTo(energyOrb, { scale: 1.3 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
    }

    // Player card glow on turn start
    const playerCard = queryContainer('[data-entity="player"]')
    if (playerCard && currentTurn > 1) {
      ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).pulse(playerCard, { color: 'oklch(0.6 0.15 145)' })
    }

    // Staggered hand card glow on turn start
    if (currentTurn > 1) {
      const handCards = containerRef.current?.querySelectorAll('[data-hand-card]')
      handCards?.forEach((card, i) => {
        setTimeout(() => {
          gsap.fromTo(
            card,
            { boxShadow: '0 0 20px 5px rgba(34, 197, 94, 0.5)' },
            { boxShadow: '0 0 0px 0px rgba(34, 197, 94, 0)', duration: 0.4, ease: 'power2.out' }
          )
        }, i * 60)
      })
    }

    // Use setTimeout to ensure React has committed DOM changes for card dealing
    setTimeout(() => animateDealCards(), 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.combat?.turn, state?.combat?.hand.length, animateDealCards, queryContainer])

  // Visual cues when enemy turn starts
  useEffect(() => {
    if (!state?.combat || state.combat.phase !== 'enemyTurn') return

    // Threatening red screen tint
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { boxShadow: 'inset 0 0 150px 40px rgba(220, 38, 38, 0.4)' },
        { boxShadow: 'inset 0 0 80px 20px rgba(220, 38, 38, 0.15)', duration: 0.4, ease: 'power2.out' }
      )
    }

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

    // Clear any red tint from enemy turn
    if (containerRef.current) {
      gsap.to(containerRef.current, { boxShadow: 'inset 0 0 0px 0px rgba(0, 0, 0, 0)', duration: 0.3 })
    }

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

      // Screen shake for impact
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          x: '+=8', duration: 0.05, yoyo: true, repeat: 5, ease: 'power2.inOut',
          onComplete: () => { gsap.set(containerRef.current, { x: 0 }) }
        })
      }

      // Golden screen flash effect
      const flash = document.createElement('div')
      flash.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg, oklch(0.85 0.15 85), oklch(0.9 0.12 60));pointer-events:none;z-index:100'
      document.body.appendChild(flash)
      gsap.fromTo(flash, { opacity: 0.7 }, { opacity: 0, duration: 0.5, onComplete: () => flash.remove() })

      // Animate overlay in
      gsap.to(overlay, { opacity: 1, duration: 0.3, delay: 0.1 })
      gsap.to(title, { scale: 1, opacity: 1, duration: 0.6, delay: 0.25, ease: 'back.out(2)' })
      gsap.to(subtitle, { opacity: 1, y: 0, duration: 0.4, delay: 0.6 })

      // Victory explosion effect (golden particle burst)
      const effects = gsap.effects as { victoryExplosion?: (el: Element) => void }
      if (effects.victoryExplosion) {
        effects.victoryExplosion(overlay)
      }

      // Particle burst from center
      const rect = overlay.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const win = window as unknown as { spawnParticles?: (x: number, y: number, type: string) => void }
      if (win.spawnParticles) {
        // Staggered particle waves
        for (let wave = 0; wave < 3; wave++) {
          for (let i = 0; i < 6; i++) {
            setTimeout(() => {
              win.spawnParticles!(centerX + (Math.random() - 0.5) * 200, centerY + (Math.random() - 0.5) * 100, 'gold')
              win.spawnParticles!(centerX + (Math.random() - 0.5) * 150, centerY + (Math.random() - 0.5) * 80, 'heal')
              win.spawnParticles!(centerX + (Math.random() - 0.5) * 100, centerY + (Math.random() - 0.5) * 50, 'spark')
              win.spawnParticles!(centerX + (Math.random() - 0.5) * 180, centerY + (Math.random() - 0.5) * 90, 'energy')
            }, wave * 200 + i * 50)
          }
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
      <PhaseWrapper phase="roomSelect" className="h-screen">
        <RoomSelect
          choices={state.roomChoices}
          floor={state.floor}
          onSelectRoom={roomHandlers.handleSelectRoom}
        />
      </PhaseWrapper>
    )
  }

  // Reward phase
  if (state.gamePhase === 'reward') {
    return (
      <PhaseWrapper phase="reward" className="h-screen">
        <RewardScreen
          floor={state.floor}
          gold={state.gold}
          goldMultiplier={goldMultiplier}
          ownedRelicIds={state.relics.map((r) => r.definitionId)}
          onAddCard={rewardHandlers.handleAddCard}
          onAddRelic={rewardHandlers.handleAddRelic}
          onSkip={rewardHandlers.handleSkipReward}
        />
      </PhaseWrapper>
    )
  }

  // Campfire phase
  if (state.gamePhase === 'campfire') {
    return (
      <PhaseWrapper phase="campfire" className="h-screen">
        <CampfireScreen
          hero={state.hero}
          deck={state.deck}
          onRest={campfireHandlers.handleCampfireRest}
          onSmith={campfireHandlers.handleCampfireSmith}
          onSkip={campfireHandlers.handleCampfireSkip}
        />
      </PhaseWrapper>
    )
  }

  // Treasure phase
  if (state.gamePhase === 'treasure') {
    const isLargeTreasure = currentRoomId === 'treasure_large'
    return (
      <PhaseWrapper phase="treasure" className="h-screen">
        <TreasureScreen
          floor={state.floor}
          isLargeTreasure={isLargeTreasure}
          ownedRelicIds={state.relics.map((r) => r.definitionId)}
          onSelectRelic={treasureHandlers.handleTreasureSelectRelic}
          onSkip={treasureHandlers.handleTreasureSkip}
        />
      </PhaseWrapper>
    )
  }

  // Dungeon complete (boss defeated)
  if (state.gamePhase === 'dungeonComplete') {
    return (
      <PhaseWrapper phase="dungeonComplete">
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/20 to-warm-900">
          <UnlockNotification unlocks={pendingUnlocks} onComplete={roomHandlers.handleUnlocksDismissed} />
          <div className="text-center">
            <div className="text-6xl mb-4">👑</div>
            <h1 className="text-5xl font-bold text-energy mb-4">Dungeon Conquered!</h1>
            <p className="text-xl text-warm-300 mb-6">You have defeated the dungeon boss!</p>

            <div className="bg-warm-800/50 rounded-xl p-6 mb-8 border border-energy/30">
              <h2 className="text-2xl font-bold text-energy mb-4">Rewards</h2>
              <div className="flex items-center justify-center gap-2 text-3xl">
                <Icon icon="mdi:gold" className="text-energy" />
                <span className="text-energy font-bold">+{dungeonReward ?? 0}</span>
              </div>
              <p className="text-warm-400 mt-2">Total Gold: {state.gold}</p>
            </div>

            <div className="text-sm text-warm-500 mb-8 space-y-1">
              <p>Floors Cleared: {state.floor}</p>
              <p>Enemies Slain: {state.stats.enemiesKilled}</p>
              <p>Damage Dealt: {state.stats.damageDealt}</p>
            </div>

            <button
              onClick={roomHandlers.handleRestart}
              className="px-8 py-3 bg-energy text-black font-bold rounded-lg text-lg hover:brightness-110 transition"
            >
              Return to Menu
            </button>
          </div>
        </div>
      </PhaseWrapper>
    )
  }

  // Game over (defeat - player died)
  if (state.gamePhase === 'gameOver') {
    return (
      <PhaseWrapper phase="gameOver">
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-warm-900 to-warm-900">
          <UnlockNotification unlocks={pendingUnlocks} onComplete={roomHandlers.handleUnlocksDismissed} />
          <h1 className="text-5xl font-bold text-heal mb-4">Dungeon Cleared!</h1>
          <p className="text-xl text-warm-400 mb-2">You conquered all {state.floor} floors</p>
          <p className="text-lg text-energy mb-4">Final Gold: {state.gold}</p>
          <div className="text-sm text-warm-500 mb-8 space-y-1 text-center">
            <p>Enemies Slain: {state.stats.enemiesKilled}</p>
            <p>Damage Dealt: {state.stats.damageDealt}</p>
            <p>Cards Played: {state.stats.cardsPlayed}</p>
          </div>
          <button
            onClick={roomHandlers.handleRestart}
            className="px-8 py-3 bg-energy text-black font-bold rounded-lg text-lg hover:brightness-110 transition"
          >
            New Run
          </button>
        </div>
      </PhaseWrapper>
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
      <UnlockNotification unlocks={pendingUnlocks} onComplete={roomHandlers.handleUnlocksDismissed} />

      {/* Combat HUD - top-right consolidated info panel */}
      <div className="absolute top-4 right-4 z-10 CombatHUD">
        <button
          onClick={handleEndTurn}
          disabled={!isPlayerTurn || isAnimating}
          className="EndTurnBtn"
          data-end-turn
        >
          End Turn
        </button>

        {/* Row 1: Room info */}
        <div className="CombatHUD-row">
          <div className="HudStat">
            <Icon icon="game-icons:dungeon-gate" className="HudStat-icon text-warm-400" />
            <span className="HudStat-value">{currentRoom?.name ?? 'Unknown'}</span>
          </div>
          <div className="HudStat">
            <Icon icon="game-icons:stack" className="HudStat-icon text-warm-500" />
            <span className="HudStat-value">{deckRemaining}</span>
          </div>
        </div>

        {/* Row 2: Turn + Gold */}
        <div className="CombatHUD-row">
          <div className="HudStat">
            <Icon icon="game-icons:hourglass" className="HudStat-icon text-warm-400" />
            <span className="HudStat-value">{combat.turn}</span>
          </div>
          <div className="HudStat HudStat--gold">
            <Icon icon="game-icons:two-coins" className="HudStat-icon text-gold" />
            <span className="HudStat-value">{state.gold}</span>
          </div>
        </div>

        {/* Row 3: Deck piles */}
        <div className="CombatHUD-row">
          <div
            className="HudStat HudStat--clickable"
            data-deck-pile
            onClick={() => setPileModalOpen('draw')}
          >
            <Icon icon="game-icons:card-pickup" className="HudStat-icon text-warm-400" />
            <span className="HudStat-value">{combat.drawPile.length}</span>
          </div>
          <div
            className="HudStat HudStat--clickable"
            data-discard-pile
            onClick={() => setPileModalOpen('discard')}
          >
            <Icon icon="game-icons:card-discard" className="HudStat-icon text-warm-400" />
            <span className="HudStat-value">{combat.discardPile.length}</span>
          </div>
          {combat.exhaustPile.length > 0 && (
            <div
              className="HudStat HudStat--clickable"
              onClick={() => setPileModalOpen('exhaust')}
            >
              <Icon icon="game-icons:card-burn" className="HudStat-icon text-damage" />
              <span className="HudStat-value">{combat.exhaustPile.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status sidebar - relics & powers */}
      <StatusSidebar
        relics={state.relics}
        player={combat.player}
        enemies={combat.enemies}
        triggeredRelicId={triggeredRelicId ?? undefined}
      />

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
            <p className="text-warm-400">Proceeding to rewards...</p>
          </div>
        </div>
      )}

      {isDefeat && (
        <div ref={defeatRef} className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6 text-damage">Defeat</h2>
            <div className="defeat-content">
              <p className="text-warm-400 mb-2">You reached floor {state.floor}</p>
              <div className="text-sm text-warm-500 mb-6 space-y-1">
                <p>Enemies Slain: {state.stats.enemiesKilled}</p>
                <p>Damage Dealt: {state.stats.damageDealt}</p>
                <p>Cards Played: {state.stats.cardsPlayed}</p>
              </div>
              <button
                onClick={roomHandlers.handleRestart}
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
