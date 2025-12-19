 
import { describe, it, expect } from 'vitest'
import {
  checkElementalCombo,
  getStatusElement,
  getElementStatus,
  getElementalDamageMultiplier,
  ELEMENTAL_COMBOS,
  ELEMENTAL_STATUS_POWERS,
  ELEMENT_COLORS,
  ELEMENT_ICONS,
} from '../elements'
import type { Element, ElementalStatus } from '../../types'

// Local type for tests - matches getElementalDamageMultiplier parameter
interface ElementalAffinity {
  immunities?: Element[]
  resistances?: Element[]
  weaknesses?: Element[]
}

// ============================================================================
// Element Status Mapping Tests
// ============================================================================

describe('getStatusElement', () => {
  it('returns_fire_for_burning', () => {
    // Act
    const element = getStatusElement('burning')

    // Assert
    expect(element).toBe('fire')
  })

  it('returns_ice_for_wet', () => {
    // Act
    const element = getStatusElement('wet')

    // Assert
    expect(element).toBe('ice')
  })

  it('returns_ice_for_frozen', () => {
    // Act
    const element = getStatusElement('frozen')

    // Assert
    expect(element).toBe('ice')
  })

  it('returns_lightning_for_charged', () => {
    // Act
    const element = getStatusElement('charged')

    // Assert
    expect(element).toBe('lightning')
  })

  it('returns_void_for_oiled', () => {
    // Act
    const element = getStatusElement('oiled')

    // Assert
    expect(element).toBe('void')
  })
})

describe('getElementStatus', () => {
  it('returns_burning_for_fire', () => {
    // Act
    const status = getElementStatus('fire')

    // Assert
    expect(status).toBe('burning')
  })

  it('returns_frozen_for_ice', () => {
    // Act
    const status = getElementStatus('ice')

    // Assert
    expect(status).toBe('frozen')
  })

  it('returns_charged_for_lightning', () => {
    // Act
    const status = getElementStatus('lightning')

    // Assert
    expect(status).toBe('charged')
  })

  it('returns_oiled_for_void', () => {
    // Act
    const status = getElementStatus('void')

    // Assert
    expect(status).toBe('oiled')
  })

  it('returns_undefined_for_physical', () => {
    // Act
    const status = getElementStatus('physical')

    // Assert
    expect(status).toBeUndefined()
  })
})

// ============================================================================
// Elemental Combo Tests
// ============================================================================

