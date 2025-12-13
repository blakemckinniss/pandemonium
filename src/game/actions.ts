import { produce } from 'immer'
import type {
  RunState,
  CombatState,
  CardInstance,
  EnemyEntity,
  GameAction,
  CardDefinition,
} from '../types'
import { getCardDefinition } from './cards'
import { generateUid } from '../lib/utils'

// ============================================
// ACTION HANDLERS
// ============================================

export function applyAction(state: RunState, action: GameAction): RunState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'startCombat':
        handleStartCombat(draft, action.enemies)
        break
      case 'endCombat':
        handleEndCombat(draft, action.victory)
        break
      case 'startTurn':
        handleStartTurn(draft)
        break
      case 'endTurn':
        handleEndTurn(draft)
        break
      case 'drawCards':
        handleDrawCards(draft, action.amount)
        break
      case 'playCard':
        handlePlayCard(draft, action.cardUid, action.targetId)
        break
      case 'discardCard':
        handleDiscardCard(draft, action.cardUid)
        break
      case 'discardHand':
        handleDiscardHand(draft)
        break
      case 'damage':
        handleDamage(draft, action.targetId, action.amount)
        break
      case 'heal':
        handleHeal(draft, action.targetId, action.amount)
        break
      case 'addBlock':
        handleAddBlock(draft, action.targetId, action.amount)
        break
      case 'spendEnergy':
        handleSpendEnergy(draft, action.amount)
        break
      case 'gainEnergy':
        handleGainEnergy(draft, action.amount)
        break
      case 'enemyAction':
        handleEnemyAction(draft, action.enemyId)
        break
      case 'selectRoom':
        handleSelectRoom(draft, action.roomUid)
        break
      case 'dealRoomChoices':
        handleDealRoomChoices(draft)
        break
    }
  })
}

// ============================================
// COMBAT SETUP
// ============================================

