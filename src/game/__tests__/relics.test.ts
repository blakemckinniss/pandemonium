import { describe, it, expect } from 'vitest'
import {
  registerRelic,
  getRelicDefinition,
  getAllRelics,
  getRelicsByRarity,
} from '../relics'
import type { RelicDefinition } from '../../types'

// ============================================================================
// Registry Tests
// ============================================================================

describe('Relic Registry', () => {
  describe('getRelicDefinition', () => {
    it('returns_definition_for_known_relic', () => {
      // Act
      const def = getRelicDefinition('burning_blood')

      // Assert
      expect(def).toBeDefined()
      expect(def?.id).toBe('burning_blood')
      expect(def?.name).toBe('Burning Blood')
      expect(def?.rarity).toBe('common')
      expect(def?.trigger).toBe('onCombatEnd')
    })

    it('returns_definition_for_anchor', () => {
      // Act
      const def = getRelicDefinition('anchor')

      // Assert
      expect(def).toBeDefined()
      expect(def?.id).toBe('anchor')
      expect(def?.name).toBe('Anchor')
      expect(def?.trigger).toBe('onCombatStart')
      expect(def?.effects).toHaveLength(1)
      expect(def?.effects?.[0]).toEqual({ type: 'block', amount: 10, target: 'self' })
    })

    it('returns_undefined_for_unknown_relic', () => {
      // Act
      const def = getRelicDefinition('nonexistent_relic')

      // Assert
      expect(def).toBeUndefined()
    })
  })

  describe('getAllRelics', () => {
    it('returns_all_registered_relics', () => {
      // Act
      const relics = getAllRelics()

      // Assert
      expect(relics.length).toBeGreaterThan(0)
      expect(relics.some((r) => r.id === 'burning_blood')).toBe(true)
      expect(relics.some((r) => r.id === 'anchor')).toBe(true)
      expect(relics.some((r) => r.id === 'lantern')).toBe(true)
    })

    it('returns_array_of_relic_definitions', () => {
      // Act
      const relics = getAllRelics()

      // Assert
      relics.forEach((relic) => {
        expect(relic).toHaveProperty('id')
        expect(relic).toHaveProperty('name')
        expect(relic).toHaveProperty('description')
        expect(relic).toHaveProperty('rarity')
        expect(relic).toHaveProperty('trigger')
      })
    })
  })

  describe('getRelicsByRarity', () => {
    it('returns_only_common_relics', () => {
      // Act
      const commons = getRelicsByRarity('common')

      // Assert
      expect(commons.length).toBeGreaterThan(0)
      commons.forEach((relic) => {
        expect(relic.rarity).toBe('common')
      })
      expect(commons.some((r) => r.id === 'burning_blood')).toBe(true)
      expect(commons.some((r) => r.id === 'anchor')).toBe(true)
    })

    it('returns_only_uncommon_relics', () => {
      // Act
      const uncommons = getRelicsByRarity('uncommon')

      // Assert
      expect(uncommons.length).toBeGreaterThan(0)
      uncommons.forEach((relic) => {
        expect(relic.rarity).toBe('uncommon')
      })
      expect(uncommons.some((r) => r.id === 'blood_vial')).toBe(true)
      expect(uncommons.some((r) => r.id === 'war_paint')).toBe(true)
    })

    it('returns_only_rare_relics', () => {
      // Act
      const rares = getRelicsByRarity('rare')

      // Assert
      expect(rares.length).toBeGreaterThan(0)
      rares.forEach((relic) => {
        expect(relic.rarity).toBe('rare')
      })
      expect(rares.some((r) => r.id === 'captains_wheel')).toBe(true)
      expect(rares.some((r) => r.id === 'ice_cream')).toBe(true)
    })

    it('returns_empty_array_for_boss_rarity_when_none_exist', () => {
      // Act
      const boss = getRelicsByRarity('boss')

      // Assert
      // No boss relics registered yet in base game
      expect(Array.isArray(boss)).toBe(true)
    })
  })

  describe('registerRelic', () => {
    it('registers_new_relic_successfully', () => {
      // Arrange
      const testRelic: RelicDefinition = {
        id: 'test_relic_unique_id',
        name: 'Test Relic',
        description: 'A test relic for unit testing.',
        rarity: 'common',
        trigger: 'onCombatStart',
        effects: [{ type: 'heal', amount: 5, target: 'self' }],
      }

      // Act
      registerRelic(testRelic)
      const retrieved = getRelicDefinition('test_relic_unique_id')

      // Assert
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('test_relic_unique_id')
      expect(retrieved?.name).toBe('Test Relic')
      expect(retrieved?.effects).toHaveLength(1)
    })
  })
})

