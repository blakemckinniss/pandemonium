// ============================================
// VALIDATION FUNCTIONS
// ============================================

import type { CardDefinition, CardTheme, AtomicEffect, RelicDefinition, RelicRarity, RelicTrigger } from '../../types'
import { clamp, generateDescription } from './helpers'
import { AtomicEffectSchema } from './schemas/effects'

export interface ValidatedHero {
  name: string
  description: string
  archetype: string
  element: CardDefinition['element']
  heroStats: NonNullable<CardDefinition['heroStats']>
  passive: NonNullable<CardDefinition['passive']>
  activated: NonNullable<CardDefinition['activated']>
  ultimate: NonNullable<CardDefinition['ultimate']>
}

export interface ValidatedEnemy {
  name: string
  description: string
  element: CardDefinition['element']
  enemyStats: NonNullable<CardDefinition['enemyStats']>
  enemyAbility: NonNullable<CardDefinition['enemyAbility']>
  enemyUltimate?: CardDefinition['enemyUltimate']
}

export interface ValidatedRelic {
  name: string
  description: string
  rarity: RelicRarity
  trigger: RelicTrigger
  effects: AtomicEffect[]
}

export function validateCard(card: Partial<CardDefinition>): Omit<CardDefinition, 'id'> {
  // Required fields
  if (!card.name || typeof card.name !== 'string') {
    throw new Error('Card must have a name')
  }

  if (!card.effects || !Array.isArray(card.effects) || card.effects.length === 0) {
    throw new Error('Card must have at least one effect')
  }

  // Defaults and coercion
  // For generated cards, always use simple number energy (LLM should produce numbers)
  const energyValue = typeof card.energy === 'number' ? card.energy : 1

  const validated: Omit<CardDefinition, 'id'> = {
    name: card.name,
    description: card.description || generateDescription(card.effects),
    energy: clamp(energyValue, 0, 5),
    theme: validateTheme(card.theme),
    target: validateTarget(card.target),
    effects: card.effects.map(validateEffect),
    rarity: validateRarity(card.rarity),
    element: validateElement(card.element),
  }

  return validated
}

export function validateEffect(effect: AtomicEffect): AtomicEffect {
  // Use Zod schema for validation
  const result = AtomicEffectSchema.safeParse(effect)

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ')
    throw new Error(`Invalid effect: ${errorMessages}`)
  }

  return result.data as AtomicEffect
}

export function validateTheme(theme: unknown): CardTheme {
  const valid: CardTheme[] = ['attack', 'skill', 'power', 'curse', 'status', 'hero', 'enemy']
  if (typeof theme === 'string' && valid.includes(theme as CardTheme)) {
    return theme as CardTheme
  }
  return 'attack'
}

export function validateTarget(target: unknown): CardDefinition['target'] {
  const valid = ['self', 'player', 'enemy', 'randomEnemy', 'allEnemies', 'weakestEnemy']
  if (typeof target === 'string' && valid.includes(target)) {
    return target as CardDefinition['target']
  }
  return 'enemy'
}

export function validateRarity(rarity: unknown): CardDefinition['rarity'] {
  const valid = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary', 'mythic', 'ancient']
  if (typeof rarity === 'string' && valid.includes(rarity)) {
    return rarity as CardDefinition['rarity']
  }
  return 'common'
}

export function validateElement(element: unknown): CardDefinition['element'] {
  const valid = ['physical', 'fire', 'ice', 'lightning', 'void']
  if (typeof element === 'string' && valid.includes(element)) {
    return element as CardDefinition['element']
  }
  return 'physical'
}

export function validateElementArray(arr: unknown): NonNullable<CardDefinition['element']>[] | undefined {
  if (!Array.isArray(arr)) return undefined
  const valid = ['physical', 'fire', 'ice', 'lightning', 'void'] as const
  const result = arr.filter((e): e is typeof valid[number] => typeof e === 'string' && valid.includes(e as typeof valid[number]))
  return result.length > 0 ? result : undefined
}

export function validateHero(hero: Partial<CardDefinition>): ValidatedHero {
  if (!hero.name || typeof hero.name !== 'string') {
    throw new Error('Hero must have a name')
  }

  // Validate heroStats with defaults
  const heroStats = {
    health: clamp(hero.heroStats?.health ?? 80, 60, 100),
    energy: clamp(hero.heroStats?.energy ?? 3, 2, 4),
    drawPerTurn: clamp(hero.heroStats?.drawPerTurn ?? 5, 4, 6),
  }

  // Validate passive (default to 1 strength if missing)
  const passive = hero.passive && Array.isArray(hero.passive) && hero.passive.length > 0
    ? hero.passive.map(validateEffect)
    : [{ type: 'applyPower' as const, powerId: 'strength', amount: 1, target: 'self' as const }]

  // Validate activated ability
  if (!hero.activated || !hero.activated.effects || !Array.isArray(hero.activated.effects)) {
    throw new Error('Hero must have an activated ability with effects')
  }
  const activated = {
    description: hero.activated.description || 'Activated ability',
    effects: hero.activated.effects.map(validateEffect),
    energyCost: clamp(hero.activated.energyCost ?? 1, 1, 3),
  }

  // Validate ultimate ability
  if (!hero.ultimate || !hero.ultimate.effects || !Array.isArray(hero.ultimate.effects)) {
    throw new Error('Hero must have an ultimate ability with effects')
  }
  const validChargeOn = ['turnStart', 'turnEnd', 'cardPlayed', 'damage'] as const
  const ultimate = {
    description: hero.ultimate.description || 'Ultimate ability',
    effects: hero.ultimate.effects.map(validateEffect),
    chargesRequired: clamp(hero.ultimate.chargesRequired ?? 4, 3, 6),
    chargeOn: validChargeOn.includes(hero.ultimate.chargeOn)
      ? hero.ultimate.chargeOn
      : 'turnStart',
  }

  return {
    name: hero.name,
    description: hero.description || `A mysterious ${hero.archetype || 'hero'}.`,
    archetype: hero.archetype || 'Unknown',
    element: validateElement(hero.element),
    heroStats,
    passive,
    activated,
    ultimate,
  }
}

