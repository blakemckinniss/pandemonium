// Combat setup and teardown handlers
import type { RunState, EnemyEntity } from '../../types'
import { shuffleArray } from './shared'
import { executeRelicTriggers } from './turns'
import { getCardDefinition } from '../cards'
import { executeEffect } from '../effects/engine'

export function handleStartCombat(draft: RunState, enemies: EnemyEntity[]): void {
  const shuffledDeck = shuffleArray([...draft.deck])

  // Get hero card definition if available
  const heroCard = draft.hero.heroCardId ? getCardDefinition(draft.hero.heroCardId) : null

  // Get hero stats from hero card or fallback to legacy fields
  const heroName = heroCard?.name ?? draft.hero.name ?? 'Hero'
  const heroEnergy = heroCard?.heroStats?.energy ?? draft.hero.energy ?? 3
  const heroImage = heroCard?.image ?? draft.hero.image

  draft.combat = {
    phase: 'playerTurn',
    turn: 0,
    player: {
      id: 'player',
      name: heroName,
      currentHealth: draft.hero.currentHealth,
      maxHealth: draft.hero.maxHealth,
      block: 0,
      barrier: 0,
      powers: {},
      energy: heroEnergy,
      maxEnergy: heroEnergy,
      image: heroImage,
      // Hero ability state
      heroCardId: draft.hero.heroCardId,
      activatedUsedThisTurn: false,
      ultimateCharges: 0,
      ultimateReady: false,
    },
    enemies,
    hand: [],
    drawPile: shuffledDeck,
    discardPile: [],
    exhaustPile: [],
    cardsPlayedThisTurn: 0,
    visualQueue: [],
  }

  // Apply innate statuses to enemies
  for (const enemy of enemies) {
    if (enemy.innateStatus) {
      enemy.powers[enemy.innateStatus] = { id: enemy.innateStatus, amount: 3 }
    }
  }

  draft.gamePhase = 'combat'

  // Execute relic triggers for combat start
  executeRelicTriggers(draft, 'onCombatStart')

  // Execute hero passive effects at combat start
  if (heroCard?.passive && heroCard.passive.length > 0) {
    const ctx = { source: 'player' as const }
    for (const effect of heroCard.passive) {
      executeEffect(draft, effect, ctx)
    }
  }
}

export function handleEndCombat(draft: RunState, victory: boolean): void {
  // Execute relic triggers for combat end (before nullifying combat)
  executeRelicTriggers(draft, 'onCombatEnd')

  if (victory) {
    draft.gamePhase = 'reward'
    draft.floor += 1
  } else {
    draft.gamePhase = 'gameOver'
  }
  draft.combat = null
}

export function handleClearVisualQueue(draft: RunState): void {
  if (draft.combat) {
    draft.combat.visualQueue = []
  }
}
