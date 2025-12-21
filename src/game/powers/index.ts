// ============================================
// POWER SYSTEM - Main Exports
// ============================================

// Re-export registry functions
export { registerPower, getPowerDefinition, getAllPowers } from './registry'

// Re-export modifier functions
export {
  applyOutgoingDamageModifiers,
  applyIncomingDamageModifiers,
  applyOutgoingBlockModifiers,
} from './modifiers'

// Re-export application functions
export {
  applyPowerToEntity,
  removePowerFromEntity,
  decayPowers,
  getPowerTriggers,
} from './application'

// Import all power definitions
import { DEBUFF_POWERS } from './debuffs'
import { OFFENSIVE_POWERS } from './offensive'
import { DEFENSIVE_POWERS } from './defensive'
import { UTILITY_POWERS } from './utility'
import { TURN_BASED_POWERS } from './turn-based'
import { SEDUCTIVE_POWERS } from './seductive'
import { ELEMENTAL_STATUS_POWERS } from '../elements'
import { registerPower } from './registry'

// ============================================
// AUTO-REGISTER ALL POWERS
// ============================================

// Register built-in powers
for (const power of DEBUFF_POWERS) {
  registerPower(power)
}

for (const power of OFFENSIVE_POWERS) {
  registerPower(power)
}

for (const power of DEFENSIVE_POWERS) {
  registerPower(power)
}

for (const power of UTILITY_POWERS) {
  registerPower(power)
}

for (const power of TURN_BASED_POWERS) {
  registerPower(power)
}

for (const power of SEDUCTIVE_POWERS) {
  registerPower(power)
}

// Register elemental status effects
for (const power of Object.values(ELEMENTAL_STATUS_POWERS)) {
  registerPower(power)
}
