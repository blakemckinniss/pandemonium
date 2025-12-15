import Dexie, { type EntityTable } from 'dexie'
import type { CardDefinition, DungeonDeckDefinition, OwnedDungeonDeck } from '../types'

// ============================================
// RUN HISTORY SCHEMA
// ============================================

export interface RunRecord {
  id?: number
  startedAt: Date
  endedAt: Date
  heroId: string
  won: boolean
  floor: number
  gold: number
  enemiesKilled: number
  cardsPlayed: number
  damageDealt: number
  damageTaken: number
  finalDeck: string[] // Card definition IDs
}

// ============================================
// GENERATED CARDS SCHEMA
// ============================================

export interface GeneratedCardRecord {
  id?: number
  cardId: string // The card's unique ID (e.g., "generated_1234567890")
  definition: CardDefinition
  generatedAt: Date
  model: string // Model used for generation
  prompt?: string // Optional: store the prompt used
}

// ============================================
// PLAYER COLLECTION SCHEMA
// ============================================

export interface CollectionCard {
  id?: number
  cardId: string // Reference to card definition ID
  quantity: number // How many copies owned
  obtainedAt: Date
  source: 'starter' | 'pack' | 'reward' | 'crafted'
}

// ============================================
// CUSTOM DECKS SCHEMA
// ============================================

export interface CustomDeckRecord {
  id?: number
  deckId: string // Unique ID for the deck
  name: string
  heroId: string
  cardIds: string[] // Array of CardDefinition IDs
  createdAt: Date
  updatedAt: Date
}

// ============================================
// DUNGEON DECK SCHEMA
// ============================================

export interface DungeonDeckRecord {
  id?: number
  deckId: string // Unique ID for the dungeon deck
  definition: DungeonDeckDefinition
  createdAt: Date
}

export interface OwnedDungeonDeckRecord {
  id?: number
  deckId: string // Reference to DungeonDeckRecord.deckId
  ownership: OwnedDungeonDeck
}

// ============================================
// DATABASE
// ============================================

// Schema version - bump this and wipe DB on breaking changes
const SCHEMA_VERSION = 2

class PandemoniumDB extends Dexie {
  runs!: EntityTable<RunRecord, 'id'>
  generatedCards!: EntityTable<GeneratedCardRecord, 'id'>
  customDecks!: EntityTable<CustomDeckRecord, 'id'>
  collection!: EntityTable<CollectionCard, 'id'>
  dungeonDecks!: EntityTable<DungeonDeckRecord, 'id'>
  ownedDungeonDecks!: EntityTable<OwnedDungeonDeckRecord, 'id'>

  constructor() {
    super('PandemoniumDB')

    // Single schema definition - no migration history needed (MVP scorched earth policy)
    this.version(SCHEMA_VERSION).stores({
      runs: '++id, startedAt, heroId, won, floor',
      generatedCards: '++id, cardId, generatedAt, model',
      customDecks: '++id, deckId, heroId, createdAt',
      collection: '++id, &cardId, obtainedAt, source',
      dungeonDecks: '++id, &deckId, createdAt',
      ownedDungeonDecks: '++id, &deckId',
    })
  }
}

/**
 * Wipe database completely. Use when schema changes break compatibility.
 * Call from browser console: await import('/src/stores/db').then(m => m.resetDatabase())
 */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  window.location.reload()
}

export const db = new PandemoniumDB()

// ============================================
// RUN HISTORY FUNCTIONS
// ============================================

export async function saveRun(run: Omit<RunRecord, 'id'>): Promise<number> {
  const id = await db.runs.add(run)
  return id as number
}

export async function getRunHistory(limit: number = 50): Promise<RunRecord[]> {
  return db.runs.orderBy('startedAt').reverse().limit(limit).toArray()
}

export async function getRunById(id: number): Promise<RunRecord | undefined> {
  return db.runs.get(id)
}

