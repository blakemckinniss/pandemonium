// ============================================
// ELEMENTAL SYSTEM
// ============================================

export type Element = 'physical' | 'fire' | 'ice' | 'lightning' | 'void'

// Elemental statuses that can be applied to entities
export type ElementalStatus = 'burning' | 'wet' | 'frozen' | 'charged' | 'oiled'

// Elemental combo definitions
export interface ElementalCombo {
  trigger: [ElementalStatus, Element] // Status on target + incoming element
  name: string
  effect: 'chainDamage' | 'explosion' | 'shatter' | 'conduct' | 'flashFreeze'
  damageMultiplier?: number
  bonusDamage?: number
  removeStatus?: boolean
  applyStatus?: ElementalStatus
  chainToAll?: boolean // For chain lightning
  executeThreshold?: number // For shatter (kills if below X% HP)
}
