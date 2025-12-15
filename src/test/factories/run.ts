import type { RunState, HeroState, CombatState, RelicInstance, RunStats, GamePhase, RoomCard } from '../../types'
import { createCombat, CombatBuilder, type CombatOptions } from './combat'
import { createDeck, DECKS } from './cards'

// ============================================================================
// Stats Factory
// ============================================================================

export function createStats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    damageDealt: 0,
    damageTaken: 0,
    cardsPlayed: 0,
    enemiesKilled: 0,
    ...overrides,
  }
}

// ============================================================================
// Hero Factory
// ============================================================================

export interface HeroOptions extends Partial<HeroState> {
  /** Sets both currentHealth and maxHealth */
  health?: number
  /** Sets currentHealth = maxHealth - damaged */
  damaged?: number
}

export function createHero(options: HeroOptions = {}): HeroState {
  const { health, damaged, ...overrides } = options

  let currentHealth = overrides.currentHealth ?? 80
  let maxHealth = overrides.maxHealth ?? 80

  if (health !== undefined) {
    currentHealth = health
    maxHealth = health
  }
  if (damaged !== undefined) {
    currentHealth = maxHealth - damaged
  }

  return {
    id: 'warrior',
    name: 'Ironclad',
    health: 80,
    energy: 3,
    starterDeck: ['strike', 'defend', 'bash'],
    currentHealth,
    maxHealth,
    ...overrides,
  }
}

// ============================================================================
// Relic Factory
// ============================================================================

export interface RelicOptions extends Partial<RelicInstance> {
  /** Shortcut: just pass the definition ID */
  relicId?: string
}

let relicCounter = 0

export function createRelic(options: RelicOptions = {}): RelicInstance {
  const { relicId, ...overrides } = options
  relicCounter++

  return {
    id: overrides.id ?? `relic_${relicCounter}`,
    definitionId: relicId ?? overrides.definitionId ?? 'burning_blood',
    ...overrides,
  }
}

export function resetRelicCounter(): void {
  relicCounter = 0
}

// ============================================================================
// Run State Factory
// ============================================================================

export interface RunOptions extends Partial<RunState> {
  /** Hero configuration shortcut */
  heroOptions?: HeroOptions
  /** Combat configuration shortcut */
  combatOptions?: CombatOptions
  /** Shorthand for gamePhase: 'combat' with combat state */
  inCombat?: boolean
  /** Card IDs for the persistent deck */
  deckCards?: string[]
  /** Relic definition IDs */
  relicIds?: string[]
}

export function createRunState(options: RunOptions = {}): RunState {
  const {
    heroOptions,
    combatOptions,
    inCombat = true,
    deckCards,
    relicIds,
    ...overrides
  } = options

  const hero = overrides.hero ?? createHero(heroOptions)
  const deck = overrides.deck ?? (deckCards ? createDeck(deckCards) : DECKS.starter())
  const relics = overrides.relics ?? (relicIds ? relicIds.map(id => createRelic({ relicId: id })) : [])

  // Determine game phase and combat state
  const gamePhase = overrides.gamePhase ?? (inCombat ? 'combat' : 'roomSelect')
  let combat = overrides.combat
  if (combat === undefined) {
    combat = gamePhase === 'combat' ? createCombat(combatOptions) : null
  }

  return {
    gamePhase,
    floor: 1,
    hero,
    deck,
    relics,
    combat,
    dungeonDeck: [],
    roomChoices: [],
    gold: 0,
    stats: createStats(),
    ...overrides,
  }
}

// ============================================================================
// Run Builder (Fluent API)
// ============================================================================

export class RunBuilder {
  private options: RunOptions = {}
  private combatBuilder?: CombatBuilder

  static new(): RunBuilder {
    return new RunBuilder()
  }

  // ---- Combat Delegation ----

  /**
   * Enter combat mode and return a combat builder.
   * Call .buildRun() to get the final RunState.
   */
  inCombat(): CombatBuilder & { buildRun: () => RunState } {
    this.options.inCombat = true
    this.options.gamePhase = 'combat'
    this.combatBuilder = CombatBuilder.new()

    // Return extended combat builder that can build the run directly
    const self = this
    return Object.assign(this.combatBuilder, {
      buildRun(): RunState {
        self.options.combat = self.combatBuilder!.build()
        return createRunState(self.options)
      },
    })
  }

  // ---- Non-Combat Phases ----

  atMenu(): this {
    this.options.gamePhase = 'menu'
    this.options.inCombat = false
    this.options.combat = null
    return this
  }

  atRoomSelect(): this {
    this.options.gamePhase = 'roomSelect'
    this.options.inCombat = false
    this.options.combat = null
    return this
  }

  atCampfire(): this {
    this.options.gamePhase = 'campfire'
    this.options.inCombat = false
    this.options.combat = null
    return this
  }

  atTreasure(): this {
    this.options.gamePhase = 'treasure'
    this.options.inCombat = false
    this.options.combat = null
    return this
  }

  atReward(): this {
    this.options.gamePhase = 'reward'
    this.options.inCombat = false
    this.options.combat = null
    return this
  }

  atGameOver(): this {
    this.options.gamePhase = 'gameOver'
    this.options.inCombat = false
    this.options.combat = null
    return this
  }

  // ---- Hero Configuration ----

  withHero(options: HeroOptions): this {
    this.options.heroOptions = { ...this.options.heroOptions, ...options }
    return this
  }

  withHeroHealth(current: number, max?: number): this {
    this.options.heroOptions = {
      ...this.options.heroOptions,
      currentHealth: current,
      maxHealth: max ?? current,
    }
    return this
  }

  // ---- Resources ----

  withGold(gold: number): this {
    this.options.gold = gold
    return this
  }

  onFloor(floor: number): this {
    this.options.floor = floor
    return this
  }

  // ---- Deck ----

  withDeck(cardIds: string[]): this {
    this.options.deckCards = cardIds
    return this
  }

  withStarterDeck(): this {
    this.options.deck = DECKS.starter()
    return this
  }

  // ---- Relics ----

  withRelic(relicId: string, counter?: number): this {
    const existing = this.options.relics ?? []
    existing.push(createRelic({ relicId, counter }))
    this.options.relics = existing
    return this
  }

  withRelics(relicIds: string[]): this {
    this.options.relicIds = relicIds
    return this
  }

  // ---- Stats ----

  withStats(stats: Partial<RunStats>): this {
    this.options.stats = createStats(stats)
    return this
  }

  // ---- Room Configuration ----

  withRoomChoices(rooms: RoomCard[]): this {
    this.options.roomChoices = rooms
    return this
  }

  withDungeonDeck(rooms: RoomCard[]): this {
    this.options.dungeonDeck = rooms
    return this
  }

  // ---- Build ----

  build(): RunState {
    if (this.combatBuilder && !this.options.combat) {
      this.options.combat = this.combatBuilder.build()
    }
    return createRunState(this.options)
  }
}
