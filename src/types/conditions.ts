// ============================================
// CONDITION SYSTEM (Nestable)
// ============================================

import type { EntityTarget, CardFilter } from './targeting'

export type ComparisonOp = '<' | '<=' | '=' | '>=' | '>' | '!='

export interface HealthCondition {
  type: 'health'
  target: EntityTarget
  compare: 'current' | 'max' | 'percent' | 'missing'
  op: ComparisonOp
  value: number
}

export interface HasPowerCondition {
  type: 'hasPower'
  target: EntityTarget
  powerId: string
  minStacks?: number
}

export interface ResourceCondition {
  type: 'resource'
  resource: 'energy' | 'gold' | 'block'
  target?: EntityTarget
  op: ComparisonOp
  value: number
}

export interface CardCountCondition {
  type: 'cardCount'
  pile: 'hand' | 'drawPile' | 'discardPile' | 'exhaustPile'
  op: ComparisonOp
  value: number
  filter?: CardFilter
}

export interface TurnCondition {
  type: 'turn'
  op: ComparisonOp
  value: number
}

export interface CombatCondition {
  type: 'combat'
  check: 'enemyCount' | 'isPlayerTurn' | 'isFirstTurn'
  op?: ComparisonOp
  value?: number
}

export interface CardsPlayedCondition {
  type: 'cardsPlayed'
  op: ComparisonOp
  value: number
}

export interface AndCondition {
  type: 'and'
  conditions: Condition[]
}

export interface OrCondition {
  type: 'or'
  conditions: Condition[]
}

export interface NotCondition {
  type: 'not'
  condition: Condition
}

export type Condition =
  | HealthCondition
  | HasPowerCondition
  | ResourceCondition
  | CardCountCondition
  | TurnCondition
  | CombatCondition
  | CardsPlayedCondition
  | AndCondition
  | OrCondition
  | NotCondition
