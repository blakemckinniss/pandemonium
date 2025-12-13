// Control flow effects: conditional, repeat, random, sequence, forEach
import type { RunState, EffectContext, EffectValue, AtomicEffect, EntityTarget, CardTarget, Condition } from '../../types'
import { resolveValue, evaluateCondition, resolveEntityTargets, resolveCardTarget } from '../../lib/effects'
import { emitVisual } from '../handlers/shared'

// Forward declaration - will be set by engine
let executeEffect: (draft: RunState, effect: AtomicEffect, ctx: EffectContext) => void

export function setExecuteEffect(fn: typeof executeEffect): void {
  executeEffect = fn
}

export function executeConditional(
  draft: RunState,
  effect: { type: 'conditional'; condition: Condition; then: AtomicEffect[]; else?: AtomicEffect[] },
  ctx: EffectContext
): void {
  if (evaluateCondition(effect.condition, draft, ctx)) {
    emitVisual(draft, { type: 'conditionalTrigger', branch: 'then' })
    for (const e of effect.then) {
      executeEffect(draft, e, ctx)
    }
  } else if (effect.else) {
    emitVisual(draft, { type: 'conditionalTrigger', branch: 'else' })
    for (const e of effect.else) {
      executeEffect(draft, e, ctx)
    }
  }
}

export function executeRepeat(
  draft: RunState,
  effect: { type: 'repeat'; times: EffectValue; effects: AtomicEffect[] },
  ctx: EffectContext
): void {
  const times = resolveValue(effect.times, draft, ctx)

  for (let i = 0; i < times; i++) {
    emitVisual(draft, { type: 'repeatEffect', times, current: i + 1 })
    for (const e of effect.effects) {
      executeEffect(draft, e, ctx)
    }
  }
}

export function executeRandom(
  draft: RunState,
  effect: { type: 'random'; choices: AtomicEffect[][]; weights?: number[] },
  ctx: EffectContext
): void {
  if (effect.choices.length === 0) return

  let choiceIndex: number

  if (effect.weights && effect.weights.length === effect.choices.length) {
    // Weighted random
    const totalWeight = effect.weights.reduce((a, b) => a + b, 0)
    let roll = Math.random() * totalWeight
    choiceIndex = 0
    for (let i = 0; i < effect.weights.length; i++) {
      roll -= effect.weights[i]
      if (roll <= 0) {
        choiceIndex = i
        break
      }
    }
  } else {
    // Uniform random
    choiceIndex = Math.floor(Math.random() * effect.choices.length)
  }

  for (const e of effect.choices[choiceIndex]) {
    executeEffect(draft, e, ctx)
  }
}

export function executeSequence(
  draft: RunState,
  effect: { type: 'sequence'; effects: AtomicEffect[] },
  ctx: EffectContext
): void {
  for (const e of effect.effects) {
    executeEffect(draft, e, ctx)
  }
}

export function executeForEach(
  draft: RunState,
  effect: { type: 'forEach'; target: EntityTarget | CardTarget; effects: AtomicEffect[] },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const entityTargets = ['self', 'player', 'source', 'enemy', 'randomEnemy', 'weakestEnemy', 'strongestEnemy', 'frontEnemy', 'backEnemy', 'allEnemies', 'allEntities', 'otherEnemies']

  if (entityTargets.includes(effect.target as string)) {
    const targetIds = resolveEntityTargets(effect.target as EntityTarget, draft, ctx)
    for (const targetId of targetIds) {
      const iterCtx = { ...ctx, currentTarget: targetId }
      for (const e of effect.effects) {
        executeEffect(draft, e, iterCtx)
      }
    }
  } else {
    const cards = resolveCardTarget(effect.target as CardTarget, draft, ctx)
    for (const card of cards) {
      const iterCtx = { ...ctx, currentTarget: card.uid }
      for (const e of effect.effects) {
        executeEffect(draft, e, iterCtx)
      }
    }
  }
}
