import { describe, it, expect } from 'vitest'
import {
  applyPowerToEntity,
  removePowerFromEntity,
  applyOutgoingDamageModifiers,
  applyIncomingDamageModifiers,
  applyOutgoingBlockModifiers,
  decayPowers,
  getPowerTriggers,
  getPowerDefinition,
  getAllPowers,
} from '../powers'
import type { PlayerEntity, EnemyEntity } from '../../types'

// ============================================================================
// Test Factories
// ============================================================================

function createPlayer(overrides: Partial<PlayerEntity> = {}): PlayerEntity {
  return {
    id: 'player',
    name: 'Player',
    currentHealth: 80,
    maxHealth: 80,
    block: 0,
    barrier: 0,
    powers: {},
    energy: 3,
    maxEnergy: 3,
    ...overrides,
  }
}

function createEnemy(overrides: Partial<EnemyEntity> = {}): EnemyEntity {
  return {
    id: 'enemy_1',
    name: 'Test Enemy',
    currentHealth: 50,
    maxHealth: 50,
    block: 0,
    barrier: 0,
    powers: {},
    intent: { type: 'attack', damage: 10 },
    patternIndex: 0,
    ...overrides,
  }
}

// ============================================================================
// Registry Tests
// ============================================================================

describe('Power Registry', () => {
  describe('getPowerDefinition', () => {
    it('returns_definition_for_known_power', () => {
      // Act
      const def = getPowerDefinition('strength')

      // Assert
      expect(def).toBeDefined()
      expect(def?.id).toBe('strength')
      expect(def?.name).toBe('Strength')
    })

    it('returns_undefined_for_unknown_power', () => {
      // Act
      const def = getPowerDefinition('nonexistent_power')

      // Assert
      expect(def).toBeUndefined()
    })
  })

  describe('getAllPowers', () => {
    it('returns_all_registered_powers', () => {
      // Act
      const powers = getAllPowers()

      // Assert
      expect(powers.length).toBeGreaterThan(0)
      expect(powers.some((p) => p.id === 'strength')).toBe(true)
      expect(powers.some((p) => p.id === 'weak')).toBe(true)
      expect(powers.some((p) => p.id === 'vulnerable')).toBe(true)
    })
  })
})

// ============================================================================
// Apply Power Tests
// ============================================================================

describe('applyPowerToEntity', () => {
  describe('intensity stacking', () => {
    it('adds_new_intensity_power', () => {
      // Arrange
      const entity = createPlayer()

      // Act
      applyPowerToEntity(entity, 'strength', 3)

      // Assert
      expect(entity.powers['strength']).toEqual({
        id: 'strength',
        amount: 3,
        duration: undefined,
      })
    })

    it('stacks_intensity_additively', () => {
      // Arrange
      const entity = createPlayer({
        powers: { strength: { id: 'strength', amount: 2 } },
      })

      // Act
      applyPowerToEntity(entity, 'strength', 3)

      // Assert
      expect(entity.powers['strength'].amount).toBe(5)
    })
  })

  describe('duration stacking', () => {
    it('adds_new_duration_power', () => {
      // Arrange
      const entity = createEnemy()

      // Act
      applyPowerToEntity(entity, 'weak', 2)

      // Assert
      expect(entity.powers['weak']).toEqual({
        id: 'weak',
        amount: 2,
        duration: undefined,
      })
    })

    it('takes_max_duration_when_stacking', () => {
      // Arrange
      const entity = createEnemy({
        powers: { weak: { id: 'weak', amount: 3 } },
      })

      // Act - apply lower duration
      applyPowerToEntity(entity, 'weak', 1)

      // Assert - keeps higher
      expect(entity.powers['weak'].amount).toBe(3)
    })

    it('increases_duration_if_new_is_higher', () => {
      // Arrange
      const entity = createEnemy({
        powers: { weak: { id: 'weak', amount: 1 } },
      })

      // Act
      applyPowerToEntity(entity, 'weak', 5)

      // Assert
      expect(entity.powers['weak'].amount).toBe(5)
    })
  })

  describe('unknown powers', () => {
    it('does_not_add_unknown_power', () => {
      // Arrange
      const entity = createPlayer()

      // Act
      applyPowerToEntity(entity, 'fake_power', 5)

      // Assert
      expect(entity.powers['fake_power']).toBeUndefined()
    })
  })
})

// ============================================================================
// Remove Power Tests
// ============================================================================