export async function getRunStats(): Promise<{
  totalRuns: number
  totalWins: number
  winRate: number
  bestFloor: number
  avgFloor: number
}> {
  const runs = await db.runs.toArray()

  if (runs.length === 0) {
    return {
      totalRuns: 0,
      totalWins: 0,
      winRate: 0,
      bestFloor: 0,
      avgFloor: 0,
    }
  }

  const totalRuns = runs.length
  const totalWins = runs.filter((r) => r.won).length
  const bestFloor = Math.max(...runs.map((r) => r.floor))
  const avgFloor = runs.reduce((sum, r) => sum + r.floor, 0) / totalRuns

  return {
    totalRuns,
    totalWins,
    winRate: totalWins / totalRuns,
    bestFloor,
    avgFloor: Math.round(avgFloor * 10) / 10,
  }
}

export async function clearRunHistory(): Promise<void> {
  await db.runs.clear()
}

// ============================================
// GENERATED CARDS FUNCTIONS
// ============================================

export async function saveGeneratedCard(
  definition: CardDefinition,
  model: string,
  prompt?: string
): Promise<number> {
  const record: Omit<GeneratedCardRecord, 'id'> = {
    cardId: definition.id,
    definition,
    generatedAt: new Date(),
    model,
    prompt,
  }
  const id = await db.generatedCards.add(record)
  return id as number
}

export async function getAllGeneratedCards(): Promise<GeneratedCardRecord[]> {
  return db.generatedCards.orderBy('generatedAt').reverse().toArray()
}

export async function getGeneratedCardByCardId(
  cardId: string
): Promise<GeneratedCardRecord | undefined> {
  return db.generatedCards.where('cardId').equals(cardId).first()
}

export async function deleteGeneratedCard(cardId: string): Promise<void> {
  await db.generatedCards.where('cardId').equals(cardId).delete()
}

export async function clearGeneratedCards(): Promise<void> {
  await db.generatedCards.clear()
}

export async function getGeneratedCardCount(): Promise<number> {
  return db.generatedCards.count()
}

// ============================================
// CUSTOM DECKS FUNCTIONS
// ============================================

export async function saveCustomDeck(
  deck: Omit<CustomDeckRecord, 'id'>
): Promise<number> {
  const id = await db.customDecks.add(deck)
  return id as number
}

export async function getCustomDecks(): Promise<CustomDeckRecord[]> {
  return db.customDecks.orderBy('createdAt').reverse().toArray()
}

export async function getCustomDeckById(
  deckId: string
): Promise<CustomDeckRecord | undefined> {
  return db.customDecks.where('deckId').equals(deckId).first()
}

export async function updateCustomDeck(
  deckId: string,
  updates: Partial<Pick<CustomDeckRecord, 'name' | 'cardIds' | 'heroId'>>
): Promise<void> {
  await db.customDecks.where('deckId').equals(deckId).modify({
    ...updates,
    updatedAt: new Date(),
  })
}

export async function deleteCustomDeck(deckId: string): Promise<void> {
  await db.customDecks.where('deckId').equals(deckId).delete()
}

export async function clearCustomDecks(): Promise<void> {
  await db.customDecks.clear()
}

// ============================================
// COLLECTION FUNCTIONS (TCG Ownership)
// ============================================

export async function addToCollection(
  cardId: string,
  quantity: number = 1,
  source: CollectionCard['source'] = 'pack'
): Promise<void> {
  const existing = await db.collection.where('cardId').equals(cardId).first()

  if (existing) {
    await db.collection.where('cardId').equals(cardId).modify({
      quantity: existing.quantity + quantity,
    })
  } else {
    await db.collection.add({
      cardId,
      quantity,
      obtainedAt: new Date(),
      source,
    })
  }
}

export async function removeFromCollection(
  cardId: string,
  quantity: number = 1
): Promise<boolean> {
  const existing = await db.collection.where('cardId').equals(cardId).first()

  if (!existing || existing.quantity < quantity) {
    return false
  }

  if (existing.quantity === quantity) {
    await db.collection.where('cardId').equals(cardId).delete()
  } else {
    await db.collection.where('cardId').equals(cardId).modify({
      quantity: existing.quantity - quantity,
    })
  }

  return true
}

export async function getCollection(): Promise<CollectionCard[]> {
  return db.collection.toArray()
}

export async function getCollectionCard(cardId: string): Promise<CollectionCard | undefined> {
  return db.collection.where('cardId').equals(cardId).first()
}

