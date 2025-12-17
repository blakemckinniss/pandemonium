// ============================================
// ROOM / DUNGEON
// ============================================

export type RoomType = 'combat' | 'elite' | 'boss' | 'campfire' | 'event' | 'shop' | 'treasure'

export interface RoomDefinition {
  id: string
  type: RoomType
  name: string
  description: string
  icon?: string
  image?: string
  monsters?: string[]
}

export interface RoomCard {
  uid: string
  definitionId: string
  revealed: boolean
  enemyCardIds?: string[] // For combat rooms: which enemy cards to spawn (overrides room definition)
}

// ============================================
// DUNGEON DECK DEFINITIONS
// ============================================

export interface DungeonRoom {
  id: string
  type: RoomType
  enemyCardIds?: string[] // For combat rooms: which enemy cards to spawn
  modifiers?: RoomModifier[]
}

export interface RoomModifier {
  type: 'elite' | 'boss' | 'doubleEnemy' | 'noReward' | 'enhancedReward'
  value?: number
}

/**
 * A saveable dungeon deck template that defines a complete run structure.
 * Can be Groq-generated, player-modified, or system-created.
 */
export interface DungeonDeckDefinition {
  id: string
  name: string
  description: string
  theme?: string // "Fire Caverns", "Void Temple", etc.
  difficulty: 1 | 2 | 3 | 4 | 5

  // Room composition
  rooms: DungeonRoom[]

  // Metadata
  createdBy: 'groq' | 'player' | 'system'
  createdAt: number
}

/**
 * Tracks player ownership of dungeon decks with roguelike consequences.
 * - Beat deck → Special reward scaled to difficulty
 * - Abandon deck → Gold cost penalty
 * - Die → Lose deck + death penalties
 */
export interface OwnedDungeonDeck {
  deckId: string
  acquiredAt: number
  status: 'available' | 'active' | 'beaten' | 'abandoned' | 'lost'
  attemptsCount: number
  bestFloor: number
  completedAt?: number
}
