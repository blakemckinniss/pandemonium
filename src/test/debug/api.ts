import type { RunState, CombatState, GameAction, CardInstance } from '../../types'
import { applyAction } from '../../game/actions'
import { createRunState, createCombat, RunBuilder, CombatBuilder } from '../factories'
import { scenarios, type ScenarioName } from '../scenarios'

// ============================================================================
// Debug API Type Definition
// ============================================================================

export interface DebugAPI {
  // State access
  getState: () => RunState | null
  setState: (state: RunState) => void
  getCombat: () => CombatState | null

  // Scenarios
  scenario: (name: ScenarioName) => void
  scenarios: typeof scenarios

  // Factories (for custom state building)
  createRunState: typeof createRunState
  createCombat: typeof createCombat
  RunBuilder: typeof RunBuilder
  CombatBuilder: typeof CombatBuilder

  // Actions
  action: (action: GameAction) => void
  playCard: (cardUidOrId: string, targetId?: string) => void
  endTurn: () => void
  damage: (targetId: string, amount: number) => void
  heal: (targetId: string, amount: number) => void
  addBlock: (targetId: string, amount: number) => void
  applyPower: (targetId: string, powerId: string, amount: number) => void
  drawCards: (amount: number) => void

  // Shortcuts
  killEnemy: (enemyId?: string) => void
  killAllEnemies: () => void
  killPlayer: () => void
  setHealth: (entityId: string, health: number) => void
  setEnergy: (energy: number) => void
  giveCard: (cardId: string, upgraded?: boolean) => void
  removeCard: (cardUidOrId: string) => void

  // Inspection
  player: () => CombatState['player'] | null
  enemies: () => CombatState['enemies']
  hand: () => CardInstance[]

  // Meta
  version: string
  help: () => void
}

// ============================================================================
// Debug API Implementation
// ============================================================================

type SetStateFn = (updater: RunState | ((prev: RunState | null) => RunState | null)) => void

