// Combat setup and teardown handlers
import type { RunState, EnemyEntity } from '../../types'
import { shuffleArray } from './shared'

export function handleStartCombat(draft: RunState, enemies: EnemyEntity[]): void {
  const shuffledDeck = shuffleArray([...draft.deck])

  draft.combat = {
    phase: 'playerTurn',
    turn: 0,
    player: {
      id: 'player',
      name: draft.hero.name,
      currentHealth: draft.hero.currentHealth,
      maxHealth: draft.hero.maxHealth,
      block: 0,
      barrier: 0,
      powers: {},
      energy: draft.hero.energy,
      maxEnergy: draft.hero.energy,
      image: draft.hero.image,
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
}

export function handleEndCombat(draft: RunState, victory: boolean): void {
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
