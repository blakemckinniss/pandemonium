// ============================================
// VISUAL EVENTS (Animation Queue)
// ============================================

import type { Element } from './elements'
import type { RelicTrigger } from './relics'
import type { CardTheme } from './targeting'

export type VisualEvent =
  | { type: 'damage'; targetId: string; amount: number; variant?: 'poison' | 'piercing' | 'combo' | 'chain' | 'execute'; element?: Element; comboName?: string }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'lifesteal'; sourceId: string; targetId: string; damage: number; heal: number }
  | { type: 'block'; targetId: string; amount: number; variant?: 'barrier' }
  | { type: 'draw'; count: number }
  | { type: 'discard'; cardUids: string[] }
  | { type: 'exhaust'; cardUids: string[] }
  | { type: 'banish'; cardUids: string[] }
  | { type: 'addCard'; cardId: string; destination: 'hand' | 'drawPile' | 'discardPile'; count: number }
  | { type: 'powerApply'; targetId: string; powerId: string; amount: number }
  | { type: 'powerRemove'; targetId: string; powerId: string }
  | { type: 'energy'; delta: number }
  | { type: 'gold'; delta: number }
  | { type: 'shuffle' }
  | { type: 'costModify'; cardUids: string[]; delta: number }
  | { type: 'conditionalTrigger'; branch: 'then' | 'else' }
  | { type: 'repeatEffect'; times: number; current: number }
  | { type: 'replay'; cardUid: string; times: number }
  | { type: 'playTopCard'; cardId: string; fromPile: 'drawPile' | 'discardPile' }
  | { type: 'maxHealth'; targetId: string; delta: number }
  | { type: 'upgrade'; cardUids: string[] }
  | { type: 'retain'; cardUids: string[] }
  | { type: 'transform'; cardUid: string; fromCardId: string; toCardId: string }
  | { type: 'cardPlayed'; cardUid: string; theme: CardTheme; targetId?: string; element?: import('./elements').Element }
  | { type: 'comboMilestone'; count: number }
  | { type: 'putOnDeck'; cardUids: string[]; position: 'top' | 'bottom' | 'random' }
  | { type: 'powerTrigger'; targetId: string; powerId: string; triggerEvent: string }
  | { type: 'relicTrigger'; relicId: string; relicDefId: string; trigger: RelicTrigger }
  | { type: 'enemyDeath'; enemyId: string; element?: import('./elements').Element }
  // Hero abilities
  | { type: 'heroActivated'; heroCardId: string }
  | { type: 'heroUltimate'; heroCardId: string }
  | { type: 'heroUltimateReady'; heroCardId: string }
  | { type: 'heroUltimateCharge'; heroCardId: string; charges: number; required: number }
  // Enemy abilities
  | { type: 'enemyAbility'; entityId: string; abilityName: string }
  | { type: 'enemyUltimate'; entityId: string; ultimateName: string }
  // Enemy turn animations
  | { type: 'enemyTelegraph'; enemyId: string; intentType: 'attack' | 'defend' | 'buff' | 'debuff' | 'ability' | 'ultimate'; intentValue?: number; intentTimes?: number }
  | { type: 'enemyActionExecute'; enemyId: string; intentType: 'attack' | 'defend' | 'buff' | 'debuff' | 'ability' | 'ultimate' }
  // Turn transitions
  | { type: 'playerTurnStart' }
  | { type: 'enemyTurnStart' }
  // New effect visuals
  | { type: 'mill'; cardUids: string[] }
  | { type: 'cardModified'; cardUids: string[]; modifier: 'innate' | 'ethereal' | 'unplayable' }
  | { type: 'intentWeakened'; targetId: string; reduction: number }
  | { type: 'delayedEffect'; turnsRemaining: number }
  | { type: 'delayedEffectTrigger' }
  | { type: 'powerSilenced'; targetId: string; powerId: string; duration: number }

// ============================================
// COMBAT NUMBERS (FCT)
// ============================================

export interface CombatNumber {
  id: string
  value: number
  type: 'damage' | 'heal' | 'block' | 'maxHealth' | 'combo' | 'gold' | 'preview' | 'intentWeakened'
  targetId: string
  x: number
  y: number
  element?: Element
  variant?: 'poison' | 'piercing' | 'combo' | 'chain' | 'execute' | 'multi'
  comboName?: string
  label?: string // Custom label like "Max HP" or "x3"
}
