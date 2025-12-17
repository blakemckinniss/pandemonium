import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'
import { getCardDefinition } from '../../game/cards'
import { logger } from '../../lib/logger'

export function handleCardModificationEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'upgrade': {
      for (const cardUid of event.cardUids) {
        const cardEl = ctx.queryContainer(`[data-card-uid="${cardUid}"]`)
        if (cardEl) {
          effects.upgradeCard(cardEl)
          emitParticle(cardEl, 'upgrade')
        }
      }
      logger.debug('Visual', `Upgraded ${event.cardUids.length} card(s)`)
      return true
    }

    case 'retain': {
      for (const cardUid of event.cardUids) {
        const cardEl = ctx.queryContainer(`[data-card-uid="${cardUid}"]`)
        if (cardEl) {
          effects.retainCard(cardEl)
          emitParticle(cardEl, 'retain')
        }
      }
      logger.debug('Visual', `Retained ${event.cardUids.length} card(s)`)
      return true
    }

    case 'transform': {
      const cardEl = ctx.queryContainer(`[data-card-uid="${event.cardUid}"]`)
      if (cardEl) {
        effects.transformCard(cardEl)
        emitParticle(cardEl, 'transform')
      }
      const fromDef = getCardDefinition(event.fromCardId)
      const toDef = getCardDefinition(event.toCardId)
      logger.debug('Visual', `Transform: ${fromDef?.name ?? event.fromCardId} → ${toDef?.name ?? event.toCardId}`)
      return true
    }

    case 'costModify': {
      for (const cardUid of event.cardUids) {
        const cardEl = ctx.queryContainer(`[data-card-uid="${cardUid}"]`)
        if (cardEl) {
          effects.pulse(cardEl, {
            color: event.delta < 0
              ? 'oklch(0.7 0.15 145)'
              : 'oklch(0.6 0.15 25)',
          })
        }
      }
      return true
    }
  }
  return false
}
