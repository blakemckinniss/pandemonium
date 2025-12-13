// Card manipulation effects: draw, discard, exhaust, addCard, shuffle, retain, energy
import type { RunState, EffectContext, EffectValue, CardTarget, FilteredCardTarget, CardInstance } from '../../types'
import { resolveValue, resolveCardTarget } from '../../lib/effects'
import { generateUid } from '../../lib/utils'
import { emitVisual, drawCardsInternal, shuffleArray } from '../handlers/shared'

export function executeEnergy(
  draft: RunState,
  effect: { type: 'energy'; amount: EffectValue; operation: 'gain' | 'spend' | 'set' },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const prevEnergy = draft.combat.player.energy

  switch (effect.operation) {
    case 'gain':
      draft.combat.player.energy += amount
      break
    case 'spend':
      draft.combat.player.energy = Math.max(0, draft.combat.player.energy - amount)
      break
    case 'set':
      draft.combat.player.energy = amount
      break
  }

  const delta = draft.combat.player.energy - prevEnergy
  if (delta !== 0) {
    emitVisual(draft, { type: 'energy', delta })
  }
}

export function executeDraw(
  draft: RunState,
  effect: { type: 'draw'; amount: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const prevHandSize = draft.combat.hand.length
  drawCardsInternal(draft.combat, amount)
  const drawn = draft.combat.hand.length - prevHandSize

  if (drawn > 0) {
    emitVisual(draft, { type: 'draw', count: drawn })
  }
}

export function executeDiscard(
  draft: RunState,
  effect: { type: 'discard'; target: CardTarget | FilteredCardTarget; amount?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  let cards = resolveCardTarget(effect.target, draft, ctx)

  if (effect.amount !== undefined) {
    const count = resolveValue(effect.amount, draft, ctx)
    cards = cards.slice(0, count)
  }

  const discardedUids: string[] = []
  for (const card of cards) {
    const idx = draft.combat.hand.findIndex((c) => c.uid === card.uid)
    if (idx !== -1) {
      draft.combat.hand.splice(idx, 1)
      draft.combat.discardPile.push(card)
      discardedUids.push(card.uid)
    }
  }

  if (discardedUids.length > 0) {
    emitVisual(draft, { type: 'discard', cardUids: discardedUids })
  }
}

export function executeExhaust(
  draft: RunState,
  effect: { type: 'exhaust'; target: CardTarget | FilteredCardTarget; amount?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  let cards = resolveCardTarget(effect.target, draft, ctx)

  if (effect.amount !== undefined) {
    const count = resolveValue(effect.amount, draft, ctx)
    cards = cards.slice(0, count)
  }

  const exhaustedUids: string[] = []
  for (const card of cards) {
    // Check hand
    let idx = draft.combat.hand.findIndex((c) => c.uid === card.uid)
    if (idx !== -1) {
      draft.combat.hand.splice(idx, 1)
      draft.combat.exhaustPile.push(card)
      exhaustedUids.push(card.uid)
      continue
    }

    // Check discard
    idx = draft.combat.discardPile.findIndex((c) => c.uid === card.uid)
    if (idx !== -1) {
      draft.combat.discardPile.splice(idx, 1)
      draft.combat.exhaustPile.push(card)
      exhaustedUids.push(card.uid)
    }
  }

  if (exhaustedUids.length > 0) {
    emitVisual(draft, { type: 'exhaust', cardUids: exhaustedUids })
  }
}

export function executeAddCard(
  draft: RunState,
  effect: { type: 'addCard'; cardId: string; destination: 'hand' | 'drawPile' | 'discardPile'; position?: 'top' | 'bottom' | 'random'; upgraded?: boolean; count?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const count = effect.count ? resolveValue(effect.count, draft, ctx) : 1

  for (let i = 0; i < count; i++) {
    const card: CardInstance = {
      uid: generateUid(),
      definitionId: effect.cardId,
      upgraded: effect.upgraded ?? false,
    }

    const pile = draft.combat[effect.destination]
    const pos = effect.position ?? 'random'

    switch (pos) {
      case 'top':
        pile.push(card)
        break
      case 'bottom':
        pile.unshift(card)
        break
      case 'random':
        const idx = Math.floor(Math.random() * (pile.length + 1))
        pile.splice(idx, 0, card)
        break
    }
  }

  if (count > 0) {
    emitVisual(draft, {
      type: 'addCard',
      cardId: effect.cardId,
      destination: effect.destination,
      count,
    })
  }
}

export function executeShuffle(
  draft: RunState,
  effect: { type: 'shuffle'; pile: 'drawPile' | 'discardPile'; into?: 'drawPile' },
  _ctx: EffectContext
): void {
  if (!draft.combat) return

  if (effect.into === 'drawPile' && effect.pile === 'discardPile') {
    draft.combat.drawPile = shuffleArray([
      ...draft.combat.drawPile,
      ...draft.combat.discardPile,
    ])
    draft.combat.discardPile = []
  } else {
    draft.combat[effect.pile] = shuffleArray([...draft.combat[effect.pile]])
  }

  emitVisual(draft, { type: 'shuffle' })
}

export function executeRetain(
  draft: RunState,
  effect: { type: 'retain'; target: CardTarget | FilteredCardTarget },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const cards = resolveCardTarget(effect.target, draft, ctx)

  for (const card of cards) {
    const handCard = draft.combat.hand.find((c) => c.uid === card.uid)
    if (handCard) {
      handCard.retained = true
    }
  }
}
