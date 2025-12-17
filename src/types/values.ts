// ============================================
// VALUE SYSTEM (Range + Scaling)
// ============================================

export type ScalingSource =
  | 'energy'
  | 'maxEnergy'
  | 'cardsInHand'
  | 'cardsPlayed'
  | 'block'
  | 'missingHealth'
  | 'healthPercent'
  | 'enemyCount'
  | 'turnNumber'
  | 'powerStacks' // For power-triggered effects

export interface FixedValue {
  type: 'fixed'
  value: number
}

export interface RangeValue {
  type: 'range'
  min: number
  max: number
}

export interface ScaledValue {
  type: 'scaled'
  base: number
  perUnit: number
  source: ScalingSource
  max?: number
}

export interface GeneratedScaledValue {
  type: 'generatedScaled'
  baseRange: [number, number]
  perUnit: number
  source: ScalingSource
}

// For effects that use the power's stack amount as the value
export interface PowerAmountValue {
  type: 'powerAmount'
}

export type EffectValue = number | FixedValue | RangeValue | ScaledValue | GeneratedScaledValue | PowerAmountValue
