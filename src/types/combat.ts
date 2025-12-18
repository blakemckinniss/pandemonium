// ============================================
// GAME STATE
// ============================================

import type { PlayerEntity, EnemyEntity, HeroState } from './entities'
import type { CardInstance, CardDefinition } from './cards'
import type { RelicInstance } from './relics'
import type { RoomCard } from './rooms'
import type { VisualEvent } from './visuals'
import type { CardTarget, FilteredCardTarget } from './targeting'
import type { AtomicEffect, EffectContext } from './effects'

// Delayed effect storage
export interface DelayedEffectEntry {
  turnsRemaining: number
  effects: AtomicEffect[]
  trigger: 'turnStart' | 'turnEnd'
  sourceCtx: EffectContext
}

export type TurnPhase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat'
export type GamePhase = 'menu' | 'roomSelect' | 'combat' | 'reward' | 'campfire' | 'treasure' | 'dungeonComplete' | 'gameOver'
export type AppScreen = 'menu' | 'deckBuilder' | 'game'

// Pending player selections (for scry, tutor, etc.)
export interface PendingScry {
  type: 'scry'
  cards: CardInstance[] // Cards being viewed (removed from draw pile temporarily)
}

export interface PendingTutor {
  type: 'tutor'
  cards: CardInstance[] // Cards matching filter
  sourceIndices: number[] // Original indices in source pile for removal
  from: 'drawPile' | 'discardPile'
  maxSelect: number
  destination: 'hand' | 'drawPile'
  position?: 'top' | 'bottom' | 'random'
  shuffle?: boolean
}

export interface PendingDiscover {
  type: 'discover'
  cards: CardDefinition[] // Generated card options to choose from
  maxSelect: number // How many cards to pick (usually 1)
  destination: 'hand' | 'drawPile' | 'discardPile'
  copies?: number // How many copies of chosen card to add
}

export interface PendingBanish {
  type: 'banish'
  cards: CardInstance[] // Cards available to banish
  from: CardTarget | FilteredCardTarget // Source pile
  maxSelect: number // How many to select
}

export type PendingSelection = PendingScry | PendingTutor | PendingDiscover | PendingBanish

export interface CombatState {
  phase: TurnPhase
  turn: number
  player: PlayerEntity
  enemies: EnemyEntity[]
  hand: CardInstance[]
  drawPile: CardInstance[]
  discardPile: CardInstance[]
  exhaustPile: CardInstance[]
  cardsPlayedThisTurn: number
  lastPlayedCard?: CardInstance // Most recently played card this turn
  visualQueue: VisualEvent[]
  pendingSelection?: PendingSelection
  delayedEffects?: DelayedEffectEntry[] // Effects scheduled to trigger in future turns
}

export interface RunStats {
  enemiesKilled: number
  cardsPlayed: number
  damageDealt: number
  damageTaken: number
}

export interface RunState {
  gamePhase: GamePhase
  floor: number
  hero: HeroState
  deck: CardInstance[]
  relics: RelicInstance[]
  combat: CombatState | null
  dungeonDeck: RoomCard[]
  roomChoices: RoomCard[]
  currentRoomId?: string // The room definition ID of current/just-completed room
  gold: number
  stats: RunStats
  // Dungeon deck tracking (for roguelike ownership)
  dungeonDeckId?: string // Reference to DungeonDeckDefinition.id
}
