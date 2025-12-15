import type { RunState, GameAction } from '../../types'
import { applyAction } from '../../game/actions'

// ============================================================================
// Core Action Execution
// ============================================================================

/** Apply a single action to state */
export function act(state: RunState, action: GameAction): RunState {
  return applyAction(state, action)
}

/** Apply multiple actions in sequence */
export function actSequence(state: RunState, actions: GameAction[]): RunState {
  return actions.reduce((s, action) => applyAction(s, action), state)
}

// ============================================================================
// Card Actions
// ============================================================================

/**
 * Play a card by UID or definition ID (finds first matching in hand)
 * @throws if card not found in hand
 */
export function playCard(
  state: RunState,
  cardUidOrDefId: string,
  targetId?: string
): RunState {
  const card = state.combat?.hand.find(
    c => c.uid === cardUidOrDefId || c.definitionId === cardUidOrDefId
  )
  if (!card) {
    throw new Error(`Card not found in hand: ${cardUidOrDefId}`)
  }
  return applyAction(state, { type: 'playCard', cardUid: card.uid, targetId })
}

/**
 * Play multiple cards in sequence
 * @example playCards(state, [{ card: 'strike', target: 'enemy_1' }, { card: 'defend' }])
 */
export function playCards(
  state: RunState,
  cards: Array<{ card: string; target?: string }>
): RunState {
  return cards.reduce(
    (s, { card, target }) => playCard(s, card, target),
    state
  )
}

/**
 * Play all playable cards targeting specific enemy
 * Stops when hand empty or no energy
 */
export function playAllCardsAt(state: RunState, targetId: string): RunState {
  let current = state
  while (current.combat?.hand.length && current.combat.player.energy > 0) {
    const card = current.combat.hand[0]
    try {
      current = playCard(current, card.uid, targetId)
    } catch {
      break
    }
  }
  return current
}

/** Draw cards */
export function drawCards(state: RunState, amount: number): RunState {
  return applyAction(state, { type: 'drawCards', amount })
}

/** Discard a card by UID */
export function discardCard(state: RunState, cardUid: string): RunState {
  return applyAction(state, { type: 'discardCard', cardUid })
}

/** Discard entire hand */
export function discardHand(state: RunState): RunState {
  return applyAction(state, { type: 'discardHand' })
}

// ============================================================================
// Turn Actions
// ============================================================================

/** End the player's turn */
export function endTurn(state: RunState): RunState {
  return applyAction(state, { type: 'endTurn' })
}

/** Start a new turn */
export function startTurn(state: RunState): RunState {
  return applyAction(state, { type: 'startTurn' })
}

/**
 * End player turn and execute enemy actions
 */
export function endPlayerTurn(state: RunState): RunState {
  let result = applyAction(state, { type: 'endTurn' })

  // Execute enemy actions
  for (const enemy of result.combat?.enemies ?? []) {
    result = applyAction(result, { type: 'enemyAction', enemyId: enemy.id })
  }

  return result
}

/**
 * Complete a full turn cycle: end turn -> enemies act -> new turn starts
 */
export function completeTurn(state: RunState): RunState {
  let result = endPlayerTurn(state)
  if (result.combat?.phase !== 'victory' && result.combat?.phase !== 'defeat') {
    result = applyAction(result, { type: 'startTurn' })
  }
  return result
}

/**
 * Run N complete turns
 * Stops early if combat ends
 */
export function runTurns(state: RunState, count: number): RunState {
  let result = state
  for (let i = 0; i < count; i++) {
    result = completeTurn(result)
    if (result.combat?.phase === 'victory' || result.combat?.phase === 'defeat') {
      break
    }
  }
  return result
}

// ============================================================================
// Direct Effect Actions
// ============================================================================

/** Deal damage directly to a target */
export function dealDamage(state: RunState, targetId: string, amount: number): RunState {
  return applyAction(state, { type: 'damage', targetId, amount })
}

/** Heal a target */
export function heal(state: RunState, targetId: string, amount: number): RunState {
  return applyAction(state, { type: 'heal', targetId, amount })
}

/** Add block to a target */
export function addBlock(state: RunState, targetId: string, amount: number): RunState {
  return applyAction(state, { type: 'addBlock', targetId, amount })
}

/** Apply power to a target */
export function applyPower(
  state: RunState,
  targetId: string,
  powerId: string,
  amount: number
): RunState {
  return applyAction(state, { type: 'applyPower', targetId, powerId, amount })
}

/** Gain energy */
export function gainEnergy(state: RunState, amount: number): RunState {
  return applyAction(state, { type: 'gainEnergy', amount })
}

/** Spend energy */
export function spendEnergy(state: RunState, amount: number): RunState {
  return applyAction(state, { type: 'spendEnergy', amount })
}

// ============================================================================
// Combat Actions
// ============================================================================

/** Start combat with specified enemies */
export function startCombat(state: RunState, enemies = state.combat?.enemies ?? []): RunState {
  return applyAction(state, { type: 'startCombat', enemies })
}

/** End combat */
export function endCombat(state: RunState, victory: boolean): RunState {
  return applyAction(state, { type: 'endCombat', victory })
}

/** Execute enemy action */
export function enemyAction(state: RunState, enemyId: string): RunState {
  return applyAction(state, { type: 'enemyAction', enemyId })
}

// ============================================================================
// Hero Ability Actions
// ============================================================================

/** Use hero's activated ability */
export function useActivatedAbility(state: RunState): RunState {
  return applyAction(state, { type: 'useActivatedAbility' })
}

/** Use hero's ultimate ability */
export function useUltimateAbility(state: RunState): RunState {
  return applyAction(state, { type: 'useUltimateAbility' })
}
