// ============================================================================
// Pandemonium Test Infrastructure - Public API
// ============================================================================
// Single import point for all testing utilities
//
// Usage:
//   import { scenario, playCard, expectVictory, RunBuilder } from '../test'
//
// ============================================================================

// Factories
export {
  // Entity factories
  createPlayer,
  createEnemy,
  createEnemies,
  resetEnemyCounter,
  createPower,
  createPowers,
  createIntent,
  INTENTS,
  type PlayerOptions,
  type EnemyOptions,
  // Card factories
  createCard,
  createCardInstance,
  createDeck,
  createHand,
  createPile,
  resetCardCounter,
  DECKS,
  type CardOptions,
  type PileOptions,
  // Combat factory
  createCombat,
  CombatBuilder,
  type CombatOptions,
  // Run state factory
  createRunState,
  createStats,
  createHero,
  createRelic,
  resetRelicCounter,
  RunBuilder,
  type RunOptions,
  type HeroOptions,
  type RelicOptions,
} from './factories'

// Scenarios
export { scenarios, scenario, type ScenarioName } from './scenarios'

// Helpers - Assertions
export {
  expectHealth,
  expectDamaged,
  expectBlock,
  expectBarrier,
  expectPower,
  expectNoPower,
  expectDead,
  expectAlive,
  expectPhase,
  expectVictory,
  expectDefeat,
  expectTurn,
  expectEnergy,
  expectEnemyCount,
  expectHandSize,
  expectDrawPileSize,
  expectDiscardPileSize,
  expectExhaustPileSize,
  expectCardInHand,
  expectCardNotInHand,
  expectCardInDiscard,
  expectCardInExhaust,
  expectStats,
  expectDamageDealt,
  expectDamageTaken,
  expectCardsPlayed,
  expectEnemiesKilled,
  expectGamePhase,
  expectFloor,
  expectGold,
} from './helpers'

// Helpers - Actions
export {
  act,
  actSequence,
  playCard,
  playCards,
  playAllCardsAt,
  drawCards,
  discardCard,
  discardHand,
  endTurn,
  startTurn,
  endPlayerTurn,
  completeTurn,
  runTurns,
  dealDamage,
  heal,
  addBlock,
  applyPower,
  gainEnergy,
  spendEnergy,
  startCombat,
  endCombat,
  enemyAction,
  useActivatedAbility,
  useUltimateAbility,
} from './helpers'

// Helpers - Inspection
export {
  getPlayer,
  getEnemy,
  getEntity,
  getAllEnemies,
  getEnemyCount,
  getFirstEnemy,
  getPower,
  getPowerAmount,
  hasPower,
  getPowerIds,
  getHand,
  getDrawPile,
  getDiscardPile,
  getExhaustPile,
  getHandSize,
  findCardInHand,
  findCardByUid,
  isCardInHand,
  getCardsFromHand,
  isInCombat,
  isPlayerTurn,
  isVictory,
  isDefeat,
  isCombatOver,
  getCurrentTurn,
  getCardsPlayedThisTurn,
  getCurrentEnergy,
  getMaxEnergy,
  getCombatPhase,
  getFloor,
  getGold,
  getHeroHealth,
  getHeroMaxHealth,
  getDeckSize,
  getRelicCount,
  hasRelic,
} from './helpers'

// Debug API (browser console)
export {
  registerDebugAPI,
  unregisterDebugAPI,
  isDebugAPIRegistered,
  type DebugAPI,
} from './debug'
