// ============================================
// POWER SYSTEM - Registry & Definitions
// ============================================

import type { PowerDefinition, Entity } from '../types'

// ============================================
// POWER REGISTRY
// ============================================

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

// ============================================
// BUILT-IN POWERS
// ============================================

// --- DEBUFFS ---

registerPower({
  id: 'vulnerable',
  name: 'Vulnerable',
  description: 'Takes 50% more damage. {amount} turn(s).',
  stackBehavior: 'duration',
  modifiers: { incomingDamage: 1.5 },
  decayOn: 'turnEnd',
  removeAtZero: true,
  isDebuff: true,
})

registerPower({
  id: 'weak',
  name: 'Weak',
  description: 'Deals 25% less damage. {amount} turn(s).',
  stackBehavior: 'duration',
  modifiers: { outgoingDamage: 0.75 },
  decayOn: 'turnEnd',
  removeAtZero: true,
  isDebuff: true,
})

registerPower({
  id: 'frail',
  name: 'Frail',
  description: 'Block gained is 25% less effective. {amount} turn(s).',
  stackBehavior: 'duration',
  modifiers: { outgoingBlock: 0.75 },
  decayOn: 'turnEnd',
  removeAtZero: true,
  isDebuff: true,
})

registerPower({
  id: 'poison',
  name: 'Poison',
  description: 'Takes {amount} damage at turn start. Loses 1 stack.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onTurnStart',
      effects: [
        {
          type: 'damage',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'self',
          piercing: true,
        },
      ],
    },
  ],
  decayOn: 'turnStart',
  removeAtZero: true,
  isDebuff: true,
})

// --- BUFFS ---

registerPower({
  id: 'strength',
  name: 'Strength',
  description: 'Deals {amount} additional damage.',
  stackBehavior: 'intensity',
  // Note: Strength is additive, handled specially in damage calc
})

registerPower({
  id: 'dexterity',
  name: 'Dexterity',
  description: 'Gains {amount} additional Block.',
  stackBehavior: 'intensity',
  // Note: Dexterity is additive, handled specially in block calc
})

registerPower({
  id: 'thorns',
  name: 'Thorns',
  description: 'When attacked, deal {amount} damage back.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onAttacked',
      effects: [
        {
          type: 'damage',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'source',
        },
      ],
    },
  ],
})

registerPower({
  id: 'regen',
  name: 'Regeneration',
  description: 'Heal {amount} HP at turn end.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onTurnEnd',
      effects: [
        {
          type: 'heal',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'self',
        },
      ],
    },
  ],
  decayOn: 'turnEnd',
  removeAtZero: true,
})

registerPower({
  id: 'ritual',
  name: 'Ritual',
  description: 'Gain {amount} Strength at turn end.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onTurnEnd',
      effects: [
        {
          type: 'applyPower',
          powerId: 'strength',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'self',
        },
      ],
    },
  ],
})

registerPower({
  id: 'metallicize',
  name: 'Metallicize',
  description: 'Gain {amount} Block at turn end.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onTurnEnd',
      effects: [
        {
          type: 'block',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'self',
        },
      ],
    },
  ],
})

registerPower({
  id: 'platedArmor',
  name: 'Plated Armor',
  description: 'Gain {amount} Block at turn end. Lose 1 when taking unblocked damage.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onTurnEnd',
      effects: [
        {
          type: 'block',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'self',
        },
      ],
    },
    {
      event: 'onDamaged',
      effects: [
        {
          type: 'removePower',
          powerId: 'platedArmor',
          amount: 1,
          target: 'self',
        },
      ],
    },
  ],
  removeAtZero: true,
})

registerPower({
  id: 'anger',
  name: 'Anger',
  description: 'Gain {amount} Strength when attacked.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onAttacked',
      effects: [
        {
          type: 'applyPower',
          powerId: 'strength',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'self',
        },
      ],
    },
  ],
})

registerPower({
  id: 'blockRetaliation',
  name: 'Block Retaliation',
  description: 'When you gain Block, deal {amount} damage to a random enemy.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onBlock',
      effects: [
        {
          type: 'damage',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'randomEnemy',
        },
      ],
    },
  ],
})

registerPower({
  id: 'lifelink',
  name: 'Lifelink',
  description: 'When you attack, heal {amount} HP.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onAttack',
      effects: [
        {
          type: 'heal',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          target: 'self',
        },
      ],
    },
  ],
})

registerPower({
  id: 'energizeOnKill',
  name: 'Energize on Kill',
  description: 'When you kill an enemy, gain {amount} Energy.',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onKill',
      effects: [
        {
          type: 'energy',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
          operation: 'gain',
        },
      ],
    },
  ],
})

registerPower({
  id: 'drawOnKill',
  name: 'Draw on Kill',
  description: 'When you kill an enemy, draw {amount} card(s).',
  stackBehavior: 'intensity',
  triggers: [
    {
      event: 'onKill',
      effects: [
        {
          type: 'draw',
          amount: { type: 'scaled', base: 0, perUnit: 1, source: 'powerStacks' },
        },
      ],
    },
  ],
})

