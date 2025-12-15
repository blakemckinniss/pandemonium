// Enemy AI handlers
import type { RunState, Entity, EnemyEntity, AtomicEffect, EffectContext } from '../../types'
import {
  applyOutgoingDamageModifiers,
  applyIncomingDamageModifiers,
  applyOutgoingBlockModifiers,
  decayPowers,
} from '../powers'
import { applyDamageInternal, emitVisual } from './shared'
import { getEnemyCardById } from '../cards'

// Forward declarations - will be injected to avoid circular deps
let executePowerTriggers: (draft: RunState, entity: Entity, event: string, sourceId?: string) => void
let executeEffect: (draft: RunState, effect: AtomicEffect, ctx: EffectContext) => void

export function setExecutePowerTriggers(fn: typeof executePowerTriggers): void {
  executePowerTriggers = fn
}

export function setExecuteEffect(fn: typeof executeEffect): void {
  executeEffect = fn
}

/**
 * Check if enemy ultimate should trigger based on current state.
 */
function shouldTriggerUltimate(enemy: EnemyEntity, turnCount: number): boolean {
  // Already triggered this combat
  if (enemy.ultimateTriggered) return false

  // No card reference means no ultimate
  if (!enemy.cardId) return false

  const card = getEnemyCardById(enemy.cardId)
  if (!card?.enemyUltimate) return false

  const { trigger, triggerValue } = card.enemyUltimate

  switch (trigger) {
    case 'lowHealth': {
      const healthPercent = (enemy.currentHealth / enemy.maxHealth) * 100
      return healthPercent <= (triggerValue ?? 30)
    }
    case 'enraged': {
      // Trigger when significant damage taken (could track accumulated damage)
      // For simplicity, use health lost percentage
      const healthLost = enemy.maxHealth - enemy.currentHealth
      return healthLost >= (triggerValue ?? enemy.maxHealth * 0.5)
    }
    case 'turnCount': {
      return turnCount >= (triggerValue ?? 3)
    }
    default:
      return false
  }
}

/**
 * Check if enemy can use their ability (has energy, not on cooldown).
 */
function canUseAbility(enemy: EnemyEntity): boolean {
  if (!enemy.cardId) return false

  const card = getEnemyCardById(enemy.cardId)
  if (!card?.enemyAbility) return false

  // Check cooldown
  if ((enemy.abilityCooldown ?? 0) > 0) return false

  // Check energy cost
  const cost = card.enemyAbility.energyCost ?? 1
  if ((enemy.energy ?? 0) < cost) return false

  return true
}

/**
 * Execute enemy ability effects.
 */
function executeEnemyAbility(draft: RunState, enemy: EnemyEntity): boolean {
  if (!draft.combat) return false
  if (!enemy.cardId) return false

  const card = getEnemyCardById(enemy.cardId)
  if (!card?.enemyAbility) return false

  const { effects, energyCost, cooldown } = card.enemyAbility

  // Deduct energy
  enemy.energy = (enemy.energy ?? 0) - (energyCost ?? 1)

  // Set cooldown
  if (cooldown) {
    enemy.abilityCooldown = cooldown
  }

  // Execute effects with enemy as source and player as default target
  if (executeEffect) {
    const ctx: EffectContext = { source: enemy.id, currentTarget: draft.combat.player.id }
    for (const effect of effects) {
      executeEffect(draft, effect, ctx)
    }
  }

  // Emit visual event
  emitVisual(draft, {
    type: 'enemyAbility',
    entityId: enemy.id,
    abilityName: card.enemyAbility.name,
  })

  return true
}

/**
 * Execute enemy ultimate effects.
 */
function executeEnemyUltimate(draft: RunState, enemy: EnemyEntity): boolean {
  if (!draft.combat) return false
  if (!enemy.cardId) return false

  const card = getEnemyCardById(enemy.cardId)
  if (!card?.enemyUltimate) return false

  // Mark as triggered
  enemy.ultimateTriggered = true

  // Execute effects with enemy as source and player as default target
  if (executeEffect) {
    const ctx: EffectContext = { source: enemy.id, currentTarget: draft.combat.player.id }
    for (const effect of card.enemyUltimate.effects) {
      executeEffect(draft, effect, ctx)
    }
  }

  // Emit visual event
  emitVisual(draft, {
    type: 'enemyUltimate',
    entityId: enemy.id,
    ultimateName: card.enemyUltimate.name,
  })

  return true
}

/**
 * Execute basic intent action (attack/defend/buff/debuff).
 */
function executeBasicIntent(draft: RunState, enemy: EnemyEntity): void {
  if (!draft.combat) return

  const intent = enemy.intent

  switch (intent.type) {
    case 'attack': {
      const baseDamage = intent.value ?? 0
      const damage = applyOutgoingDamageModifiers(baseDamage, enemy)
      const finalDamage = applyIncomingDamageModifiers(damage, draft.combat.player)
      applyDamageInternal(draft, 'player', finalDamage)

      // Trigger onAttack for enemy
      if (executePowerTriggers) {
        executePowerTriggers(draft, enemy, 'onAttack')
        executePowerTriggers(draft, draft.combat.player, 'onAttacked', enemy.id)
      }
      break
    }
    case 'defend':
      enemy.block += applyOutgoingBlockModifiers(intent.value ?? 0, enemy)
      break
    case 'buff':
      // Intent pattern buff - handled by pattern system
      break
    case 'debuff':
      // Intent pattern debuff - handled by pattern system
      break
  }
}

export function handleEnemyAction(draft: RunState, enemyId: string): void {
  if (!draft.combat) return

  const enemy = draft.combat.enemies.find((e) => e.id === enemyId)
  if (!enemy) return

  // === TURN START ===

  // Decay powers at turn start for enemy
  decayPowers(enemy, 'turnStart')
  if (executePowerTriggers) {
    executePowerTriggers(draft, enemy, 'onTurnStart')
  }

  // Clear enemy block at turn start
  enemy.block = 0

  // Regenerate energy for enemies with energy pools
  if (enemy.maxEnergy !== undefined) {
    enemy.energy = enemy.maxEnergy
  }

  // === ACTION PHASE ===

  // Track turn count for ultimate triggers (use patternIndex as proxy)
  const turnCount = enemy.patternIndex + 1

  // Priority 1: Check if ultimate should trigger
  if (shouldTriggerUltimate(enemy, turnCount)) {
    executeEnemyUltimate(draft, enemy)
  }
  // Priority 2: Use ability if available
  else if (canUseAbility(enemy)) {
    executeEnemyAbility(draft, enemy)
  }
  // Priority 3: Execute basic intent
  else {
    executeBasicIntent(draft, enemy)
  }

  // === TURN END ===

  // End of enemy turn triggers
  if (executePowerTriggers) {
    executePowerTriggers(draft, enemy, 'onTurnEnd')
  }
  decayPowers(enemy, 'turnEnd')

  // Decrement ability cooldowns
  if ((enemy.abilityCooldown ?? 0) > 0) {
    enemy.abilityCooldown = (enemy.abilityCooldown ?? 0) - 1
  }

  // Advance pattern
  enemy.patternIndex = (enemy.patternIndex + 1) % 2
}