function handleStartCombat(draft: RunState, enemies: EnemyEntity[]): void {
  // Shuffle deck into draw pile
  const shuffledDeck = shuffleArray([...draft.deck])

  draft.combat = {
    phase: 'playerTurn',
    turn: 0, // Will be incremented to 1 on first startTurn
    player: {
      id: 'player',
      name: draft.hero.name,
      currentHealth: draft.hero.health,
      maxHealth: draft.hero.health,
      block: 0,
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
  }

  draft.gamePhase = 'combat'
}

function handleEndCombat(draft: RunState, victory: boolean): void {
  if (victory) {
    draft.gamePhase = 'reward'
    draft.floor += 1
  } else {
    draft.gamePhase = 'gameOver'
  }
  draft.combat = null
}

// ============================================
// TURN MANAGEMENT
// ============================================

function handleStartTurn(draft: RunState): void {
  if (!draft.combat) return

  const combat = draft.combat
  combat.phase = 'playerTurn'

  // Increment turn counter
  combat.turn += 1

  // Reset energy
  combat.player.energy = combat.player.maxEnergy

  // Clear block
  combat.player.block = 0

  // Draw 5 cards
  drawCardsInternal(combat, 5)
}

function handleEndTurn(draft: RunState): void {
  if (!draft.combat) return

  const combat = draft.combat

  // Discard hand
  combat.discardPile.push(...combat.hand)
  combat.hand = []

  // Enemy turn
  combat.phase = 'enemyTurn'
}

// ============================================
// CARD MANAGEMENT
// ============================================

function handleDrawCards(draft: RunState, amount: number): void {
  if (!draft.combat) return
  drawCardsInternal(draft.combat, amount)
}

function drawCardsInternal(combat: CombatState, amount: number): void {
  for (let i = 0; i < amount; i++) {
    // Reshuffle if draw pile empty
    if (combat.drawPile.length === 0) {
      if (combat.discardPile.length === 0) break
      combat.drawPile = shuffleArray([...combat.discardPile])
      combat.discardPile = []
    }

    const card = combat.drawPile.pop()
    if (card) {
      combat.hand.push(card)
    }
  }
}

function handlePlayCard(
  draft: RunState,
  cardUid: string,
  targetId?: string
): void {
  if (!draft.combat) return

  const combat = draft.combat
  const cardIndex = combat.hand.findIndex((c) => c.uid === cardUid)
  if (cardIndex === -1) return

  const cardInstance = combat.hand[cardIndex]
  const cardDef = getCardDefinition(cardInstance.definitionId)
  if (!cardDef) return

  // Check energy
  if (combat.player.energy < cardDef.energy) return

  // Spend energy
  combat.player.energy -= cardDef.energy

  // Remove from hand
  combat.hand.splice(cardIndex, 1)

  // Track stat
  draft.stats.cardsPlayed++

  // Apply effects
  applyCardEffects(draft, cardDef, targetId)

  // Move to discard
  combat.discardPile.push(cardInstance)
}

function applyCardEffects(
  draft: RunState,
  cardDef: CardDefinition,
  targetId?: string
): void {
  if (!draft.combat) return

  for (const effect of cardDef.effects) {
    switch (effect.type) {
      case 'damage': {
        if (cardDef.target === 'allEnemies') {
          for (const enemy of draft.combat.enemies) {
            applyDamageInternal(draft, enemy.id, effect.amount)
          }
        } else if (targetId) {
          applyDamageInternal(draft, targetId, effect.amount)
        }
        break
      }
      case 'block':
        draft.combat.player.block += effect.amount
        break
      case 'draw':
        drawCardsInternal(draft.combat, effect.amount)
        break
      case 'energy':
        draft.combat.player.energy += effect.amount
        break
      case 'heal':
        draft.combat.player.currentHealth = Math.min(
          draft.combat.player.currentHealth + effect.amount,
          draft.combat.player.maxHealth
        )
        break
    }
  }
}

function handleDiscardCard(draft: RunState, cardUid: string): void {
  if (!draft.combat) return

  const combat = draft.combat
  const cardIndex = combat.hand.findIndex((c) => c.uid === cardUid)
  if (cardIndex === -1) return

  const [card] = combat.hand.splice(cardIndex, 1)
  combat.discardPile.push(card)
}

function handleDiscardHand(draft: RunState): void {
  if (!draft.combat) return

  draft.combat.discardPile.push(...draft.combat.hand)
  draft.combat.hand = []
}

// ============================================
// DAMAGE & HEALING
// ============================================

function handleDamage(draft: RunState, targetId: string, amount: number): void {
  if (!draft.combat) return
  applyDamageInternal(draft, targetId, amount)
}

function applyDamageInternal(
  draft: RunState,
  targetId: string,
  amount: number
): void {
  if (!draft.combat) return
  const combat = draft.combat

  if (targetId === 'player') {
    // Damage player
    let remaining = amount

    // Block absorbs first
    if (combat.player.block > 0) {
      const blocked = Math.min(combat.player.block, remaining)
      combat.player.block -= blocked
      remaining -= blocked
    }

    combat.player.currentHealth -= remaining
    draft.stats.damageTaken += remaining

    if (combat.player.currentHealth <= 0) {
      combat.phase = 'defeat'
    }
  } else {
    // Damage enemy
    const enemy = combat.enemies.find((e) => e.id === targetId)
    if (!enemy) return

    let remaining = amount

    if (enemy.block > 0) {
      const blocked = Math.min(enemy.block, remaining)
      enemy.block -= blocked
      remaining -= blocked
    }

    enemy.currentHealth -= remaining
    draft.stats.damageDealt += remaining

    // Remove dead enemies
    if (enemy.currentHealth <= 0) {
      combat.enemies = combat.enemies.filter((e) => e.id !== targetId)
      draft.stats.enemiesKilled++

      // Check victory
      if (combat.enemies.length === 0) {
        combat.phase = 'victory'
      }
    }
  }
}

function handleHeal(draft: RunState, targetId: string, amount: number): void {
  if (!draft.combat) return

  if (targetId === 'player') {
    draft.combat.player.currentHealth = Math.min(
      draft.combat.player.currentHealth + amount,
      draft.combat.player.maxHealth
    )
  }
}

function handleAddBlock(
  draft: RunState,
  targetId: string,
  amount: number
): void {
  if (!draft.combat) return

  if (targetId === 'player') {
    draft.combat.player.block += amount
  } else {
    const enemy = draft.combat.enemies.find((e) => e.id === targetId)
    if (enemy) {
      enemy.block += amount
    }
  }
}

// ============================================
// ENERGY
// ============================================

function handleSpendEnergy(draft: RunState, amount: number): void {
  if (!draft.combat) return
  draft.combat.player.energy = Math.max(0, draft.combat.player.energy - amount)
}

function handleGainEnergy(draft: RunState, amount: number): void {
  if (!draft.combat) return
  draft.combat.player.energy += amount
}

// ============================================
// ENEMY AI
// ============================================

function handleEnemyAction(draft: RunState, enemyId: string): void {
  if (!draft.combat) return

  const enemy = draft.combat.enemies.find((e) => e.id === enemyId)
  if (!enemy) return

  const intent = enemy.intent

  switch (intent.type) {
    case 'attack':
      applyDamageInternal(draft, 'player', intent.value ?? 0)
      break
    case 'defend':
      enemy.block += intent.value ?? 0
      break
  }

  // Advance pattern for next turn
  enemy.patternIndex = (enemy.patternIndex + 1) % 2 // Simple toggle for now
}

// ============================================
// DUNGEON / ROOM
// ============================================

function handleSelectRoom(draft: RunState, roomUid: string): void {
  const room = draft.roomChoices.find((r) => r.uid === roomUid)
  if (!room) return

  // Clear choices
  draft.roomChoices = []

  // TODO: Start room encounter based on room type
  draft.gamePhase = 'combat'
}

function handleDealRoomChoices(draft: RunState): void {
  // Draw 3 rooms from dungeon deck
  const choices: typeof draft.roomChoices = []

  for (let i = 0; i < 3 && draft.dungeonDeck.length > 0; i++) {
    const room = draft.dungeonDeck.pop()
    if (room) {
      room.revealed = true
      choices.push(room)
    }
  }

  draft.roomChoices = choices
  draft.gamePhase = 'roomSelect'
}

// ============================================
// UTILITIES
// ============================================

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Create card instance from definition
export function createCardInstance(definitionId: string): CardInstance {
  return {
    uid: generateUid(),
    definitionId,
    upgraded: false,
  }
}
