import Dexie, { type EntityTable } from 'dexie'
import type { CardDefinition } from '../types'

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
// DATABASE
// ============================================

class PandemoniumDB extends Dexie {
  runs!: EntityTable<RunRecord, 'id'>
  generatedCards!: EntityTable<GeneratedCardRecord, 'id'>
  customDecks!: EntityTable<CustomDeckRecord, 'id'>

  constructor() {
    super('PandemoniumDB')

    this.version(1).stores({
      runs: '++id, startedAt, heroId, won, floor',
    })

    // Version 2: Add generated cards storage
    this.version(2).stores({
      runs: '++id, startedAt, heroId, won, floor',
      generatedCards: '++id, cardId, generatedAt, model',
    })

    // Version 3: Add custom decks storage
    this.version(3).stores({
      runs: '++id, startedAt, heroId, won, floor',
      generatedCards: '++id, cardId, generatedAt, model',
      customDecks: '++id, deckId, heroId, createdAt',
    })
  }
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
