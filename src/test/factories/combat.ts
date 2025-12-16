import type { CombatState, CardInstance } from '../../types'
import { createPlayer, createEnemy, createEnemies, type PlayerOptions, type EnemyOptions } from './entities'
import { createDeck, createHand, DECKS } from './cards'

// ============================================================================
// Combat Factory
// ============================================================================

export interface CombatOptions extends Partial<CombatState> {
  /** Player configuration shortcut */
  playerOptions?: PlayerOptions
  /** Single enemy or array of enemy configs */
  enemyOptions?: EnemyOptions | EnemyOptions[]
  /** Create N identical enemies */
  enemyCount?: number
  /** Card IDs for hand */
  handCards?: string[]
  /** Card IDs for draw pile */
  drawCards?: string[]
  /** Card IDs for discard pile */
  discardCards?: string[]
  /** Card IDs for exhaust pile */
  exhaustCards?: string[]
}

export function createCombat(options: CombatOptions = {}): CombatState {
  const {
    playerOptions,
    enemyOptions,
    enemyCount,
    handCards,
    drawCards,
    discardCards,
    exhaustCards,
    ...overrides
  } = options

  // Build player
  const player = overrides.player ?? createPlayer(playerOptions)

  // Build enemies
  let enemies = overrides.enemies
  if (!enemies) {
    if (Array.isArray(enemyOptions)) {
      enemies = enemyOptions.map((opts, i) => createEnemy({ ...opts, index: i + 1, id: opts.id ?? `enemy_${i + 1}` }))
    } else if (enemyOptions) {
      enemies = [createEnemy({ ...enemyOptions, id: enemyOptions.id ?? 'enemy_1' })]
    } else if (enemyCount !== undefined) {
      enemies = createEnemies(enemyCount)
    } else {
      enemies = [createEnemy({ id: 'enemy_1' })]
    }
  }

  // Build card piles
  const hand = overrides.hand ?? (handCards ? createHand(handCards) : [])
  const drawPile = overrides.drawPile ?? (drawCards ? createDeck(drawCards) : [])
  const discardPile = overrides.discardPile ?? (discardCards ? createDeck(discardCards) : [])
  const exhaustPile = overrides.exhaustPile ?? (exhaustCards ? createDeck(exhaustCards) : [])

  return {
    phase: 'playerTurn',
    turn: 1,
    player,
    enemies,
    hand,
    drawPile,
    discardPile,
    exhaustPile,
    cardsPlayedThisTurn: 0,
    visualQueue: [],
    ...overrides,
  }
}

// ============================================================================
// Combat Builder (Fluent API)
// ============================================================================

export class CombatBuilder {
  private options: CombatOptions = {}

  static new(): CombatBuilder {
    return new CombatBuilder()
  }

  // ---- Player Configuration ----

  withPlayer(options: PlayerOptions): this {
    this.options.playerOptions = { ...this.options.playerOptions, ...options }
    return this
  }

  withPlayerHealth(current: number, max?: number): this {
    this.options.playerOptions = {
      ...this.options.playerOptions,
      currentHealth: current,
      maxHealth: max ?? current,
    }
    return this
  }

  withPlayerEnergy(energy: number, max?: number): this {
    this.options.playerOptions = {
      ...this.options.playerOptions,
      energy,
      maxEnergy: max ?? energy,
    }
    return this
  }

  withPlayerBlock(block: number): this {
    this.options.playerOptions = { ...this.options.playerOptions, block }
    return this
  }

  withPlayerBarrier(barrier: number): this {
    this.options.playerOptions = { ...this.options.playerOptions, barrier }
    return this
  }

  withPlayerPower(powerId: string, amount: number): this {
    const existing = this.options.playerOptions?.withPowers ?? {}
    this.options.playerOptions = {
      ...this.options.playerOptions,
      withPowers: { ...existing, [powerId]: amount },
    }
    return this
  }

  // ---- Enemy Configuration ----

  withEnemy(options?: EnemyOptions): this {
    this.options.enemyOptions = { ...options, id: options?.id ?? 'enemy_1' }
    return this
  }

  withEnemies(optionsArray: EnemyOptions[]): this {
    this.options.enemyOptions = optionsArray.map((opts, i) => ({
      ...opts,
      id: opts.id ?? `enemy_${i + 1}`,
    }))
    return this
  }

  withEnemyCount(count: number): this {
    this.options.enemyCount = count
    return this
  }

  withEnemyHealth(health: number): this {
    this.options.enemyOptions = { health, id: 'enemy_1' }
    return this
  }

  withEnemyBlock(block: number): this {
    const existing = this.options.enemyOptions
    if (Array.isArray(existing)) {
      this.options.enemyOptions = existing.map(e => ({ ...e, block }))
    } else {
      this.options.enemyOptions = { ...existing, block, id: 'enemy_1' }
    }
    return this
  }

  withEnemyPower(powerId: string, amount: number): this {
    const existing = this.options.enemyOptions
    if (Array.isArray(existing)) {
      this.options.enemyOptions = existing.map(e => ({
        ...e,
        withPowers: { ...(e.withPowers ?? {}), [powerId]: amount },
      }))
    } else {
      this.options.enemyOptions = {
        ...existing,
        id: 'enemy_1',
        withPowers: { ...(existing?.withPowers ?? {}), [powerId]: amount },
      }
    }
    return this
  }

  // ---- Card Pile Configuration ----

  withHand(...cardIds: string[]): this {
    this.options.handCards = cardIds
    return this
  }

  withDrawPile(...cardIds: string[]): this {
    this.options.drawCards = cardIds
    return this
  }

  withDiscardPile(...cardIds: string[]): this {
    this.options.discardCards = cardIds
    return this
  }

  withExhaustPile(...cardIds: string[]): this {
    this.options.exhaustCards = cardIds
    return this
  }

  withDeck(deckName: keyof typeof DECKS, ...args: number[]): this {
    const deckFn = DECKS[deckName] as (...args: number[]) => CardInstance[]
    this.options.drawPile = deckFn(...args)
    return this
  }

  // ---- Turn/Phase Configuration ----

  onTurn(turn: number): this {
    this.options.turn = turn
    return this
  }

  inPhase(phase: CombatState['phase']): this {
    this.options.phase = phase
    return this
  }

  inVictory(): this {
    this.options.phase = 'victory'
    this.options.enemies = []
    return this
  }

  inDefeat(): this {
    this.options.phase = 'defeat'
    return this
  }

  // ---- Build ----

  build(): CombatState {
    return createCombat(this.options)
  }
}