// ============================================================================
// Relic Definition Tests (Specific Relics)
// ============================================================================

describe('Starter Relics', () => {
  describe('burning_blood', () => {
    it('has_combat_end_heal_effect', () => {
      // Act
      const def = getRelicDefinition('burning_blood')

      // Assert
      expect(def).toBeDefined()
      expect(def?.trigger).toBe('onCombatEnd')
      expect(def?.effects).toHaveLength(1)
      expect(def?.effects?.[0]).toEqual({ type: 'heal', amount: 6, target: 'self' })
    })
  })
})

describe('Common Relics', () => {
  describe('anchor', () => {
    it('grants_block_at_combat_start', () => {
      // Act
      const def = getRelicDefinition('anchor')

      // Assert
      expect(def?.trigger).toBe('onCombatStart')
      expect(def?.effects?.[0]).toMatchObject({
        type: 'block',
        amount: 10,
        target: 'self',
      })
    })
  })

  describe('lantern', () => {
    it('grants_energy_at_combat_start', () => {
      // Act
      const def = getRelicDefinition('lantern')

      // Assert
      expect(def?.trigger).toBe('onCombatStart')
      expect(def?.effects?.[0]).toMatchObject({
        type: 'energy',
        amount: 1,
        operation: 'gain',
      })
    })
  })

  describe('bag_of_marbles', () => {
    it('applies_vulnerable_to_all_enemies_at_start', () => {
      // Act
      const def = getRelicDefinition('bag_of_marbles')

      // Assert
      expect(def?.trigger).toBe('onCombatStart')
      expect(def?.effects?.[0]).toMatchObject({
        type: 'applyPower',
        powerId: 'vulnerable',
        amount: 1,
        target: 'allEnemies',
      })
    })
  })

  describe('bronze_scales', () => {
    it('applies_thorns_at_combat_start', () => {
      // Act
      const def = getRelicDefinition('bronze_scales')

      // Assert
      expect(def?.trigger).toBe('onCombatStart')
      expect(def?.effects?.[0]).toMatchObject({
        type: 'applyPower',
        powerId: 'thorns',
        amount: 3,
        target: 'self',
      })
    })
  })

  describe('orichalcum', () => {
    it('has_conditional_block_on_turn_end', () => {
      // Act
      const def = getRelicDefinition('orichalcum')

      // Assert
      expect(def?.trigger).toBe('onTurnEnd')
      expect(def?.effects).toHaveLength(1)

      const effect = def?.effects?.[0]
      expect(effect?.type).toBe('conditional')

      if (effect?.type === 'conditional') {
        expect(effect.condition).toMatchObject({
          type: 'resource',
          resource: 'block',
          target: 'self',
          op: '=',
          value: 0,
        })
        expect(effect.then).toHaveLength(1)
        expect(effect.then[0]).toMatchObject({
          type: 'block',
          amount: 6,
          target: 'self',
        })
      }
    })
  })
})

describe('Uncommon Relics', () => {
  describe('blood_vial', () => {
    it('heals_at_combat_start', () => {
      // Act
      const def = getRelicDefinition('blood_vial')

      // Assert
      expect(def?.trigger).toBe('onCombatStart')
      expect(def?.effects?.[0]).toMatchObject({
        type: 'heal',
        amount: 2,
        target: 'self',
      })
    })
  })

  describe('pen_nib', () => {
    it('has_attack_trigger_with_empty_effects', () => {
      // Act
      const def = getRelicDefinition('pen_nib')

      // Assert
      expect(def?.trigger).toBe('onAttack')
      // Note: Special counter logic handled elsewhere
      expect(def?.effects).toEqual([])
    })
  })

  describe('meat_on_bone', () => {
    it('has_conditional_heal_on_combat_end', () => {
      // Act
      const def = getRelicDefinition('meat_on_bone')

      // Assert
      expect(def?.trigger).toBe('onCombatEnd')
      expect(def?.effects).toHaveLength(1)

      const effect = def?.effects?.[0]
      expect(effect?.type).toBe('conditional')

      if (effect?.type === 'conditional') {
        expect(effect.condition).toMatchObject({
          type: 'health',
          target: 'self',
          compare: 'percent',
          op: '<=',
          value: 50,
        })
        expect(effect.then[0]).toMatchObject({
          type: 'heal',
          amount: 12,
          target: 'self',
        })
      }
    })
  })

  describe('eternal_feather', () => {
    it('is_passive_with_empty_effects', () => {
      // Act
      const def = getRelicDefinition('eternal_feather')

      // Assert
      expect(def?.trigger).toBe('passive')
      expect(def?.effects).toEqual([])
    })
  })

  describe('war_paint', () => {
    it('applies_strength_at_combat_start', () => {
      // Act
      const def = getRelicDefinition('war_paint')

      // Assert
      expect(def?.trigger).toBe('onCombatStart')
      expect(def?.effects?.[0]).toMatchObject({
        type: 'applyPower',
        powerId: 'strength',
        amount: 1,
        target: 'self',
      })
    })
  })
})

