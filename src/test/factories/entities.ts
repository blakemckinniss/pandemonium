import type { PlayerEntity, EnemyEntity, Powers, Power, Intent } from '../../types'

// ============================================================================
// Power Utilities
// ============================================================================

export function createPower(id: string, amount: number, duration?: number): Power {
  return { id, amount, ...(duration !== undefined && { duration }) }
}

export function createPowers(powers: Record<string, number>): Powers {
  return Object.entries(powers).reduce((acc, [id, amount]) => {
    acc[id] = { id, amount }
    return acc
  }, {} as Powers)
}

// ============================================================================
// Player Factory
// ============================================================================

export interface PlayerOptions extends Partial<PlayerEntity> {
  /** Sets both currentHealth and maxHealth */
  health?: number
  /** Sets currentHealth = maxHealth - damaged */
  damaged?: number
  /** Quick power application: { strength: 3, dexterity: 2 } */
  withPowers?: Record<string, number>
}

export function createPlayer(options: PlayerOptions = {}): PlayerEntity {
  const { health, damaged, withPowers, ...overrides } = options

  // Resolve health shortcuts
  let currentHealth = overrides.currentHealth ?? 80
  let maxHealth = overrides.maxHealth ?? 80

  if (health !== undefined) {
    currentHealth = health
    maxHealth = health
  }
  if (damaged !== undefined) {
    currentHealth = maxHealth - damaged
  }

  // Resolve power shortcuts
  let powers = overrides.powers ?? {}
  if (withPowers) {
    powers = createPowers(withPowers)
  }

  return {
    id: 'player',
    name: 'Player',
    currentHealth,
    maxHealth,
    block: 0,
    barrier: 0,
    energy: 3,
    maxEnergy: 3,
    ...overrides,
    powers, // Apply powers last to ensure withPowers takes effect
  }
}

// ============================================================================
// Enemy Factory
// ============================================================================

export interface EnemyOptions extends Partial<EnemyEntity> {
  /** Sets both currentHealth and maxHealth */
  health?: number
  /** Sets currentHealth = maxHealth - damaged */
  damaged?: number
  /** Quick power application */
  withPowers?: Record<string, number>
  /** Auto-generates id like 'enemy_1', 'enemy_2' */
  index?: number
}

let enemyCounter = 0

export function createEnemy(options: EnemyOptions = {}): EnemyEntity {
  const { health, damaged, withPowers, index, ...overrides } = options

  // Auto-increment counter for unique IDs
  const idx = index ?? ++enemyCounter

  // Resolve health shortcuts
  let currentHealth = overrides.currentHealth ?? 50
  let maxHealth = overrides.maxHealth ?? 50

  if (health !== undefined) {
    currentHealth = health
    maxHealth = health
  }
  if (damaged !== undefined) {
    currentHealth = maxHealth - damaged
  }

  // Resolve power shortcuts
  let powers = overrides.powers ?? {}
  if (withPowers) {
    powers = createPowers(withPowers)
  }

  return {
    id: overrides.id ?? `enemy_${idx}`,
    name: overrides.name ?? 'Test Enemy',
    currentHealth,
    maxHealth,
    block: 0,
    barrier: 0,
    intent: { type: 'attack', value: 10 },
    patternIndex: 0,
    ...overrides,
    powers,
  }
}

/** Create multiple enemies with unique IDs */
export function createEnemies(count: number, options?: Omit<EnemyOptions, 'index'>): EnemyEntity[] {
  return Array.from({ length: count }, (_, i) =>
    createEnemy({ ...options, index: i + 1, id: `enemy_${i + 1}` })
  )
}

/** Reset enemy counter (useful between tests) */
export function resetEnemyCounter(): void {
  enemyCounter = 0
}

// ============================================================================
// Intent Factory
// ============================================================================

export function createIntent(type: Intent['type'], value?: number): Intent {
  return { type, value }
}

export const INTENTS = {
  attack: (damage = 10): Intent => ({ type: 'attack', value: damage }),
  defend: (block = 5): Intent => ({ type: 'defend', value: block }),
  buff: (): Intent => ({ type: 'buff' }),
  debuff: (): Intent => ({ type: 'debuff' }),
  unknown: (): Intent => ({ type: 'unknown' }),
} as const