describe('checkElementalCombo', () => {
  describe('wet combos', () => {
    it('triggers_conducted_with_wet_and_lightning', () => {
      // Arrange
      const statuses = ['wet']
      const element: Element = 'lightning'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeDefined()
      expect(combo?.name).toBe('Conducted')
      expect(combo?.effect).toBe('chainDamage')
      expect(combo?.damageMultiplier).toBe(1.5)
      expect(combo?.chainToAll).toBe(true)
      expect(combo?.removeStatus).toBe(true)
    })

    it('triggers_flash_freeze_with_wet_and_ice', () => {
      // Arrange
      const statuses = ['wet']
      const element: Element = 'ice'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeDefined()
      expect(combo?.name).toBe('Flash Freeze')
      expect(combo?.effect).toBe('flashFreeze')
      expect(combo?.damageMultiplier).toBe(1.0)
      expect(combo?.applyStatus).toBe('frozen')
      expect(combo?.removeStatus).toBe(true)
    })
  })

  describe('oil combos', () => {
    it('triggers_explosion_with_oiled_and_fire', () => {
      // Arrange
      const statuses = ['oiled']
      const element: Element = 'fire'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeDefined()
      expect(combo?.name).toBe('Explosion')
      expect(combo?.effect).toBe('explosion')
      expect(combo?.damageMultiplier).toBe(2.0)
      expect(combo?.removeStatus).toBe(true)
    })

    it('triggers_explosion_with_burning_and_void', () => {
      // Arrange
      const statuses = ['burning']
      const element: Element = 'void'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeDefined()
      expect(combo?.name).toBe('Explosion')
      expect(combo?.effect).toBe('explosion')
      expect(combo?.damageMultiplier).toBe(2.0)
      expect(combo?.removeStatus).toBe(true)
    })
  })

  describe('frozen combos', () => {
    it('triggers_shatter_with_frozen_and_physical', () => {
      // Arrange
      const statuses = ['frozen']
      const element: Element = 'physical'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeDefined()
      expect(combo?.name).toBe('Shatter')
      expect(combo?.effect).toBe('shatter')
      expect(combo?.damageMultiplier).toBe(1.5)
      expect(combo?.executeThreshold).toBe(0.15)
      expect(combo?.removeStatus).toBe(true)
    })
  })

  describe('charged combos', () => {
    it('triggers_conduct_with_charged_and_ice', () => {
      // Arrange
      const statuses = ['charged']
      const element: Element = 'ice'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeDefined()
      expect(combo?.name).toBe('Conduct')
      expect(combo?.effect).toBe('conduct')
      expect(combo?.bonusDamage).toBe(5)
      expect(combo?.removeStatus).toBe(true)
    })
  })

  describe('no combo cases', () => {
    it('returns_undefined_when_no_matching_status', () => {
      // Arrange
      const statuses = ['burning']
      const element: Element = 'ice'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeUndefined()
    })

    it('returns_undefined_when_no_matching_element', () => {
      // Arrange
      const statuses = ['wet']
      const element: Element = 'fire'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeUndefined()
    })

    it('returns_undefined_with_empty_statuses', () => {
      // Arrange
      const statuses: string[] = []
      const element: Element = 'fire'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert
      expect(combo).toBeUndefined()
    })

    it('returns_first_matching_combo_when_multiple_statuses', () => {
      // Arrange - both wet and frozen present
      const statuses = ['wet', 'frozen']
      const element: Element = 'lightning'

      // Act
      const combo = checkElementalCombo(statuses, element)

      // Assert - wet + lightning should match
      expect(combo).toBeDefined()
      expect(combo?.name).toBe('Conducted')
    })
  })
})

// ============================================================================
// Elemental Status Power Definitions Tests
// ============================================================================