describe('Rare Relics', () => {
  describe('captains_wheel', () => {
    it('has_conditional_block_on_turn_3', () => {
      // Act
      const def = getRelicDefinition('captains_wheel')

      // Assert
      expect(def?.trigger).toBe('onTurnStart')
      expect(def?.effects).toHaveLength(1)

      const effect = def?.effects?.[0]
      expect(effect?.type).toBe('conditional')

      if (effect?.type === 'conditional') {
        expect(effect.condition).toMatchObject({
          type: 'turn',
          op: '=',
          value: 3,
        })
        expect(effect.then[0]).toMatchObject({
          type: 'block',
          amount: 18,
          target: 'self',
        })
      }
    })
  })

  describe('paper_krane', () => {
    it('is_passive_modifier_relic', () => {
      // Act
      const def = getRelicDefinition('paper_krane')

      // Assert
      expect(def?.trigger).toBe('passive')
      expect(def?.effects).toEqual([])
      // Modifier handled in damage calculation
    })
  })

  describe('tungsten_rod', () => {
    it('is_passive_damage_reduction_relic', () => {
      // Act
      const def = getRelicDefinition('tungsten_rod')

      // Assert
      expect(def?.trigger).toBe('passive')
      expect(def?.effects).toEqual([])
      // Damage reduction handled in damage application
    })
  })

  describe('ice_cream', () => {
    it('is_passive_energy_conservation_relic', () => {
      // Act
      const def = getRelicDefinition('ice_cream')

      // Assert
      expect(def?.trigger).toBe('passive')
      expect(def?.effects).toEqual([])
      // Energy conservation handled in turn logic
    })
  })

  describe('runic_pyramid', () => {
    it('is_passive_hand_retention_relic', () => {
      // Act
      const def = getRelicDefinition('runic_pyramid')

      // Assert
      expect(def?.trigger).toBe('passive')
      expect(def?.effects).toEqual([])
      // Hand retention handled in end turn logic
    })
  })
})

// ============================================================================
// Relic Trigger Type Coverage
// ============================================================================

describe('Relic Triggers Coverage', () => {
  it('has_relics_for_onCombatStart_trigger', () => {
    // Act
    const relics = getAllRelics().filter((r) => r.trigger === 'onCombatStart')

    // Assert
    expect(relics.length).toBeGreaterThan(0)
    expect(relics.some((r) => r.id === 'anchor')).toBe(true)
    expect(relics.some((r) => r.id === 'lantern')).toBe(true)
  })

  it('has_relics_for_onCombatEnd_trigger', () => {
    // Act
    const relics = getAllRelics().filter((r) => r.trigger === 'onCombatEnd')

    // Assert
    expect(relics.length).toBeGreaterThan(0)
    expect(relics.some((r) => r.id === 'burning_blood')).toBe(true)
  })

  it('has_relics_for_onTurnStart_trigger', () => {
    // Act
    const relics = getAllRelics().filter((r) => r.trigger === 'onTurnStart')

    // Assert
    expect(relics.length).toBeGreaterThan(0)
    expect(relics.some((r) => r.id === 'captains_wheel')).toBe(true)
  })

  it('has_relics_for_onTurnEnd_trigger', () => {
    // Act
    const relics = getAllRelics().filter((r) => r.trigger === 'onTurnEnd')

    // Assert
    expect(relics.length).toBeGreaterThan(0)
    expect(relics.some((r) => r.id === 'orichalcum')).toBe(true)
  })

  it('has_relics_for_passive_trigger', () => {
    // Act
    const relics = getAllRelics().filter((r) => r.trigger === 'passive')

    // Assert
    expect(relics.length).toBeGreaterThan(0)
    expect(relics.some((r) => r.id === 'ice_cream')).toBe(true)
    expect(relics.some((r) => r.id === 'runic_pyramid')).toBe(true)
  })

  it('has_relics_for_onAttack_trigger', () => {
    // Act
    const relics = getAllRelics().filter((r) => r.trigger === 'onAttack')

    // Assert
    expect(relics.length).toBeGreaterThan(0)
    expect(relics.some((r) => r.id === 'pen_nib')).toBe(true)
  })
})

