/**
 * Elemental System
 * Defines elemental combos, status effects, and damage modifiers
 */

import type { Element, ElementalStatus, ElementalCombo, PowerDefinition } from '../types'

// ============================================
// ELEMENTAL COMBOS
// ============================================

export const ELEMENTAL_COMBOS: ElementalCombo[] = [
  // Wet + Lightning = Chain Lightning
  {
    trigger: ['wet', 'lightning'],
    name: 'Conducted',
    effect: 'chainDamage',
    damageMultiplier: 1.5,
    removeStatus: true,
    chainToAll: true,
  },
  // Wet + Ice = Flash Freeze (permanent frozen)
  {
    trigger: ['wet', 'ice'],
    name: 'Flash Freeze',
    effect: 'flashFreeze',
    damageMultiplier: 1.0,
    removeStatus: true,
    applyStatus: 'frozen',
  },
  // Burning + Oiled = Explosion
  {
    trigger: ['oiled', 'fire'],
    name: 'Explosion',
    effect: 'explosion',
    damageMultiplier: 2.0,
    removeStatus: true,
  },
  // Also trigger explosion if already burning and we apply oil
  {
    trigger: ['burning', 'void'], // Void element applies oil effects
    name: 'Explosion',
    effect: 'explosion',
    damageMultiplier: 2.0,
    removeStatus: true,
  },
  // Frozen + Physical = Shatter
  {
    trigger: ['frozen', 'physical'],
    name: 'Shatter',
    effect: 'shatter',
    damageMultiplier: 1.5,
    removeStatus: true,
    executeThreshold: 0.15, // Kills if below 15% HP
  },
  // Charged + Water (Wet status means water affinity)
  {
    trigger: ['charged', 'ice'], // Ice is water-based
    name: 'Conduct',
    effect: 'conduct',
    bonusDamage: 5,
    removeStatus: true,
  },
]

/**
 * Check for elemental combo when dealing damage
 */
export function checkElementalCombo(
  targetStatuses: string[],
  incomingElement: Element
): ElementalCombo | undefined {
  for (const combo of ELEMENTAL_COMBOS) {
    const [requiredStatus, requiredElement] = combo.trigger
    if (targetStatuses.includes(requiredStatus) && incomingElement === requiredElement) {
      return combo
    }
  }
  return undefined
}

/**
 * Get element that applies a status
 */
export function getStatusElement(status: ElementalStatus): Element {
  switch (status) {
    case 'burning': return 'fire'
    case 'wet': return 'ice' // Water/ice affinity
    case 'frozen': return 'ice'
    case 'charged': return 'lightning'
    case 'oiled': return 'void'
  }
}

/**
 * Get status applied by an element
 */
export function getElementStatus(element: Element): ElementalStatus | undefined {
  switch (element) {
    case 'fire': return 'burning'
    case 'ice': return 'frozen'
    case 'lightning': return 'charged'
    case 'void': return 'oiled'
    case 'physical': return undefined
  }
}

// ============================================
// ELEMENTAL STATUS POWER DEFINITIONS
// ============================================

export const ELEMENTAL_STATUS_POWERS: Record<ElementalStatus, PowerDefinition> = {
  burning: {
    id: 'burning',
    name: 'Burning',
    description: 'Takes {amount} fire damage at turn start. Decreases by 1.',
    stackBehavior: 'intensity',
    triggers: [
      {
        event: 'onTurnStart',
        effects: [{ type: 'damage', amount: { type: 'powerAmount' }, element: 'fire' }],
      },
    ],
    decayOn: 'turnStart',
    removeAtZero: true,
    isDebuff: true,
    icon: 'game-icons:fire',
  },
  wet: {
    id: 'wet',
    name: 'Wet',
    description: 'Soaked. Vulnerable to lightning (chain) and ice (flash freeze).',
    stackBehavior: 'duration',
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
    icon: 'game-icons:water-drop',
  },
  frozen: {
    id: 'frozen',
    name: 'Frozen',
    description: 'Cannot act. Takes 50% more physical damage (Shatter).',
    stackBehavior: 'duration',
    modifiers: {
      incomingDamage: 1.5, // Only for physical, but we'll handle this specially
    },
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
    icon: 'game-icons:frozen-orb',
  },
  charged: {
    id: 'charged',
    name: 'Charged',
    description: 'Crackling with electricity. Next attack chains to nearby.',
    stackBehavior: 'intensity',
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
    icon: 'game-icons:lightning-storm',
  },
  oiled: {
    id: 'oiled',
    name: 'Oiled',
    description: 'Covered in oil. Fire damage causes Explosion (2x damage).',
    stackBehavior: 'duration',
    decayOn: 'turnEnd',
    removeAtZero: true,
    isDebuff: true,
    icon: 'game-icons:oil-drum',
  },
}

// ============================================
// ELEMENTAL WEAKNESS/RESISTANCE
// ============================================

export interface ElementalAffinity {
  weaknesses?: Element[]
  resistances?: Element[]
  immunities?: Element[]
}

/**
 * Calculate damage multiplier based on elemental affinity
 */
export function getElementalDamageMultiplier(
  element: Element,
  affinity?: ElementalAffinity
): number {
  if (!affinity) return 1.0

  if (affinity.immunities?.includes(element)) return 0
  if (affinity.resistances?.includes(element)) return 0.5
  if (affinity.weaknesses?.includes(element)) return 1.5

  return 1.0
}

// ============================================
// ELEMENT COLORS (for UI)
// ============================================

export const ELEMENT_COLORS: Record<Element, string> = {
  physical: 'text-gray-300',
  fire: 'text-orange-400',
  ice: 'text-cyan-400',
  lightning: 'text-yellow-300',
  void: 'text-purple-400',
}

export const ELEMENT_ICONS: Record<Element, string> = {
  physical: 'game-icons:sword-wound',
  fire: 'game-icons:fire',
  ice: 'game-icons:snowflake-1',
  lightning: 'game-icons:lightning-bolt',
  void: 'game-icons:portal',
}
