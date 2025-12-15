import type { RunState } from '../../types'
import { RunBuilder, CombatBuilder } from '../factories'

// ============================================================================
// Pre-built Scenarios
// ============================================================================

export const scenarios = {
  /** Basic combat start - fresh turn with standard hand */
  combatStart: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withHand('strike', 'strike', 'strike', 'defend', 'defend')
      .withDrawPile('strike', 'strike', 'defend', 'defend', 'bash')
      .buildRun(),

  /** Mid-combat with some damage taken */
  midCombat: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withPlayerHealth(60, 80)
      .withPlayerEnergy(2)
      .onTurn(3)
      .withHand('strike', 'defend', 'bash')
      .withEnemyHealth(30)
      .buildRun(),

  /** Player at low health - danger scenario */
  lowHealth: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withPlayerHealth(15, 80)
      .withEnemyHealth(40)
      .withHand('defend', 'defend', 'strike')
      .buildRun(),

  /** Player has offensive powers active */
  buffedPlayer: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withPlayerPower('strength', 3)
      .withPlayerPower('dexterity', 2)
      .withHand('strike', 'strike', 'defend')
      .buildRun(),

  /** Enemy has debuffs applied */
  debuffedEnemy: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withEnemy({ withPowers: { vulnerable: 2, weak: 1 }, health: 50 })
      .withHand('strike', 'strike', 'strike')
      .buildRun(),

  /** Multiple enemies in combat */
  multiEnemy: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withEnemies([
        { health: 30, id: 'enemy_1' },
        { health: 25, id: 'enemy_2' },
        { health: 35, id: 'enemy_3' },
      ])
      .withHand('strike', 'cleave', 'defend')
      .buildRun(),

  /** Enemy nearly dead - for kill testing */
  nearlyDeadEnemy: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withEnemyHealth(3)
      .withHand('strike')
      .buildRun(),

  /** Player has block up */
  fortified: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withPlayerBlock(25)
      .withEnemy({ intent: { type: 'attack', value: 20 } })
      .buildRun(),

  /** Empty hand - for draw testing */
  emptyHand: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withHand()
      .withDrawPile('strike', 'strike', 'strike', 'defend', 'defend')
      .buildRun(),

  /** No energy - for energy management testing */
  exhausted: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withPlayerEnergy(0)
      .withHand('strike', 'strike', 'defend')
      .buildRun(),

  /** Player has poison */
  poisoned: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withPlayer({ withPowers: { poison: 5 } })
      .withDrawPile('strike', 'strike', 'strike', 'defend', 'defend')
      .buildRun(),

  /** One hit from winning */
  preVictory: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withEnemyHealth(1)
      .withHand('strike')
      .buildRun(),

  /** High energy available */
  highEnergy: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withPlayerEnergy(5, 5)
      .withHand('strike', 'strike', 'strike', 'bash', 'defend')
      .buildRun(),

  /** Full discard pile - for shuffle testing */
  fullDiscard: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withHand('strike')
      .withDrawPile()
      .withDiscardPile('strike', 'strike', 'defend', 'defend', 'bash')
      .buildRun(),

  /** Cards exhausted */
  withExhaust: (): RunState =>
    RunBuilder.new()
      .inCombat()
      .withHand('strike', 'defend')
      .withExhaustPile('bash', 'bash')
      .buildRun(),
} as const

// ============================================================================
// Scenario Loader
// ============================================================================

export type ScenarioName = keyof typeof scenarios

/**
 * Load a pre-built scenario by name
 * @example const state = scenario('lowHealth')
 */
export function scenario(name: ScenarioName): RunState {
  return scenarios[name]()
}

// Re-export builders for custom scenarios
export { RunBuilder, CombatBuilder }