export async function getOwnedQuantity(cardId: string): Promise<number> {
  const card = await db.collection.where('cardId').equals(cardId).first()
  return card?.quantity ?? 0
}

export async function ownsCard(cardId: string): Promise<boolean> {
  const qty = await getOwnedQuantity(cardId)
  return qty > 0
}

export async function clearCollection(): Promise<void> {
  await db.collection.clear()
}

export async function initializeStarterCollection(starterCardIds: string[]): Promise<void> {
  // Only initialize if collection is empty
  const count = await db.collection.count()
  if (count > 0) return

  for (const cardId of starterCardIds) {
    await addToCollection(cardId, 1, 'starter')
  }
}

// ============================================
// DUNGEON DECK FUNCTIONS
// ============================================

export async function saveDungeonDeck(
  definition: DungeonDeckDefinition
): Promise<number> {
  const record: Omit<DungeonDeckRecord, 'id'> = {
    deckId: definition.id,
    definition,
    createdAt: new Date(),
  }
  const id = await db.dungeonDecks.add(record)
  return id as number
}

export async function getDungeonDeck(
  deckId: string
): Promise<DungeonDeckDefinition | undefined> {
  const record = await db.dungeonDecks.where('deckId').equals(deckId).first()
  return record?.definition
}

export async function getAllDungeonDecks(): Promise<DungeonDeckDefinition[]> {
  const records = await db.dungeonDecks.orderBy('createdAt').reverse().toArray()
  return records.map(r => r.definition)
}

export async function deleteDungeonDeck(deckId: string): Promise<void> {
  await db.dungeonDecks.where('deckId').equals(deckId).delete()
  // Also delete ownership record if exists
  await db.ownedDungeonDecks.where('deckId').equals(deckId).delete()
}

export async function clearDungeonDecks(): Promise<void> {
  await db.dungeonDecks.clear()
  await db.ownedDungeonDecks.clear()
}

// ============================================
// OWNED DUNGEON DECK FUNCTIONS
// ============================================

export async function acquireDungeonDeck(deckId: string): Promise<void> {
  const existing = await db.ownedDungeonDecks.where('deckId').equals(deckId).first()
  if (existing) return // Already owned

  const ownership: OwnedDungeonDeck = {
    deckId,
    acquiredAt: Date.now(),
    status: 'available',
    attemptsCount: 0,
    bestFloor: 0,
  }
  await db.ownedDungeonDecks.add({ deckId, ownership })
}

export async function getOwnedDungeonDeck(
  deckId: string
): Promise<OwnedDungeonDeck | undefined> {
  const record = await db.ownedDungeonDecks.where('deckId').equals(deckId).first()
  return record?.ownership
}

export async function getAllOwnedDungeonDecks(): Promise<OwnedDungeonDeck[]> {
  const records = await db.ownedDungeonDecks.toArray()
  return records.map(r => r.ownership)
}

export async function updateOwnedDungeonDeck(
  deckId: string,
  updates: Partial<OwnedDungeonDeck>
): Promise<void> {
  const record = await db.ownedDungeonDecks.where('deckId').equals(deckId).first()
  if (!record) return

  await db.ownedDungeonDecks.where('deckId').equals(deckId).modify({
    ownership: { ...record.ownership, ...updates },
  })
}

export async function startDungeonRun(deckId: string): Promise<void> {
  await updateOwnedDungeonDeck(deckId, {
    status: 'active',
    attemptsCount: (await getOwnedDungeonDeck(deckId))?.attemptsCount ?? 0 + 1,
  })
}

export async function completeDungeonDeck(
  deckId: string,
  outcome: 'beaten' | 'abandoned' | 'lost',
  finalFloor: number
): Promise<void> {
  const owned = await getOwnedDungeonDeck(deckId)
  if (!owned) return

  await updateOwnedDungeonDeck(deckId, {
    status: outcome,
    bestFloor: Math.max(owned.bestFloor, finalFloor),
    completedAt: Date.now(),
  })
}

export async function getAvailableDungeonDecks(): Promise<OwnedDungeonDeck[]> {
  const all = await getAllOwnedDungeonDecks()
  return all.filter(d => d.status === 'available')
}