export function validateEnemy(data: Record<string, unknown>): ValidatedEnemy {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Enemy must have a name')
  }

  // Validate enemyStats
  const rawStats = data.enemyStats as Record<string, unknown> | undefined
  if (!rawStats) {
    throw new Error('Enemy must have enemyStats')
  }

  const healthRange = Array.isArray(rawStats.healthRange)
    ? [clamp(Number(rawStats.healthRange[0]) || 20, 10, 200), clamp(Number(rawStats.healthRange[1]) || 30, 15, 250)]
    : [20, 30]

  const enemyStats: NonNullable<CardDefinition['enemyStats']> = {
    healthRange: healthRange as [number, number],
    baseDamage: clamp(Number(rawStats.baseDamage) || 6, 2, 30),
    energy: clamp(Number(rawStats.energy) || 2, 1, 5),
    element: validateElement(rawStats.element ?? data.element),
    vulnerabilities: validateElementArray(data.vulnerabilities),
    resistances: validateElementArray(data.resistances),
  }

  // Validate enemyAbility
  const rawAbility = data.enemyAbility as Record<string, unknown> | undefined
  if (!rawAbility || !rawAbility.effects || !Array.isArray(rawAbility.effects)) {
    throw new Error('Enemy must have an enemyAbility with effects')
  }

  const enemyAbility: NonNullable<CardDefinition['enemyAbility']> = {
    id: typeof rawAbility.id === 'string' ? rawAbility.id : 'ability',
    name: typeof rawAbility.name === 'string' ? rawAbility.name : 'Attack',
    description: typeof rawAbility.description === 'string' ? rawAbility.description : 'A special attack',
    effects: (rawAbility.effects as AtomicEffect[]).map(validateEffect),
    energyCost: clamp(Number(rawAbility.energyCost) || 1, 1, 4),
    cooldown: rawAbility.cooldown ? clamp(Number(rawAbility.cooldown), 0, 5) : undefined,
  }

  // Validate enemyUltimate (optional for Tier 1 enemies)
  let enemyUltimate: CardDefinition['enemyUltimate'] | undefined
  const rawUltimate = data.enemyUltimate as Record<string, unknown> | undefined
  if (rawUltimate && rawUltimate.effects && Array.isArray(rawUltimate.effects)) {
    const validTriggers = ['lowHealth', 'enraged', 'turnCount'] as const
    const trigger = validTriggers.includes(rawUltimate.trigger as typeof validTriggers[number])
      ? rawUltimate.trigger as typeof validTriggers[number]
      : 'lowHealth'

    enemyUltimate = {
      id: typeof rawUltimate.id === 'string' ? rawUltimate.id : 'ultimate',
      name: typeof rawUltimate.name === 'string' ? rawUltimate.name : 'Desperation',
      description: typeof rawUltimate.description === 'string' ? rawUltimate.description : 'A desperate attack',
      effects: (rawUltimate.effects as AtomicEffect[]).map(validateEffect),
      trigger,
      triggerValue: clamp(Number(rawUltimate.triggerValue) || 30, 10, 100),
    }
  }

  return {
    name: data.name,
    description: typeof data.description === 'string' ? data.description : `A dangerous ${String(data.name)}.`,
    element: validateElement(data.element),
    enemyStats,
    enemyAbility,
    enemyUltimate,
  }
}

export function difficultyToRarity(difficulty: number): CardDefinition['rarity'] {
  if (difficulty >= 3) return 'rare'
  if (difficulty >= 2) return 'uncommon'
  return 'common'
}

export function validateRelicRarity(rarity: unknown): RelicRarity {
  const valid: RelicRarity[] = ['common', 'uncommon', 'rare', 'boss']
  if (typeof rarity === 'string' && valid.includes(rarity as RelicRarity)) {
    return rarity as RelicRarity
  }
  return 'common'
}

export function validateRelicTrigger(trigger: unknown): RelicTrigger {
  const valid: RelicTrigger[] = [
    'onCombatStart', 'onCombatEnd', 'onTurnStart', 'onTurnEnd',
    'onCardPlay', 'onAttack', 'onKill', 'onDamaged', 'onHeal', 'onBlock', 'passive'
  ]
  if (typeof trigger === 'string' && valid.includes(trigger as RelicTrigger)) {
    return trigger as RelicTrigger
  }
  return 'onCombatStart'
}

export function validateRelic(data: Record<string, unknown>): ValidatedRelic {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Relic must have a name')
  }

  if (!data.effects || !Array.isArray(data.effects) || data.effects.length === 0) {
    throw new Error('Relic must have at least one effect')
  }

  return {
    name: data.name,
    description: typeof data.description === 'string' ? data.description : `A mysterious relic.`,
    rarity: validateRelicRarity(data.rarity),
    trigger: validateRelicTrigger(data.trigger),
    effects: (data.effects as AtomicEffect[]).map(validateEffect),
  }
}
