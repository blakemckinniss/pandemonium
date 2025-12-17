// ============================================
// POWER REGISTRY
// ============================================

import type { PowerDefinition } from '../../types'

const powerRegistry = new Map<string, PowerDefinition>()

export function registerPower(power: PowerDefinition): void {
  powerRegistry.set(power.id, power)
}

export function getPowerDefinition(id: string): PowerDefinition | undefined {
  return powerRegistry.get(id)
}

export function getAllPowers(): PowerDefinition[] {
  return Array.from(powerRegistry.values())
}