// ============================================
// DAMAGE/BLOCK MODIFIERS
// ============================================

/**
 * Apply outgoing damage modifiers (Strength, Weak)
 * Strength: +X flat damage
 * Weak: *0.75 multiplier
 */
export function applyOutgoingDamageModifiers(
  baseDamage: number,
  attacker: Entity
): number {
  let damage = baseDamage

  // Strength: additive
  const strength = attacker.powers['strength']
  if (strength) {
    damage += strength.amount
  }

  // Weak: multiplicative (round down)
  const weak = attacker.powers['weak']
  if (weak) {
    const weakDef = getPowerDefinition('weak')
    if (weakDef?.modifiers?.outgoingDamage) {
      damage = Math.floor(damage * weakDef.modifiers.outgoingDamage)
    }
  }

  return Math.max(0, damage)
}

/**
 * Apply incoming damage modifiers (Vulnerable)
 * Vulnerable: *1.5 multiplier
 */
export function applyIncomingDamageModifiers(
  baseDamage: number,
  defender: Entity
): number {
  let damage = baseDamage

  // Vulnerable: multiplicative (round down)
  const vulnerable = defender.powers['vulnerable']
  if (vulnerable) {
    const vulnDef = getPowerDefinition('vulnerable')
    if (vulnDef?.modifiers?.incomingDamage) {
      damage = Math.floor(damage * vulnDef.modifiers.incomingDamage)
    }
  }

  return Math.max(0, damage)
}

/**
 * Apply outgoing block modifiers (Dexterity, Frail)
 * Dexterity: +X flat block
 * Frail: *0.75 multiplier
 */
export function applyOutgoingBlockModifiers(
  baseBlock: number,
  blocker: Entity
): number {
  let block = baseBlock

  // Dexterity: additive
  const dexterity = blocker.powers['dexterity']
  if (dexterity) {
    block += dexterity.amount
  }

  // Frail: multiplicative (round down)
  const frail = blocker.powers['frail']
  if (frail) {
    const frailDef = getPowerDefinition('frail')
    if (frailDef?.modifiers?.outgoingBlock) {
      block = Math.floor(block * frailDef.modifiers.outgoingBlock)
    }
  }

  return Math.max(0, block)
}

// ============================================
// POWER APPLICATION
// ============================================

/**
 * Apply a power to an entity, respecting stack behavior
 */
export function applyPowerToEntity(
  entity: Entity,
  powerId: string,
  amount: number,
  duration?: number
): void {
  const powerDef = getPowerDefinition(powerId)
  if (!powerDef) {
    console.warn(`Unknown power: ${powerId}`)
    return
  }

  const existing = entity.powers[powerId]

  if (existing) {
    // Stack based on behavior
    switch (powerDef.stackBehavior) {
      case 'intensity':
        existing.amount += amount
        break
      case 'duration':
        // Duration powers use amount as turns remaining
        existing.amount = Math.max(existing.amount, amount)
        break
      case 'both':
        existing.amount += amount
        if (duration !== undefined) {
          existing.duration = Math.max(existing.duration ?? 0, duration)
        }
        break
    }
  } else {
    // New power
    entity.powers[powerId] = {
      id: powerId,
      amount,
      duration,
    }
  }
}

/**
 * Remove power stacks from an entity
 */
export function removePowerFromEntity(
  entity: Entity,
  powerId: string,
  amount?: number
): void {
  const existing = entity.powers[powerId]
  if (!existing) return

  if (amount === undefined) {
    // Remove all
    delete entity.powers[powerId]
  } else {
    existing.amount -= amount
    const powerDef = getPowerDefinition(powerId)
    if (existing.amount <= 0 && powerDef?.removeAtZero) {
      delete entity.powers[powerId]
    }
  }
}

/**
 * Decay powers at turn start/end
 */
export function decayPowers(
  entity: Entity,
  event: 'turnStart' | 'turnEnd'
): void {
  for (const [powerId, power] of Object.entries(entity.powers)) {
    const def = getPowerDefinition(powerId)
    if (!def) continue

    if (def.decayOn === event) {
      power.amount -= 1
      if (power.amount <= 0 && def.removeAtZero) {
        delete entity.powers[powerId]
      }
    }
  }
}

/**
 * Get all triggers for an entity for a specific event
 */
export function getPowerTriggers(
  entity: Entity,
  event: string
): Array<{ powerId: string; stacks: number; effects: import('../types').AtomicEffect[] }> {
  const triggers: Array<{
    powerId: string
    stacks: number
    effects: import('../types').AtomicEffect[]
  }> = []

  for (const [powerId, power] of Object.entries(entity.powers)) {
    const def = getPowerDefinition(powerId)
    if (!def?.triggers) continue

    for (const trigger of def.triggers) {
      if (trigger.event === event) {
        triggers.push({
          powerId,
          stacks: power.amount,
          effects: trigger.effects,
        })
      }
    }
  }

  return triggers
}
