// Main action dispatcher - delegates to specialized handlers
import { produce } from 'immer'
import type { RunState, GameAction, CardInstance } from '../types'
import { generateUid } from '../lib/utils'

// Import handlers
import {
  handleStartCombat,
  handleEndCombat,
  handleClearVisualQueue,
  setTurnsPowerTriggers,
  setCardsExecuteEffect,
  setCardsPowerTriggers,
  setEnemyPowerTriggers,
} from './handlers'
import { handleStartTurn, handleEndTurn } from './handlers/turns'
import { handleDrawCards, handlePlayCard, handleDiscardCard, handleDiscardHand } from './handlers/cards'
import { handleDamage, handleHeal, handleAddBlock } from './handlers/damage'
import { handleSpendEnergy, handleGainEnergy, handleApplyPower } from './handlers/energy'
import { handleEnemyAction } from './handlers/enemy'
import { handleSelectRoom, handleDealRoomChoices } from './handlers/rooms'
import { shuffleArray } from './handlers/shared'

// Import effects engine
import { executeEffect, executePowerTriggers } from './effects'

// Import selection effect handlers
import { handleResolveScry, handleResolveTutor, handleResolveDiscover, handleResolveBanish } from './selection-effects'

// Wire up dependencies between handlers and effects
setTurnsPowerTriggers(executePowerTriggers)
setCardsExecuteEffect(executeEffect)
setCardsPowerTriggers(executePowerTriggers)
setEnemyPowerTriggers(executePowerTriggers)

/**
 * Main action dispatcher - applies game actions to state via Immer
 */
export function applyAction(state: RunState, action: GameAction): RunState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'startCombat':
        handleStartCombat(draft, action.enemies)
        break
      case 'endCombat':
        handleEndCombat(draft, action.victory)
        break
      case 'startTurn':
        handleStartTurn(draft)
        break
      case 'endTurn':
        handleEndTurn(draft)
        break
      case 'drawCards':
        handleDrawCards(draft, action.amount)
        break
      case 'playCard':
        handlePlayCard(draft, action.cardUid, action.targetId)
        break
      case 'discardCard':
        handleDiscardCard(draft, action.cardUid)
        break
      case 'discardHand':
        handleDiscardHand(draft)
        break
      case 'damage':
        handleDamage(draft, action.targetId, action.amount)
        break
      case 'heal':
        handleHeal(draft, action.targetId, action.amount)
        break
      case 'addBlock':
        handleAddBlock(draft, action.targetId, action.amount)
        break
      case 'spendEnergy':
        handleSpendEnergy(draft, action.amount)
        break
      case 'gainEnergy':
        handleGainEnergy(draft, action.amount)
        break
      case 'applyPower':
        handleApplyPower(draft, action.targetId, action.powerId, action.amount)
        break
      case 'enemyAction':
        handleEnemyAction(draft, action.enemyId)
        break
      case 'selectRoom':
        handleSelectRoom(draft, action.roomUid)
        break
      case 'dealRoomChoices':
        handleDealRoomChoices(draft)
        break
      case 'clearVisualQueue':
        handleClearVisualQueue(draft)
        break
      case 'resolveScry':
        handleResolveScry(draft, action.keptUids, action.discardedUids)
        break
      case 'resolveTutor':
        handleResolveTutor(draft, action.selectedUids, shuffleArray)
        break
      case 'resolveDiscover':
        handleResolveDiscover(draft, action.selectedCardIds)
        break
      case 'resolveBanish':
        handleResolveBanish(draft, action.selectedUids)
        break
    }
  })
}

/**
 * Create a new card instance from a definition ID
 */
export function createCardInstance(definitionId: string): CardInstance {
  return {
    uid: generateUid(),
    definitionId,
    upgraded: false,
  }
}