describe('ELEMENTAL_STATUS_POWERS', () => {
  describe('burning', () => {
    it('has_correct_properties', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.burning

      // Assert
      expect(power.id).toBe('burning')
      expect(power.name).toBe('Burning')
      expect(power.stackBehavior).toBe('intensity')
      expect(power.decayOn).toBe('turnStart')
      expect(power.removeAtZero).toBe(true)
      expect(power.isDebuff).toBe(true)
    })

    it('has_turn_start_damage_trigger', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.burning

      // Assert
      expect(power.triggers).toBeDefined()
      expect(power.triggers?.length).toBe(1)
      expect(power.triggers?.[0].event).toBe('onTurnStart')
      expect(power.triggers?.[0].effects.length).toBeGreaterThan(0)
      expect(power.triggers?.[0].effects[0].type).toBe('damage')
    })

    it('damage_uses_power_amount', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.burning
      const damageEffect = power.triggers?.[0].effects[0]

      // Assert
      expect(damageEffect?.type).toBe('damage')
      if (damageEffect?.type === 'damage') {
        expect(damageEffect.amount).toEqual({ type: 'powerAmount' })
        expect(damageEffect.element).toBe('fire')
      }
    })
  })

  describe('wet', () => {
    it('has_correct_properties', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.wet

      // Assert
      expect(power.id).toBe('wet')
      expect(power.name).toBe('Wet')
      expect(power.stackBehavior).toBe('duration')
      expect(power.decayOn).toBe('turnEnd')
      expect(power.removeAtZero).toBe(true)
      expect(power.isDebuff).toBe(true)
    })

    it('has_no_triggers', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.wet

      // Assert - wet is just a status for combo setup
      expect(power.triggers).toBeUndefined()
    })
  })

  describe('frozen', () => {
    it('has_correct_properties', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.frozen

      // Assert
      expect(power.id).toBe('frozen')
      expect(power.name).toBe('Frozen')
      expect(power.stackBehavior).toBe('duration')
      expect(power.decayOn).toBe('turnEnd')
      expect(power.removeAtZero).toBe(true)
      expect(power.isDebuff).toBe(true)
    })

    it('has_damage_modifier', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.frozen

      // Assert
      expect(power.modifiers).toBeDefined()
      expect(power.modifiers?.incomingDamage).toBe(1.5)
    })
  })

  describe('charged', () => {
    it('has_correct_properties', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.charged

      // Assert
      expect(power.id).toBe('charged')
      expect(power.name).toBe('Charged')
      expect(power.stackBehavior).toBe('intensity')
      expect(power.decayOn).toBe('turnEnd')
      expect(power.removeAtZero).toBe(true)
      expect(power.isDebuff).toBe(true)
    })
  })

  describe('oiled', () => {
    it('has_correct_properties', () => {
      // Act
      const power = ELEMENTAL_STATUS_POWERS.oiled

      // Assert
      expect(power.id).toBe('oiled')
      expect(power.name).toBe('Oiled')
      expect(power.stackBehavior).toBe('duration')
      expect(power.decayOn).toBe('turnEnd')
      expect(power.removeAtZero).toBe(true)
      expect(power.isDebuff).toBe(true)
    })
  })

  it('has_all_elemental_statuses', () => {
    // Act
    const statuses = Object.keys(ELEMENTAL_STATUS_POWERS)

    // Assert
    expect(statuses).toContain('burning')
    expect(statuses).toContain('wet')
    expect(statuses).toContain('frozen')
    expect(statuses).toContain('charged')
    expect(statuses).toContain('oiled')
    expect(statuses.length).toBe(5)
  })
})

// ============================================================================
// Elemental Affinity Tests
// ============================================================================

describe('getElementalDamageMultiplier', () => {
  describe('no affinity', () => {
    it('returns_1_with_undefined_affinity', () => {
      // Act
      const multiplier = getElementalDamageMultiplier('fire', undefined)

      // Assert
      expect(multiplier).toBe(1.0)
    })

    it('returns_1_with_empty_affinity', () => {
      // Arrange
      const affinity: ElementalAffinity = {}

      // Act
      const multiplier = getElementalDamageMultiplier('fire', affinity)

      // Assert
      expect(multiplier).toBe(1.0)
    })
  })

  describe('immunities', () => {
    it('returns_0_for_immune_element', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        immunities: ['fire', 'ice'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('fire', affinity)

      // Assert
      expect(multiplier).toBe(0)
    })

    it('immunity_overrides_resistance', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        immunities: ['fire'] as Element[],
        resistances: ['fire'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('fire', affinity)

      // Assert
      expect(multiplier).toBe(0)
    })

    it('immunity_overrides_weakness', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        immunities: ['fire'] as Element[],
        weaknesses: ['fire'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('fire', affinity)

      // Assert
      expect(multiplier).toBe(0)
    })
  })

  describe('resistances', () => {
    it('returns_0_5_for_resistant_element', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        resistances: ['ice', 'void'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('ice', affinity)

      // Assert
      expect(multiplier).toBe(0.5)
    })

    it('returns_1_for_non_resistant_element', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        resistances: ['ice'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('fire', affinity)

      // Assert
      expect(multiplier).toBe(1.0)
    })

    it('resistance_overrides_weakness', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        resistances: ['fire'] as Element[],
        weaknesses: ['fire'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('fire', affinity)

      // Assert
      expect(multiplier).toBe(0.5)
    })
  })

  describe('weaknesses', () => {
    it('returns_1_5_for_weak_element', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        weaknesses: ['lightning', 'physical'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('lightning', affinity)

      // Assert
      expect(multiplier).toBe(1.5)
    })

    it('returns_1_for_non_weak_element', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        weaknesses: ['fire'] as Element[],
      }

      // Act
      const multiplier = getElementalDamageMultiplier('ice', affinity)

      // Assert
      expect(multiplier).toBe(1.0)
    })
  })

  describe('complex affinities', () => {
    it('handles_multiple_resistances_and_weaknesses', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        resistances: ['fire', 'ice'] as Element[],
        weaknesses: ['lightning'] as Element[],
      }

      // Act & Assert
      expect(getElementalDamageMultiplier('fire', affinity)).toBe(0.5)
      expect(getElementalDamageMultiplier('ice', affinity)).toBe(0.5)
      expect(getElementalDamageMultiplier('lightning', affinity)).toBe(1.5)
      expect(getElementalDamageMultiplier('physical', affinity)).toBe(1.0)
    })

    it('handles_all_elements', () => {
      // Arrange
      const affinity: ElementalAffinity = {
        immunities: ['void'] as Element[],
        resistances: ['fire', 'ice'] as Element[],
        weaknesses: ['lightning', 'physical'] as Element[],
      }

      // Act & Assert
      expect(getElementalDamageMultiplier('void', affinity)).toBe(0)
      expect(getElementalDamageMultiplier('fire', affinity)).toBe(0.5)
      expect(getElementalDamageMultiplier('ice', affinity)).toBe(0.5)
      expect(getElementalDamageMultiplier('lightning', affinity)).toBe(1.5)
      expect(getElementalDamageMultiplier('physical', affinity)).toBe(1.5)
    })
  })
})