export function createDebugAPI(
  getState: () => RunState | null,
  setState: SetStateFn
): DebugAPI {
  const applyToState = (action: GameAction) => {
    setState(prev => (prev ? applyAction(prev, action) : prev))
  }

  const api: DebugAPI = {
    // ---- State Access ----
    getState,
    setState: (state) => setState(state),
    getCombat: () => getState()?.combat ?? null,

    // ---- Scenarios ----
    scenario: (name) => {
      const scenarioFn = scenarios[name]
      if (!scenarioFn) {
        console.error(`Unknown scenario: ${name}. Available:`, Object.keys(scenarios))
        return
      }
      setState(scenarioFn())
      console.log(`Loaded scenario: ${name}`)
    },
    scenarios,

    // ---- Factories ----
    createRunState,
    createCombat,
    RunBuilder,
    CombatBuilder,

    // ---- Actions ----
    action: applyToState,

    playCard: (cardUidOrId, targetId) => {
      const state = getState()
      const card = state?.combat?.hand.find(
        c => c.uid === cardUidOrId || c.definitionId === cardUidOrId
      )
      if (card) {
        applyToState({ type: 'playCard', cardUid: card.uid, targetId })
        console.log(`Played: ${card.definitionId}${targetId ? ` → ${targetId}` : ''}`)
      } else {
        console.error(`Card not found in hand: ${cardUidOrId}`)
      }
    },

    endTurn: () => {
      applyToState({ type: 'endTurn' })
      const state = getState()
      state?.combat?.enemies.forEach(e => {
        applyToState({ type: 'enemyAction', enemyId: e.id })
      })
      if (state?.combat?.phase !== 'victory' && state?.combat?.phase !== 'defeat') {
        applyToState({ type: 'startTurn' })
      }
      console.log(`Turn ended. Now turn ${getState()?.combat?.turn}`)
    },

    damage: (targetId, amount) => {
      applyToState({ type: 'damage', targetId, amount })
      console.log(`Dealt ${amount} damage to ${targetId}`)
    },

    heal: (targetId, amount) => {
      applyToState({ type: 'heal', targetId, amount })
      console.log(`Healed ${targetId} for ${amount}`)
    },

    addBlock: (targetId, amount) => {
      applyToState({ type: 'addBlock', targetId, amount })
      console.log(`Added ${amount} block to ${targetId}`)
    },

    applyPower: (targetId, powerId, amount) => {
      applyToState({ type: 'applyPower', targetId, powerId, amount })
      console.log(`Applied ${amount} ${powerId} to ${targetId}`)
    },

    drawCards: (amount) => {
      applyToState({ type: 'drawCards', amount })
      console.log(`Drew ${amount} cards`)
    },

    // ---- Shortcuts ----
    killEnemy: (enemyId) => {
      const state = getState()
      const target = enemyId ?? state?.combat?.enemies[0]?.id
      if (target) {
        const enemy = state?.combat?.enemies.find(e => e.id === target)
        if (enemy) {
          applyToState({ type: 'damage', targetId: target, amount: enemy.currentHealth + 100 })
          console.log(`Killed ${target}`)
        }
      }
    },

    killAllEnemies: () => {
      const state = getState()
      state?.combat?.enemies.forEach(e => {
        applyToState({ type: 'damage', targetId: e.id, amount: e.currentHealth + 100 })
      })
      console.log('Killed all enemies')
    },

    killPlayer: () => {
      const state = getState()
      if (state?.combat) {
        applyToState({ type: 'damage', targetId: 'player', amount: 999 })
        console.log('Player killed')
      }
    },

    setHealth: (entityId, health) => {
      setState(prev => {
        if (!prev?.combat) return prev
        if (entityId === 'player') {
          return {
            ...prev,
            combat: {
              ...prev.combat,
              player: { ...prev.combat.player, currentHealth: health },
            },
          }
        }
        return {
          ...prev,
          combat: {
            ...prev.combat,
            enemies: prev.combat.enemies.map(e =>
              e.id === entityId ? { ...e, currentHealth: health } : e
            ),
          },
        }
      })
      console.log(`Set ${entityId} health to ${health}`)
    },

    setEnergy: (energy) => {
      setState(prev => {
        if (!prev?.combat) return prev
        return {
          ...prev,
          combat: {
            ...prev.combat,
            player: { ...prev.combat.player, energy },
          },
        }
      })
      console.log(`Set energy to ${energy}`)
    },

    giveCard: (cardId, upgraded = false) => {
      setState(prev => {
        if (!prev?.combat) return prev
        const newCard: CardInstance = {
          uid: `debug_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          definitionId: cardId,
          upgraded,
        }
        return {
          ...prev,
          combat: {
            ...prev.combat,
            hand: [...prev.combat.hand, newCard],
          },
        }
      })
      console.log(`Added ${cardId}${upgraded ? '+' : ''} to hand`)
    },

    removeCard: (cardUidOrId) => {
      setState(prev => {
        if (!prev?.combat) return prev
        const hand = prev.combat.hand.filter(
          c => c.uid !== cardUidOrId && c.definitionId !== cardUidOrId
        )
        return {
          ...prev,
          combat: {
            ...prev.combat,
            hand,
          },
        }
      })
      console.log(`Removed ${cardUidOrId} from hand`)
    },

    // ---- Inspection ----
    player: () => getState()?.combat?.player ?? null,
    enemies: () => getState()?.combat?.enemies ?? [],
    hand: () => getState()?.combat?.hand ?? [],

    // ---- Meta ----
    version: '1.0.0',
    help: () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              PANDEMONIUM DEBUG API v1.0.0                    ║
╠═══════════════════════════════════════════════════════════════╣
║ STATE ACCESS                                                  ║
║   __GAME__.getState()         Get current game state          ║
║   __GAME__.getCombat()        Get combat state                ║
║   __GAME__.setState(state)    Replace entire state            ║
╠═══════════════════════════════════════════════════════════════╣
║ SCENARIOS                                                     ║
║   __GAME__.scenario('lowHealth')    Load preset scenario      ║
║   __GAME__.scenarios                List all scenarios        ║
║                                                               ║
║   Available: ${Object.keys(scenarios).join(', ')}
╠═══════════════════════════════════════════════════════════════╣
║ ACTIONS                                                       ║
║   __GAME__.playCard('strike', 'enemy_1')                      ║
║   __GAME__.endTurn()                                          ║
║   __GAME__.damage('enemy_1', 10)                              ║
║   __GAME__.heal('player', 20)                                 ║
║   __GAME__.addBlock('player', 15)                             ║
║   __GAME__.applyPower('player', 'strength', 3)                ║
║   __GAME__.drawCards(3)                                       ║
╠═══════════════════════════════════════════════════════════════╣
║ SHORTCUTS                                                     ║
║   __GAME__.killEnemy()        Kill first enemy                ║
║   __GAME__.killEnemy('enemy_2')                               ║
║   __GAME__.killAllEnemies()   Win combat instantly            ║
║   __GAME__.killPlayer()       Trigger defeat                  ║
║   __GAME__.setHealth('player', 50)                            ║
║   __GAME__.setEnergy(5)                                       ║
║   __GAME__.giveCard('bash')   Add card to hand                ║
║   __GAME__.giveCard('bash', true)  Add upgraded               ║
╠═══════════════════════════════════════════════════════════════╣
║ INSPECTION                                                    ║
║   __GAME__.player()           Player entity                   ║
║   __GAME__.enemies()          All enemies                     ║
║   __GAME__.hand()             Cards in hand                   ║
╠═══════════════════════════════════════════════════════════════╣
║ CUSTOM STATE (Advanced)                                       ║
║   __GAME__.setState(                                          ║
║     __GAME__.RunBuilder.new()                                 ║
║       .inCombat()                                             ║
║         .withPlayerHealth(1)                                  ║
║         .withPlayerPower('strength', 20)                      ║
║         .withEnemyHealth(100)                                 ║
║         .withHand('strike', 'strike', 'bash')                 ║
║         .buildRun()                                           ║
║   )                                                           ║
╚═══════════════════════════════════════════════════════════════╝
`)
    },
  }

  return api
}

// ============================================================================
// Global Type Declaration
// ============================================================================

declare global {
  interface Window {
    __GAME__?: DebugAPI
  }
}