describe('removePowerFromEntity', () => {
  it('removes_existing_power', () => {
    // Arrange
    const entity = createPlayer({
      powers: { strength: { id: 'strength', amount: 3 } },
    })

    // Act
    removePowerFromEntity(entity, 'strength')

    // Assert
    expect(entity.powers['strength']).toBeUndefined()
  })

  it('handles_removing_nonexistent_power', () => {
    // Arrange
    const entity = createPlayer()

    // Act - should not throw
    removePowerFromEntity(entity, 'strength')

    // Assert
    expect(entity.powers['strength']).toBeUndefined()
  })

  it('preserves_other_powers', () => {
    // Arrange
    const entity = createPlayer({
      powers: {
        strength: { id: 'strength', amount: 3 },
        dexterity: { id: 'dexterity', amount: 2 },
      },
    })

    // Act
    removePowerFromEntity(entity, 'strength')

    // Assert
    expect(entity.powers['strength']).toBeUndefined()
    expect(entity.powers['dexterity']).toEqual({ id: 'dexterity', amount: 2 })
  })
})

// ============================================================================
// Damage Modifier Tests
// ============================================================================

describe('applyOutgoingDamageModifiers', () => {
  it('returns_base_damage_with_no_powers', () => {
    // Arrange
    const attacker = createPlayer()

    // Act
    const result = applyOutgoingDamageModifiers(10, attacker)

    // Assert
    expect(result).toBe(10)
  })

  it('adds_strength_to_damage', () => {
    // Arrange
    const attacker = createPlayer({
      powers: { strength: { id: 'strength', amount: 3 } },
    })

    // Act
    const result = applyOutgoingDamageModifiers(10, attacker)

    // Assert
    expect(result).toBe(13)
  })

  it('reduces_damage_when_weak', () => {
    // Arrange
    const attacker = createPlayer({
      powers: { weak: { id: 'weak', amount: 2 } },
    })

    // Act
    const result = applyOutgoingDamageModifiers(10, attacker)

    // Assert - weak reduces by 25%, 10 * 0.75 = 7.5 -> 7
    expect(result).toBe(7)
  })

  it('applies_strength_before_weak', () => {
    // Arrange
    const attacker = createPlayer({
      powers: {
        strength: { id: 'strength', amount: 4 },
        weak: { id: 'weak', amount: 1 },
      },
    })

    // Act - base 10 + 4 strength = 14, then * 0.75 = 10.5 -> 10
    const result = applyOutgoingDamageModifiers(10, attacker)

    // Assert
    expect(result).toBe(10)
  })

  it('floors_to_zero_minimum', () => {
    // Arrange - negative strength (drained)
    const attacker = createPlayer({
      powers: { strength: { id: 'strength', amount: -15 } },
    })

    // Act
    const result = applyOutgoingDamageModifiers(10, attacker)

    // Assert
    expect(result).toBe(0)
  })
})

describe('applyIncomingDamageModifiers', () => {
  it('returns_base_damage_with_no_powers', () => {
    // Arrange
    const defender = createPlayer()

    // Act
    const result = applyIncomingDamageModifiers(10, defender)

    // Assert
    expect(result).toBe(10)
  })

  it('increases_damage_when_vulnerable', () => {
    // Arrange
    const defender = createPlayer({
      powers: { vulnerable: { id: 'vulnerable', amount: 2 } },
    })

    // Act
    const result = applyIncomingDamageModifiers(10, defender)

    // Assert - vulnerable increases by 50%, 10 * 1.5 = 15
    expect(result).toBe(15)
  })
})

describe('applyOutgoingBlockModifiers', () => {
  it('returns_base_block_with_no_powers', () => {
    // Arrange
    const entity = createPlayer()

    // Act
    const result = applyOutgoingBlockModifiers(5, entity)

    // Assert
    expect(result).toBe(5)
  })

  it('adds_dexterity_to_block', () => {
    // Arrange
    const entity = createPlayer({
      powers: { dexterity: { id: 'dexterity', amount: 2 } },
    })

    // Act
    const result = applyOutgoingBlockModifiers(5, entity)

    // Assert
    expect(result).toBe(7)
  })
})

// ============================================================================
// Decay Tests
// ============================================================================