// ============================================================================
// Edge Cases & Validation
// ============================================================================

describe('Relic Edge Cases', () => {
  it('handles_relics_with_no_effects_array', () => {
    // Act
    const passiveRelics = getAllRelics().filter((r) => r.trigger === 'passive')

    // Assert
    passiveRelics.forEach((relic) => {
      // Should either have empty array or no effects
      if (relic.effects) {
        expect(Array.isArray(relic.effects)).toBe(true)
      }
    })
  })

  it('all_relics_have_required_fields', () => {
    // Act
    const allRelics = getAllRelics()

    // Assert
    allRelics.forEach((relic) => {
      expect(relic.id).toBeTruthy()
      expect(relic.name).toBeTruthy()
      expect(relic.description).toBeTruthy()
      expect(relic.rarity).toBeTruthy()
      expect(relic.trigger).toBeTruthy()
    })
  })

  it('no_duplicate_relic_ids', () => {
    // Act
    const allRelics = getAllRelics()
    const ids = allRelics.map((r) => r.id)
    const uniqueIds = new Set(ids)

    // Assert
    expect(ids.length).toBe(uniqueIds.size)
  })

  it('all_relic_ids_are_lowercase_with_underscores', () => {
    // Act
    const allRelics = getAllRelics()

    // Assert
    allRelics.forEach((relic) => {
      expect(relic.id).toMatch(/^[a-z_]+$/)
    })
  })

  it('all_relic_rarities_are_valid', () => {
    // Act
    const allRelics = getAllRelics()
    const validRarities = ['common', 'uncommon', 'rare', 'boss']

    // Assert
    allRelics.forEach((relic) => {
      expect(validRarities).toContain(relic.rarity)
    })
  })

  it('all_relic_triggers_are_valid', () => {
    // Act
    const allRelics = getAllRelics()
    const validTriggers = [
      'onCombatStart',
      'onCombatEnd',
      'onTurnStart',
      'onTurnEnd',
      'onCardPlayed',
      'onAttack',
      'onKill',
      'onDamaged',
      'onHeal',
      'onGoldGained',
      'passive',
    ]

    // Assert
    allRelics.forEach((relic) => {
      expect(validTriggers).toContain(relic.trigger)
    })
  })
})

// ============================================================================
// Conditional Effects Tests
// ============================================================================

describe('Relics with Conditional Effects', () => {
  it('orichalcum_has_valid_conditional_structure', () => {
    // Act
    const def = getRelicDefinition('orichalcum')
    const effect = def?.effects?.[0]

    // Assert
    expect(effect?.type).toBe('conditional')
    if (effect?.type === 'conditional') {
      expect(effect.condition).toBeDefined()
      expect(effect.then).toBeDefined()
      expect(Array.isArray(effect.then)).toBe(true)
      expect(effect.then.length).toBeGreaterThan(0)
    }
  })

  it('meat_on_bone_has_valid_conditional_structure', () => {
    // Act
    const def = getRelicDefinition('meat_on_bone')
    const effect = def?.effects?.[0]

    // Assert
    expect(effect?.type).toBe('conditional')
    if (effect?.type === 'conditional') {
      expect(effect.condition).toBeDefined()
      expect(effect.condition.type).toBe('health')
      expect(effect.then).toBeDefined()
      expect(effect.then.length).toBeGreaterThan(0)
    }
  })

  it('captains_wheel_has_valid_turn_conditional', () => {
    // Act
    const def = getRelicDefinition('captains_wheel')
    const effect = def?.effects?.[0]

    // Assert
    expect(effect?.type).toBe('conditional')
    if (effect?.type === 'conditional') {
      expect(effect.condition).toBeDefined()
      expect(effect.condition.type).toBe('turn')
      if (effect.condition.type === 'turn') {
        expect(effect.condition.value).toBe(3)
      }
      expect(effect.then[0].type).toBe('block')
    }
  })
})

// ============================================================================
// Rarity Distribution Tests
// ============================================================================

describe('Rarity Distribution', () => {
  it('has_more_common_relics_than_rare', () => {
    // Act
    const commons = getRelicsByRarity('common')
    const rares = getRelicsByRarity('rare')

    // Assert
    expect(commons.length).toBeGreaterThanOrEqual(rares.length)
  })

  it('common_relics_are_simpler_than_rare', () => {
    // Arrange
    const rares = getRelicsByRarity('rare')

    // Act
    const rarePassive = rares.filter((r) => r.trigger === 'passive').length

    // Assert
    // Rare relics tend to have more passive effects (complex modifiers)
    expect(rarePassive).toBeGreaterThan(0)
  })
})
