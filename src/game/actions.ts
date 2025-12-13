import { produce } from 'immer'
import type {
  RunState,
  CombatState,
  CardInstance,
  EnemyEntity,
  Entity,
  GameAction,
  AtomicEffect,
  EffectContext,
  EffectValue,
  EntityTarget,
  CardTarget,
  FilteredCardTarget,
  VisualEvent,
} from '../types'
import { getCardDefinition } from './cards'
import { generateUid } from '../lib/utils'
import {
  resolveValue,
  evaluateCondition,
  resolveEntityTargets,
  getEntityById,
  resolveCardTarget,
} from '../lib/effects'
import {
  applyOutgoingDamageModifiers,
  applyIncomingDamageModifiers,
  applyOutgoingBlockModifiers,
  applyPowerToEntity,
  removePowerFromEntity,
  decayPowers,
  getPowerTriggers,
} from './powers'
import {
  executeScry,
  executeTutor,
  handleResolveScry,
  handleResolveTutor as resolveTutorSelection,
} from './selection-effects'

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
      case 'applyPower':
        handleApplyPower(draft, action.targetId, action.powerId, action.amount)
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
      case 'clearVisualQueue':
        handleClearVisualQueue(draft)
        break
      case 'resolveScry':
        handleResolveScry(draft, action.keptUids, action.discardedUids)
        break
      case 'resolveTutor':
        resolveTutorSelection(draft, action.selectedUids, shuffleArray)
        break
    }
  })
}

// ============================================
// COMBAT SETUP
// ============================================

