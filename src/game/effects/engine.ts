// Effect execution engine - central dispatcher
import type { RunState, AtomicEffect, EffectContext, Entity } from '../../types'
import { getPowerTriggers } from '../powers'
import { emitVisual } from '../handlers/shared'

// Import all effect executors
import {
  executeDamage,
  executeBlock,
  executeHeal,
  executeLifesteal,
  executeDestroyBlock,
  executeMaxHealth,
  executeSetHealth,
  // Advanced combat effects
  executeExecute,
  executeSplash,
  executeRecoil,
  executeCounterAttack,
  executeChain,
  executeWeakenIntent,
  executeMarkTarget,
  executeReflect,
  executeAmplify,
  executeEnergyNextTurn,
  executeTempMaxEnergy,
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
  // Deck manipulation effects
  executeMill,
  executeCreateRandomCard,
  executeInnate,
  executeEthereal,
  executeUnplayable,
  executeDelayed,
  // Status card effects
  executeAddStatusCard,
  executeRemoveStatusCards,
  setCardEffectsExecuteEffect,
} from './card-effects'
import {
  executeApplyPower,
  executeRemovePower,
  executeTransferPower,
  executeStealPower,
  executeSilencePower,
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
    // Advanced combat effects
    case 'execute':
      executeExecute(draft, effect, ctx)
      break
    case 'splash':
      executeSplash(draft, effect, ctx)
      break
    case 'recoil':
      executeRecoil(draft, effect, ctx)
      break
    case 'counterAttack':
      executeCounterAttack(draft, effect, ctx)
      break
    case 'chain':
      executeChain(draft, effect, ctx)
      break
    case 'weakenIntent':
      executeWeakenIntent(draft, effect, ctx)
      break
    case 'markTarget':
      executeMarkTarget(draft, effect, ctx)
      break
    // Damage manipulation effects
    case 'reflect':
      executeReflect(draft, effect, ctx)
      break
    case 'amplify':
      executeAmplify(draft, effect)
      break
    // Resource manipulation effects
    case 'energyNextTurn':
      executeEnergyNextTurn(draft, effect, ctx)
      break
    case 'tempMaxEnergy':
      executeTempMaxEnergy(draft, effect, ctx)
      break
    // Deck manipulation effects
    case 'mill':
      executeMill(draft, effect, ctx)
      break
    case 'createRandomCard':
      executeCreateRandomCard(draft, effect, ctx)
      break
    case 'innate':
      executeInnate(draft, effect, ctx)
      break
    case 'ethereal':
      executeEthereal(draft, effect, ctx)
      break
    case 'unplayable':
      executeUnplayable(draft, effect, ctx)
      break
    case 'delayed':
      executeDelayed(draft, effect, ctx)
      break
    // Status card effects
    case 'addStatusCard':
      executeAddStatusCard(draft, effect, ctx)
      break
    case 'removeStatusCards':
      executeRemoveStatusCards(draft, effect, ctx)
      break
    // Power manipulation effects
    case 'stealPower':
      executeStealPower(draft, effect, ctx)
      break
    case 'silencePower':
      executeSilencePower(draft, effect, ctx)
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
    // Emit visual feedback for power trigger
    emitVisual(draft, {
      type: 'powerTrigger',
      targetId: entity.id,
      powerId: trigger.powerId,
      triggerEvent: event,
    })

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