// ============================================================================
// Combo Registry Tests
// ============================================================================

describe('ELEMENTAL_COMBOS', () => {
  it('has_at_least_6_combos', () => {
    // Assert
    expect(ELEMENTAL_COMBOS.length).toBeGreaterThanOrEqual(6)
  })

  it('all_combos_have_required_fields', () => {
    // Assert
    ELEMENTAL_COMBOS.forEach((combo) => {
      expect(combo.trigger).toBeDefined()
      expect(combo.trigger.length).toBe(2)
      expect(combo.name).toBeDefined()
      expect(combo.effect).toBeDefined()
    })
  })

  it('conducted_combo_exists', () => {
    // Act
    const combo = ELEMENTAL_COMBOS.find((c) => c.name === 'Conducted')

    // Assert
    expect(combo).toBeDefined()
    expect(combo?.trigger).toEqual(['wet', 'lightning'])
  })

  it('flash_freeze_combo_exists', () => {
    // Act
    const combo = ELEMENTAL_COMBOS.find((c) => c.name === 'Flash Freeze')

    // Assert
    expect(combo).toBeDefined()
    expect(combo?.trigger).toEqual(['wet', 'ice'])
  })

  it('explosion_combos_exist', () => {
    // Act
    const explosionCombos = ELEMENTAL_COMBOS.filter((c) => c.name === 'Explosion')

    // Assert - two explosion triggers
    expect(explosionCombos.length).toBe(2)
    expect(explosionCombos.some((c) => c.trigger[0] === 'oiled')).toBe(true)
    expect(explosionCombos.some((c) => c.trigger[0] === 'burning')).toBe(true)
  })

  it('shatter_combo_exists', () => {
    // Act
    const combo = ELEMENTAL_COMBOS.find((c) => c.name === 'Shatter')

    // Assert
    expect(combo).toBeDefined()
    expect(combo?.trigger).toEqual(['frozen', 'physical'])
  })

  it('conduct_combo_exists', () => {
    // Act
    const combo = ELEMENTAL_COMBOS.find((c) => c.name === 'Conduct')

    // Assert
    expect(combo).toBeDefined()
    expect(combo?.trigger).toEqual(['charged', 'ice'])
  })
})

// ============================================================================
// UI Constants Tests
// ============================================================================

