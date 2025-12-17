// ============================================
// ACTIONS
// ============================================

import type { EnemyEntity } from './entities'
import type { VisualEvent } from './visuals'

export type GameAction =
  | { type: 'startCombat'; enemies: EnemyEntity[] }
  | { type: 'endCombat'; victory: boolean }
  | { type: 'startTurn' }
  | { type: 'endTurn' }
  | { type: 'drawCards'; amount: number }
  | { type: 'playCard'; cardUid: string; targetId?: string }
  | { type: 'discardCard'; cardUid: string }
  | { type: 'discardHand' }
  | { type: 'damage'; targetId: string; amount: number }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'addBlock'; targetId: string; amount: number }
  | { type: 'spendEnergy'; amount: number }
  | { type: 'gainEnergy'; amount: number }
  | { type: 'applyPower'; targetId: string; powerId: string; amount: number }
  | { type: 'enemyAction'; enemyId: string }
  | { type: 'selectRoom'; roomUid: string }
  | { type: 'dealRoomChoices' }
  | { type: 'clearVisualQueue' }
  | { type: 'emitVisual'; event: VisualEvent }
  | { type: 'resolveScry'; keptUids: string[]; discardedUids: string[] }
  | { type: 'resolveTutor'; selectedUids: string[] }
  | { type: 'resolveDiscover'; selectedCardIds: string[] }
  | { type: 'resolveBanish'; selectedUids: string[] }
  // Hero abilities
  | { type: 'useActivatedAbility' }
  | { type: 'useUltimateAbility' }
