import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import type { PendingCardAnimation } from '../../components/Hand/CardAnimationOverlay'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'
import { getCardDefinition } from '../../game/cards'
import { logger } from '../../lib/logger'

export function handleCardAnimationEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'draw':
      // Animate mid-turn draws with flourish
      if (ctx.lastTurnRef.current === ctx.combat?.turn) {
        setTimeout(() => {
          const handCards = ctx.queryHand('.HandCard')
          if (handCards && handCards.length > 0) {
            const newCards = Array.from(handCards).slice(-event.count)
            if (newCards.length > 0) {
              // Use draw flourish for each card
              newCards.forEach((card, i) => {
                effects.drawFlourish(card, { index: i })
              })
              // Particles on deck
              const deckPile = ctx.queryContainer('[data-deck-pile]')
              if (deckPile) {
                emitParticle(deckPile, 'spark')
              }
            }
          }
        }, 50)
      }
      return true

    case 'discard': {
      const discardAnims: PendingCardAnimation[] = []
      for (const cardUid of event.cardUids) {
        const cached = ctx.cardPositionsRef.current.get(cardUid)
        if (!cached) continue

        const cardDef = getCardDefinition(cached.definitionId)
        if (!cardDef) continue

        discardAnims.push({
          id: `discard-${cardUid}-${Date.now()}`,
          cardDef,
          position: { x: cached.x, y: cached.y },
          type: 'discard',
        })
      }
      if (discardAnims.length > 0) {
        ctx.setPendingAnimations((prev) => [...prev, ...discardAnims])
      }
      return true
    }

    case 'exhaust': {
      const exhaustAnims: PendingCardAnimation[] = []
      for (const cardUid of event.cardUids) {
        const cached = ctx.cardPositionsRef.current.get(cardUid)
        if (!cached) continue

        const cardDef = getCardDefinition(cached.definitionId)
        if (!cardDef) continue

        const animType = cardDef.ethereal ? 'etherealExhaust' : 'exhaust'

        exhaustAnims.push({
          id: `exhaust-${cardUid}-${Date.now()}`,
          cardDef,
          position: { x: cached.x, y: cached.y },
          type: animType,
        })
      }
      if (exhaustAnims.length > 0) {
        ctx.setPendingAnimations((prev) => [...prev, ...exhaustAnims])
        // Gothic abyssal rift effect - void tear for exhaust
        const playerEl = ctx.queryContainer('[data-target="player"]')
        if (playerEl) {
          effects.abyssalRift?.(playerEl)
        }
      }
      return true
    }

    case 'banish': {
      const playerEl = ctx.queryContainer('[data-target="player"]')
      if (playerEl) {
        emitParticle(playerEl, 'banish')
        // Gothic abyssal rift effect - void tear consumes the card
        effects.abyssalRift?.(playerEl)
        effects.pulse(playerEl, {
          color: 'oklch(0.25 0.12 300)',
          scale: 0.95,
        })
      }
      return true
    }

    case 'addCard': {
      const destName = event.destination === 'hand' ? 'hand'
        : event.destination === 'drawPile' ? 'draw pile'
        : 'discard pile'
      const cardDef = getCardDefinition(event.cardId)
      const cardName = cardDef?.name ?? event.cardId
      if (event.destination === 'hand') {
        setTimeout(() => {
          const handCards = ctx.queryHand('.HandCard')
          if (handCards && handCards.length > 0) {
            const newCards = Array.from(handCards).slice(-event.count)
            if (newCards.length > 0) {
              effects.dealCards(newCards, { stagger: 0.05 })
            }
          }
        }, 50)
      }
      logger.debug('Visual', `+${event.count} ${cardName} → ${destName}`)
      return true
    }

    case 'putOnDeck': {
      const deckAnims: PendingCardAnimation[] = []
      for (const cardUid of event.cardUids) {
        const cached = ctx.cardPositionsRef.current.get(cardUid)
        if (!cached) continue

        const cardDef = getCardDefinition(cached.definitionId)
        if (!cardDef) continue

        deckAnims.push({
          id: `deck-${cardUid}-${Date.now()}`,
          cardDef,
          position: { x: cached.x, y: cached.y },
          type: 'putOnDeck',
        })
      }
      if (deckAnims.length > 0) {
        ctx.setPendingAnimations((prev) => [...prev, ...deckAnims])
      }
      logger.debug('Visual', `Put ${event.cardUids.length} card(s) on ${event.position} of deck`)
      return true
    }

    case 'mill': {
      // Cards milled from deck - quick fade with void particles
      const deckPile = ctx.queryContainer('[data-deck-pile]')
      if (deckPile) {
        // Particle burst on deck
        for (let i = 0; i < Math.min(event.cardUids.length, 5); i++) {
          setTimeout(() => emitParticle(deckPile, 'banish'), i * 40)
        }
        effects.pulse(deckPile, { color: 'oklch(0.35 0.15 280)', scale: 0.9 })
        effects.abyssalRift?.(deckPile)
      }
      logger.debug('Visual', `Milled ${event.cardUids.length} card(s)`)
      return true
    }
  }
  return false
}