describe('ELEMENT_COLORS', () => {
  it('has_all_elements', () => {
    // Act
    const elements = Object.keys(ELEMENT_COLORS)

    // Assert
    expect(elements).toContain('physical')
    expect(elements).toContain('fire')
    expect(elements).toContain('ice')
    expect(elements).toContain('lightning')
    expect(elements).toContain('void')
    expect(elements.length).toBe(5)
  })

  it('all_colors_are_tailwind_classes', () => {
    // Assert
    Object.values(ELEMENT_COLORS).forEach((color) => {
      expect(color).toMatch(/^text-/)
    })
  })
})

describe('ELEMENT_ICONS', () => {
  it('has_all_elements', () => {
    // Act
    const elements = Object.keys(ELEMENT_ICONS)

    // Assert
    expect(elements).toContain('physical')
    expect(elements).toContain('fire')
    expect(elements).toContain('ice')
    expect(elements).toContain('lightning')
    expect(elements).toContain('void')
    expect(elements.length).toBe(5)
  })

  it('all_icons_are_game_icons', () => {
    // Assert
    Object.values(ELEMENT_ICONS).forEach((icon) => {
      expect(icon).toMatch(/^game-icons:/)
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Elemental System Integration', () => {
  it('element_to_status_to_element_round_trip', () => {
    // Arrange
    const elements: Element[] = ['fire', 'ice', 'lightning', 'void']

    // Act & Assert
    elements.forEach((element) => {
      const status = getElementStatus(element)
      if (status) {
        const backToElement = getStatusElement(status)
        expect(backToElement).toBe(element)
      }
    })
  })

  it('all_combos_reference_valid_statuses', () => {
    // Arrange
    const validStatuses: ElementalStatus[] = ['burning', 'wet', 'frozen', 'charged', 'oiled']

    // Assert
    ELEMENTAL_COMBOS.forEach((combo) => {
      const status = combo.trigger[0]
      expect(validStatuses).toContain(status)
    })
  })

  it('all_combos_reference_valid_elements', () => {
    // Arrange
    const validElements: Element[] = ['physical', 'fire', 'ice', 'lightning', 'void']

    // Assert
    ELEMENTAL_COMBOS.forEach((combo) => {
      const element = combo.trigger[1]
      expect(validElements).toContain(element)
    })
  })

  it('all_combo_applied_statuses_are_valid', () => {
    // Arrange
    const validStatuses: ElementalStatus[] = ['burning', 'wet', 'frozen', 'charged', 'oiled']

    // Assert
    ELEMENTAL_COMBOS.forEach((combo) => {
      if (combo.applyStatus) {
        expect(validStatuses).toContain(combo.applyStatus)
      }
    })
  })

  it('affinity_calculation_with_damage_pipeline', () => {
    // Arrange - simulate enemy weak to fire
    const affinity: ElementalAffinity = {
      weaknesses: ['fire'] as Element[],
      resistances: ['ice'] as Element[],
    }
    const baseDamage = 10

    // Act
    const fireDamage = baseDamage * getElementalDamageMultiplier('fire', affinity)
    const iceDamage = baseDamage * getElementalDamageMultiplier('ice', affinity)
    const physicalDamage = baseDamage * getElementalDamageMultiplier('physical', affinity)

    // Assert
    expect(fireDamage).toBe(15) // 1.5x
    expect(iceDamage).toBe(5) // 0.5x
    expect(physicalDamage).toBe(10) // 1.0x
  })

  it('combo_detection_with_multiple_statuses', () => {
    // Arrange - enemy has wet, frozen, and burning
    const statuses = ['wet', 'frozen', 'burning']

    // Act - try different elements
    const lightningCombo = checkElementalCombo(statuses, 'lightning')
    const iceCombo = checkElementalCombo(statuses, 'ice')
    const voidCombo = checkElementalCombo(statuses, 'void')

    // Assert
    expect(lightningCombo?.name).toBe('Conducted') // wet + lightning
    expect(iceCombo?.name).toBe('Flash Freeze') // wet + ice
    expect(voidCombo?.name).toBe('Explosion') // burning + void
  })
})