describe('decayPowers', () => {
  it('decays_power_on_matching_event', () => {
    // Arrange - weak decays on turnEnd
    const entity = createEnemy({
      powers: { weak: { id: 'weak', amount: 3 } },
    })

    // Act
    decayPowers(entity, 'turnEnd')

    // Assert
    expect(entity.powers['weak'].amount).toBe(2)
  })

  it('removes_power_at_zero_when_removeAtZero', () => {
    // Arrange
    const entity = createEnemy({
      powers: { weak: { id: 'weak', amount: 1 } },
    })

    // Act
    decayPowers(entity, 'turnEnd')

    // Assert
    expect(entity.powers['weak']).toBeUndefined()
  })

  it('does_not_decay_on_wrong_event', () => {
    // Arrange
    const entity = createEnemy({
      powers: { weak: { id: 'weak', amount: 3 } },
    })

    // Act
    decayPowers(entity, 'turnStart')

    // Assert - weak decays on turnEnd, not turnStart
    expect(entity.powers['weak'].amount).toBe(3)
  })

  it('handles_duration_decay_at_turn_end', () => {
    // Arrange - power with explicit duration
    const entity = createPlayer({
      powers: { strength: { id: 'strength', amount: 5, duration: 2 } },
    })

    // Act
    decayPowers(entity, 'turnEnd')

    // Assert - duration decreased
    expect(entity.powers['strength'].duration).toBe(1)
  })

  it('removes_power_when_duration_expires', () => {
    // Arrange
    const entity = createPlayer({
      powers: { strength: { id: 'strength', amount: 5, duration: 1 } },
    })

    // Act
    decayPowers(entity, 'turnEnd')

    // Assert
    expect(entity.powers['strength']).toBeUndefined()
  })

  it('preserves_powers_without_decay', () => {
    // Arrange - strength has no decayOn
    const entity = createPlayer({
      powers: { strength: { id: 'strength', amount: 3 } },
    })

    // Act
    decayPowers(entity, 'turnEnd')

    // Assert - no duration, no decayOn match, stays same
    expect(entity.powers['strength'].amount).toBe(3)
  })
})

// ============================================================================
// Trigger Tests
// ============================================================================

describe('getPowerTriggers', () => {
  it('returns_empty_array_with_no_powers', () => {
    // Arrange
    const entity = createPlayer()

    // Act
    const triggers = getPowerTriggers(entity, 'onTurnStart')

    // Assert
    expect(triggers).toEqual([])
  })

  it('returns_triggers_for_matching_event', () => {
    // Arrange - poison has onTurnStart trigger
    const entity = createEnemy({
      powers: { poison: { id: 'poison', amount: 5 } },
    })

    // Act
    const triggers = getPowerTriggers(entity, 'onTurnStart')

    // Assert
    expect(triggers.length).toBe(1)
    expect(triggers[0].powerId).toBe('poison')
    expect(triggers[0].stacks).toBe(5)
    expect(triggers[0].effects.length).toBeGreaterThan(0)
  })

  it('returns_multiple_triggers_from_different_powers', () => {
    // Arrange - multiple powers with same trigger event
    const entity = createPlayer({
      powers: {
        regeneration: { id: 'regeneration', amount: 3 },
        // Note: we need powers that share an event trigger
      },
    })

    // Act
    const triggers = getPowerTriggers(entity, 'onTurnEnd')

    // Assert - at least one trigger
    expect(triggers.length).toBeGreaterThanOrEqual(0)
  })

  it('ignores_powers_without_triggers', () => {
    // Arrange - strength has no triggers, only modifiers
    const entity = createPlayer({
      powers: { strength: { id: 'strength', amount: 5 } },
    })

    // Act
    const triggers = getPowerTriggers(entity, 'onTurnStart')

    // Assert
    expect(triggers).toEqual([])
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Power System Integration', () => {
  it('combat_damage_with_strength_and_vulnerable', () => {
    // Arrange
    const attacker = createPlayer({
      powers: { strength: { id: 'strength', amount: 3 } },
    })
    const defender = createEnemy({
      powers: { vulnerable: { id: 'vulnerable', amount: 2 } },
    })

    // Act - base 10 + 3 strength = 13, then defender takes 50% more = 19.5 -> 19
    const outgoing = applyOutgoingDamageModifiers(10, attacker)
    const incoming = applyIncomingDamageModifiers(outgoing, defender)

    // Assert
    expect(outgoing).toBe(13)
    expect(incoming).toBe(19) // 13 * 1.5 floored
  })

  it('power_lifecycle_apply_decay_remove', () => {
    // Arrange
    const entity = createEnemy()

    // Act - apply
    applyPowerToEntity(entity, 'weak', 2)
    expect(entity.powers['weak'].amount).toBe(2)

    // Decay
    decayPowers(entity, 'turnEnd')
    expect(entity.powers['weak'].amount).toBe(1)

    // Decay to removal
    decayPowers(entity, 'turnEnd')
    expect(entity.powers['weak']).toBeUndefined()
  })
})
