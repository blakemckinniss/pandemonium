// Enemy AI handlers
import type { RunState, Entity } from '../../types'
import {
  applyOutgoingDamageModifiers,
  applyIncomingDamageModifiers,
  applyOutgoingBlockModifiers,
  decayPowers,
} from '../powers'
import { applyDamageInternal } from './shared'

// Forward declaration - will be injected to avoid circular deps
let executePowerTriggers: (draft: RunState, entity: Entity, event: string, sourceId?: string) => void

export function setExecutePowerTriggers(fn: typeof executePowerTriggers): void {
  executePowerTriggers = fn
}

export function handleEnemyAction(draft: RunState, enemyId: string): void {
  if (!draft.combat) return

  const enemy = draft.combat.enemies.find((e) => e.id === enemyId)
  if (!enemy) return

  // Decay powers at turn start for enemy
  decayPowers(enemy, 'turnStart')
  if (executePowerTriggers) {
    executePowerTriggers(draft, enemy, 'onTurnStart')
  }

  // Clear enemy block at turn start
  enemy.block = 0

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
        // Trigger onAttacked for player
        executePowerTriggers(draft, draft.combat.player, 'onAttacked', enemyId)
      }
      break
    }
    case 'defend':
      enemy.block += applyOutgoingBlockModifiers(intent.value ?? 0, enemy)
      break
    case 'buff':
      // Intent pattern buff
      break
    case 'debuff':
      // Intent pattern debuff
      break
  }

  // End of enemy turn triggers
  if (executePowerTriggers) {
    executePowerTriggers(draft, enemy, 'onTurnEnd')
  }
  decayPowers(enemy, 'turnEnd')

  // Advance pattern
  enemy.patternIndex = (enemy.patternIndex + 1) % 2
}