function handleStartCombat(draft: RunState, enemies: EnemyEntity[]): void {
  const shuffledDeck = shuffleArray([...draft.deck])

  draft.combat = {
    phase: 'playerTurn',
    turn: 0,
    player: {
      id: 'player',
      name: draft.hero.name,
      currentHealth: draft.hero.health,
      maxHealth: draft.hero.health,
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

function handleClearVisualQueue(draft: RunState): void {
  if (draft.combat) {
    draft.combat.visualQueue = []
  }
}

// ============================================
// VISUAL EVENT HELPER
// ============================================

function emitVisual(draft: RunState, event: VisualEvent): void {
  if (draft.combat) {
    draft.combat.visualQueue.push(event)
  }
}

// ============================================
// TURN MANAGEMENT
// ============================================

function handleStartTurn(draft: RunState): void {
  if (!draft.combat) return

  const combat = draft.combat
  combat.phase = 'playerTurn'
  combat.turn += 1
  combat.cardsPlayedThisTurn = 0

  // Reset energy
  combat.player.energy = combat.player.maxEnergy

  // Clear block
  combat.player.block = 0

  // Decay powers at turn start
  decayPowers(combat.player, 'turnStart')

  // Execute power triggers for player
  executePowerTriggers(draft, combat.player, 'onTurnStart')

  // Draw 5 cards
  drawCardsInternal(combat, 5)
}

function handleEndTurn(draft: RunState): void {
  if (!draft.combat) return

  const combat = draft.combat

  // Execute power triggers for player
  executePowerTriggers(draft, combat.player, 'onTurnEnd')

  // Decay powers at turn end
  decayPowers(combat.player, 'turnEnd')

  // Discard hand (except retained cards)
  const retained: typeof combat.hand = []
  const toDiscard: typeof combat.hand = []

  for (const card of combat.hand) {
    if (card.retained) {
      // Keep in hand but clear retain flag (one-time effect)
      card.retained = false
      retained.push(card)
    } else {
      toDiscard.push(card)
    }
  }

  combat.discardPile.push(...toDiscard)
  combat.hand = retained

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

  // Resolve energy cost
  const energyCost = typeof cardDef.energy === 'number'
    ? cardDef.energy
    : resolveValue(cardDef.energy, draft, { source: 'player', cardTarget: targetId })

  // Check energy
  if (combat.player.energy < energyCost) return

  // Spend energy
  combat.player.energy -= energyCost

  // Remove from hand
  combat.hand.splice(cardIndex, 1)

  // Track stats
  draft.stats.cardsPlayed++
  combat.cardsPlayedThisTurn++

  // Build effect context
  const ctx: EffectContext = {
    source: 'player',
    cardTarget: targetId,
  }

  // Execute all effects
  for (const effect of cardDef.effects) {
    executeEffect(draft, effect, ctx)
  }

  // Execute onCardPlayed triggers
  executePowerTriggers(draft, combat.player, 'onCardPlayed')

  // Move to discard
  combat.discardPile.push(cardInstance)
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
// EFFECT EXECUTION ENGINE
// ============================================

function executeEffect(
  draft: RunState,
  effect: AtomicEffect,
  ctx: EffectContext
): void {
  if (!draft.combat) return

  switch (effect.type) {
    case 'damage':
      executeDamage(draft, effect, ctx)
      break
    case 'block':
      executeBlock(draft, effect, ctx)
      break
    case 'heal':
      executeHeal(draft, effect, ctx)
      break
    case 'lifesteal':
      executeLifesteal(draft, effect, ctx)
      break
    case 'energy':
      executeEnergy(draft, effect, ctx)
      break
    case 'draw':
      executeDraw(draft, effect, ctx)
      break
    case 'discard':
      executeDiscard(draft, effect, ctx)
      break
    case 'exhaust':
      executeExhaust(draft, effect, ctx)
      break
    case 'addCard':
      executeAddCard(draft, effect, ctx)
      break
    case 'shuffle':
      executeShuffle(draft, effect, ctx)
      break
    case 'upgrade':
      // TODO: implement upgrade effect
      break
    case 'retain':
      executeRetain(draft, effect, ctx)
      break
    case 'scry':
      executeScry(draft, effect, ctx)
      break
    case 'tutor':
      executeTutor(draft, effect, ctx)
      break
    case 'applyPower':
      executeApplyPower(draft, effect, ctx)
      break
    case 'removePower':
      executeRemovePower(draft, effect, ctx)
      break
    case 'conditional':
      executeConditional(draft, effect, ctx)
      break
    case 'repeat':
      executeRepeat(draft, effect, ctx)
      break
    case 'random':
      executeRandom(draft, effect, ctx)
      break
    case 'sequence':
      executeSequence(draft, effect, ctx)
      break
    case 'forEach':
      executeForEach(draft, effect, ctx)
      break
  }
}

function executeDamage(
  draft: RunState,
  effect: { type: 'damage'; amount: EffectValue; target?: EntityTarget; piercing?: boolean; triggerOnHit?: AtomicEffect[] },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const baseDamage = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? (ctx.cardTarget ? 'enemy' : 'allEnemies')
  const targetIds = resolveEntityTargets(target, draft, ctx)

  // Get attacker for modifiers
  const attacker = getEntityById(ctx.source, draft)

  for (const targetId of targetIds) {
    let damage = baseDamage

    // Apply outgoing modifiers (Strength, Weak)
    if (attacker) {
      damage = applyOutgoingDamageModifiers(damage, attacker)
    }

    // Apply incoming modifiers (Vulnerable)
    const defender = getEntityById(targetId, draft)
    if (defender) {
      damage = applyIncomingDamageModifiers(damage, defender)
    }

    // Apply damage
    const damageDealt = applyDamageInternal(draft, targetId, damage, effect.piercing)

    // Emit visual event
    if (damageDealt > 0) {
      emitVisual(draft, {
        type: 'damage',
        targetId,
        amount: damageDealt,
        variant: effect.piercing ? 'piercing' : undefined,
      })
    }

    // Trigger onHit effects
    if (effect.triggerOnHit && damageDealt > 0) {
      const hitCtx = { ...ctx, currentTarget: targetId }
      for (const onHitEffect of effect.triggerOnHit) {
        executeEffect(draft, onHitEffect, hitCtx)
      }
    }

    // Trigger onAttack for attacker
    if (attacker && damageDealt > 0) {
      executePowerTriggers(draft, attacker, 'onAttack', targetId)
    }

    // Trigger onAttacked/onDamaged for defender
    if (defender && damageDealt > 0) {
      executePowerTriggers(draft, defender, 'onAttacked', ctx.source)
      executePowerTriggers(draft, defender, 'onDamaged', ctx.source)
    }
  }
}

function executeBlock(
  draft: RunState,
  effect: { type: 'block'; amount: EffectValue; target?: EntityTarget; persistent?: boolean },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const baseBlock = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    // Apply block modifiers (Dexterity, Frail)
    const block = applyOutgoingBlockModifiers(baseBlock, entity)

    // Persistent block goes to barrier (doesn't decay at turn start)
    if (effect.persistent) {
      entity.barrier += block
    } else {
      entity.block += block
    }

    // Emit visual event
    if (block > 0) {
      emitVisual(draft, {
        type: 'block',
        targetId,
        amount: block,
        variant: effect.persistent ? 'barrier' : undefined,
      })
    }

    // Trigger onBlock
    executePowerTriggers(draft, entity, 'onBlock')
  }
}

function executeHeal(
  draft: RunState,
  effect: { type: 'heal'; amount: EffectValue; target?: EntityTarget; canOverheal?: boolean },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const prevHealth = entity.currentHealth
    if (effect.canOverheal) {
      entity.currentHealth += amount
    } else {
      entity.currentHealth = Math.min(entity.currentHealth + amount, entity.maxHealth)
    }
    const healed = entity.currentHealth - prevHealth

    // Emit visual event
    if (healed > 0) {
      emitVisual(draft, { type: 'heal', targetId, amount: healed })
    }
  }
}

function executeLifesteal(
  draft: RunState,
  effect: { type: 'lifesteal'; amount: EffectValue; target: EntityTarget; healTarget?: EntityTarget; ratio?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const damage = resolveValue(effect.amount, draft, ctx)
  const ratio = effect.ratio ?? 1

  // Deal damage
  executeDamage(draft, { type: 'damage', amount: damage, target: effect.target }, ctx)

  // Heal
  const healAmount = Math.floor(damage * ratio)
  const healTarget = effect.healTarget ?? 'self'
  executeHeal(draft, { type: 'heal', amount: healAmount, target: healTarget }, ctx)
}

function executeEnergy(
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

function executeDraw(
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

function executeDiscard(
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

function executeExhaust(
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

function executeAddCard(
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

  // Emit visual for card creation
  if (count > 0) {
    emitVisual(draft, {
      type: 'addCard',
      cardId: effect.cardId,
      destination: effect.destination,
      count,
    })
  }
}

function executeShuffle(
  draft: RunState,
  effect: { type: 'shuffle'; pile: 'drawPile' | 'discardPile'; into?: 'drawPile' },
  _ctx: EffectContext
): void {
  if (!draft.combat) return

  if (effect.into === 'drawPile' && effect.pile === 'discardPile') {
    // Shuffle discard into draw pile
    draft.combat.drawPile = shuffleArray([
      ...draft.combat.drawPile,
      ...draft.combat.discardPile,
    ])
    draft.combat.discardPile = []
  } else {
    // Just shuffle the pile
    draft.combat[effect.pile] = shuffleArray([...draft.combat[effect.pile]])
  }

  emitVisual(draft, { type: 'shuffle' })
}

function executeRetain(
  draft: RunState,
  effect: { type: 'retain'; target: CardTarget | FilteredCardTarget },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const cards = resolveCardTarget(effect.target, draft, ctx)

  for (const card of cards) {
    // Find card in hand and mark as retained
    const handCard = draft.combat.hand.find((c) => c.uid === card.uid)
    if (handCard) {
      handCard.retained = true
    }
  }
}

function executeApplyPower(
  draft: RunState,
  effect: { type: 'applyPower'; powerId: string; amount: EffectValue; target?: EntityTarget; duration?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    applyPowerToEntity(entity, effect.powerId, amount, effect.duration)

    emitVisual(draft, {
      type: 'powerApply',
      targetId,
      powerId: effect.powerId,
      amount,
    })
  }
}

function executeRemovePower(
  draft: RunState,
  effect: { type: 'removePower'; powerId: string; target?: EntityTarget; amount?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = effect.amount ? resolveValue(effect.amount, draft, ctx) : undefined
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const hadPower = entity.powers[effect.powerId] !== undefined
    removePowerFromEntity(entity, effect.powerId, amount)

    if (hadPower) {
      emitVisual(draft, {
        type: 'powerRemove',
        targetId,
        powerId: effect.powerId,
      })
    }
  }
}

function executeConditional(
  draft: RunState,
  effect: { type: 'conditional'; condition: import('../types').Condition; then: AtomicEffect[]; else?: AtomicEffect[] },
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

function executeRepeat(
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

function executeRandom(
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

function executeSequence(
  draft: RunState,
  effect: { type: 'sequence'; effects: AtomicEffect[] },
  ctx: EffectContext
): void {
  for (const e of effect.effects) {
    executeEffect(draft, e, ctx)
  }
}

function executeForEach(
  draft: RunState,
  effect: { type: 'forEach'; target: EntityTarget | CardTarget; effects: AtomicEffect[] },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  // Check if it's an entity target or card target
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

// ============================================
// POWER TRIGGER EXECUTION
// ============================================

function executePowerTriggers(
  draft: RunState,
  entity: Entity,
  event: string,
  sourceId?: string
): void {
  const triggers = getPowerTriggers(entity, event)

  for (const trigger of triggers) {
    const ctx: EffectContext = {
      source: entity.id,
      powerId: trigger.powerId,
      powerStacks: trigger.stacks,
      currentTarget: sourceId,
    }

    for (const effect of trigger.effects) {
      executeEffect(draft, effect, ctx)
    }
  }
}

// ============================================
// DAMAGE & HEALING (Direct Actions)
// ============================================

function handleDamage(draft: RunState, targetId: string, amount: number): void {
  if (!draft.combat) return
  applyDamageInternal(draft, targetId, amount)
}

/**
 * Apply damage to an entity, returns actual damage dealt
 */
function applyDamageInternal(
  draft: RunState,
  targetId: string,
  amount: number,
  piercing?: boolean
): number {
  if (!draft.combat) return 0
  const combat = draft.combat

  if (targetId === 'player') {
    let remaining = amount

    // Block absorbs first (unless piercing)
    if (!piercing && combat.player.block > 0) {
      const blocked = Math.min(combat.player.block, remaining)
      combat.player.block -= blocked
      remaining -= blocked
    }

    // Barrier absorbs second (unless piercing)
    if (!piercing && remaining > 0 && combat.player.barrier > 0) {
      const absorbed = Math.min(combat.player.barrier, remaining)
      combat.player.barrier -= absorbed
      remaining -= absorbed
    }

    combat.player.currentHealth -= remaining
    draft.stats.damageTaken += remaining

    if (combat.player.currentHealth <= 0) {
      combat.phase = 'defeat'
    }

    return remaining
  } else {
    const enemy = combat.enemies.find((e) => e.id === targetId)
    if (!enemy) return 0

    let remaining = amount

    if (!piercing && enemy.block > 0) {
      const blocked = Math.min(enemy.block, remaining)
      enemy.block -= blocked
      remaining -= blocked
    }

    // Barrier absorbs second (unless piercing)
    if (!piercing && remaining > 0 && enemy.barrier > 0) {
      const absorbed = Math.min(enemy.barrier, remaining)
      enemy.barrier -= absorbed
      remaining -= absorbed
    }

    enemy.currentHealth -= remaining
    draft.stats.damageDealt += remaining

    if (enemy.currentHealth <= 0) {
      combat.enemies = combat.enemies.filter((e) => e.id !== targetId)
      draft.stats.enemiesKilled++

      // Trigger onKill for player
      executePowerTriggers(draft, combat.player, 'onKill')

      if (combat.enemies.length === 0) {
        combat.phase = 'victory'
      }
    }

    return remaining
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

function handleApplyPower(
  draft: RunState,
  targetId: string,
  powerId: string,
  amount: number
): void {
  if (!draft.combat) return

  const entity = getEntityById(targetId, draft)
  if (!entity) return

  applyPowerToEntity(entity, powerId, amount)
}

// ============================================
// ENEMY AI
// ============================================

function handleEnemyAction(draft: RunState, enemyId: string): void {
  if (!draft.combat) return

  const enemy = draft.combat.enemies.find((e) => e.id === enemyId)
  if (!enemy) return

  // Decay powers at turn start for enemy
  decayPowers(enemy, 'turnStart')
  executePowerTriggers(draft, enemy, 'onTurnStart')

  // Clear enemy block at turn start
  enemy.block = 0

  const intent = enemy.intent

  switch (intent.type) {
    case 'attack': {
      const baseDamage = intent.value ?? 0
      const damage = applyOutgoingDamageModifiers(baseDamage, enemy)
      const finalDamage = applyIncomingDamageModifiers(damage, draft.combat.player)
      applyDamageInternal(draft, 'player', finalDamage)

      // Trigger onAttack for enemy
      executePowerTriggers(draft, enemy, 'onAttack')
      // Trigger onAttacked for player
      executePowerTriggers(draft, draft.combat.player, 'onAttacked', enemyId)
      break
    }
    case 'defend':
      enemy.block += applyOutgoingBlockModifiers(intent.value ?? 0, enemy)
      break
    case 'buff':
      // Intent pattern buff
      break
    case 'debuff':
      // Intent pattern debuff
      break
  }

  // End of enemy turn triggers
  executePowerTriggers(draft, enemy, 'onTurnEnd')
  decayPowers(enemy, 'turnEnd')

  // Advance pattern
  enemy.patternIndex = (enemy.patternIndex + 1) % 2
}

// ============================================
// DUNGEON / ROOM
// ============================================

function handleSelectRoom(draft: RunState, roomUid: string): void {
  const room = draft.roomChoices.find((r) => r.uid === roomUid)
  if (!room) return

  draft.roomChoices = []
  draft.gamePhase = 'combat'
}

function handleDealRoomChoices(draft: RunState): void {
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

export function createCardInstance(definitionId: string): CardInstance {
  return {
    uid: generateUid(),
    definitionId,
    upgraded: false,
  }
}
