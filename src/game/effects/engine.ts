// Effect execution engine - central dispatcher
import type { RunState, AtomicEffect, EffectContext, Entity } from '../../types'
import { getPowerTriggers } from '../powers'

// Import all effect executors
import {
  executeDamage,
  executeBlock,
  executeHeal,
  executeLifesteal,
  executeDestroyBlock,
  executeMaxHealth,
  executeSetHealth,
  setExecuteEffect as setCombatExecuteEffect,
  setExecutePowerTriggers as setCombatPowerTriggers,
} from './combat-effects'
import {
  executeEnergy,
  executeDraw,
  executeDiscard,
  executeExhaust,
  executeBanish,
  executeAddCard,
  executeShuffle,
  executeRetain,
  executeCopyCard,
  executePutOnDeck,
  executeModifyCost,
  executeReplayCard,
  executePlayTopCard,
  executeGold,
  executeDiscover,
  setCardEffectsExecuteEffect,
} from './card-effects'
import {
  executeApplyPower,
  executeRemovePower,
  executeTransferPower,
} from './power-effects'
import {
  executeConditional,
  executeRepeat,
  executeRandom,
  executeSequence,
  executeForEach,
  setExecuteEffect as setControlExecuteEffect,
} from './control-effects'

// Import selection effects (already extracted)
import {
  executeScry,
  executeTutor,
  executeUpgrade,
  executeTransform,
} from '../selection-effects'

/**
 * Main effect dispatcher - routes effects to their handlers
 */
export function executeEffect(
  draft: RunState,
  effect: AtomicEffect,
  ctx: EffectContext
): void {
  if (!draft.combat) return

  switch (effect.type) {
    case 'damage':
      executeDamage(draft, effect, ctx)
      break
    case 'block':
      executeBlock(draft, effect, ctx)
      break
    case 'heal':
      executeHeal(draft, effect, ctx)
      break
    case 'lifesteal':
      executeLifesteal(draft, effect, ctx)
      break
    case 'energy':
      executeEnergy(draft, effect, ctx)
      break
    case 'draw':
      executeDraw(draft, effect, ctx)
      break
    case 'discard':
      executeDiscard(draft, effect, ctx)
      break
    case 'exhaust':
      executeExhaust(draft, effect, ctx)
      break
    case 'banish':
      executeBanish(draft, effect, ctx)
      break
    case 'addCard':
      executeAddCard(draft, effect, ctx)
      break
    case 'shuffle':
      executeShuffle(draft, effect, ctx)
      break
    case 'upgrade':
      executeUpgrade(draft, effect, ctx)
      break
    case 'retain':
      executeRetain(draft, effect, ctx)
      break
    case 'transform':
      executeTransform(draft, effect, ctx)
      break
    case 'scry':
      executeScry(draft, effect, ctx)
      break
    case 'tutor':
      executeTutor(draft, effect, ctx)
      break
    case 'applyPower':
      executeApplyPower(draft, effect, ctx)
      break
    case 'removePower':
      executeRemovePower(draft, effect, ctx)
      break
    case 'transferPower':
      executeTransferPower(draft, effect, ctx)
      break
    case 'destroyBlock':
      executeDestroyBlock(draft, effect, ctx)
      break
    case 'maxHealth':
      executeMaxHealth(draft, effect, ctx)
      break
    case 'setHealth':
      executeSetHealth(draft, effect, ctx)
      break
    case 'copyCard':
      executeCopyCard(draft, effect, ctx)
      break
    case 'putOnDeck':
      executePutOnDeck(draft, effect, ctx)
      break
    case 'modifyCost':
      executeModifyCost(draft, effect, ctx)
      break
    case 'replayCard':
      executeReplayCard(draft, effect, ctx)
      break
    case 'playTopCard':
      executePlayTopCard(draft, effect, ctx)
      break
    case 'gold':
      executeGold(draft, effect, ctx)
      break
    case 'discover':
      executeDiscover(draft, effect, ctx)
      break
    case 'conditional':
      executeConditional(draft, effect, ctx)
      break
    case 'repeat':
      executeRepeat(draft, effect, ctx)
      break
    case 'random':
      executeRandom(draft, effect, ctx)
      break
    case 'sequence':
      executeSequence(draft, effect, ctx)
      break
    case 'forEach':
      executeForEach(draft, effect, ctx)
      break
  }
}

/**
 * Execute power triggers for an entity
 */
export function executePowerTriggers(
  draft: RunState,
  entity: Entity,
  event: string,
  sourceId?: string
): void {
  const triggers = getPowerTriggers(entity, event)

  for (const trigger of triggers) {
    const ctx: EffectContext = {
      source: entity.id,
      powerId: trigger.powerId,
      powerStacks: trigger.stacks,
      currentTarget: sourceId,
    }

    for (const effect of trigger.effects) {
      executeEffect(draft, effect, ctx)
    }
  }
}

// Wire up circular dependencies
setCombatExecuteEffect(executeEffect)
setCombatPowerTriggers(executePowerTriggers)
setControlExecuteEffect(executeEffect)
setCardEffectsExecuteEffect(executeEffect)
