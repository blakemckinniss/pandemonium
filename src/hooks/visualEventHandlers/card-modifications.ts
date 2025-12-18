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
          // Sparkle burst for upgrade - staggered gold particles
          emitParticle(cardEl, 'upgrade')
          setTimeout(() => emitParticle(cardEl, 'upgrade'), 50)
          setTimeout(() => emitParticle(cardEl, 'gold'), 100)
          setTimeout(() => emitParticle(cardEl, 'upgrade'), 150)
          setTimeout(() => emitParticle(cardEl, 'energy'), 200)
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

    case 'cardModified': {
      const modifierColors: Record<string, string> = {
        innate: 'oklch(0.7 0.18 85)',      // Gold for innate
        ethereal: 'oklch(0.6 0.15 200)',   // Cyan for ethereal
        unplayable: 'oklch(0.4 0.1 0)',    // Gray for unplayable
      }
      const modifierParticles: Record<string, 'gold' | 'spark' | 'banish'> = {
        innate: 'gold',
        ethereal: 'spark',
        unplayable: 'banish',
      }

      for (const cardUid of event.cardUids) {
        const cardEl = ctx.queryContainer(`[data-card-uid="${cardUid}"]`)
        if (cardEl) {
          effects.pulse(cardEl, {
            color: modifierColors[event.modifier] ?? 'oklch(0.6 0.1 0)',
            scale: event.modifier === 'unplayable' ? 0.95 : 1.05,
          })
          emitParticle(cardEl, modifierParticles[event.modifier] ?? 'spark')
        }
      }
      logger.debug('Visual', `Modified ${event.cardUids.length} card(s): ${event.modifier}`)
      return true
    }
  }
  return false
}
