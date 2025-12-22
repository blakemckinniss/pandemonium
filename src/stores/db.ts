import Dexie, { type EntityTable } from 'dexie'
import type {
  CardDefinition,
  DungeonDeckDefinition,
  OwnedDungeonDeck,
  ModifierDefinition,
} from '../types'

// ============================================
// COLLECTION & CARRY SLOT TYPES
// ============================================

export type CarrySlotSource = 'reward' | 'purchase' | 'run_clear' | 'protected'

export interface CollectionUnlockRecord {
  id?: number
  cardId: string
  unlockedAt: Date
  unlockSource: 'starter' | 'reward' | 'purchase' | 'achievement' | 'generated'
  unlockValue?: string // e.g., achievement ID or dungeon ID
}

export interface CarrySlotRecord {
  id?: number
  slotIndex: 0 | 1 | 2
  cardId: string
  protected: boolean
  source: CarrySlotSource
  acquiredAt: Date
}

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
// MODIFIER SCHEMA (Dungeon Deck Modifiers)
// ============================================

export interface ModifierRecord {
  id?: number
  modifierId: string // Unique modifier ID
  definition: ModifierDefinition
  generatedAt: Date
  model?: string // If AI-generated
}

export interface OwnedModifierRecord {
  id?: number
  modifierId: string // Reference to modifier definition ID
  quantity: number
  obtainedAt: Date
  source: 'reward' | 'purchase' | 'starter' | 'achievement' | 'generated'
}

// ============================================
// STREAK HISTORY SCHEMA
// ============================================

export interface StreakHistoryRecord {
  id?: number
  streak: number
  brokenAt: Date
  runsInStreak: number
  totalGoldEarned: number
  modifiersUsed: string[]
}

// ============================================
// DATABASE
// ============================================

// Schema version - bump this and wipe DB on breaking changes
const SCHEMA_VERSION = 4

class PandemoniumDB extends Dexie {
  runs!: EntityTable<RunRecord, 'id'>
  generatedCards!: EntityTable<GeneratedCardRecord, 'id'>
  customDecks!: EntityTable<CustomDeckRecord, 'id'>
  dungeonDecks!: EntityTable<DungeonDeckRecord, 'id'>
  ownedDungeonDecks!: EntityTable<OwnedDungeonDeckRecord, 'id'>
  modifiers!: EntityTable<ModifierRecord, 'id'>
  ownedModifiers!: EntityTable<OwnedModifierRecord, 'id'>
  streakHistory!: EntityTable<StreakHistoryRecord, 'id'>
  collectionUnlocks!: EntityTable<CollectionUnlockRecord, 'id'>
  carrySlots!: EntityTable<CarrySlotRecord, 'id'>

  constructor() {
    super('PandemoniumDB')

    // Single schema definition - no migration history needed (MVP scorched earth policy)
    this.version(SCHEMA_VERSION).stores({
      runs: '++id, startedAt, heroId, won, floor',
      generatedCards: '++id, cardId, generatedAt, model',
      customDecks: '++id, deckId, heroId, createdAt',
      dungeonDecks: '++id, &deckId, createdAt',
      ownedDungeonDecks: '++id, &deckId',
      modifiers: '++id, &modifierId, generatedAt',
      ownedModifiers: '++id, &modifierId, source',
      streakHistory: '++id, brokenAt, streak',
      collectionUnlocks: '++id, &cardId, unlockedAt, unlockSource',
      carrySlots: '++id, &slotIndex, cardId, source',
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

/**
 * Get IDs of all dungeons the player has successfully cleared (status = 'beaten').
 * Used for unlock condition checking.
 */
export async function getClearedDungeonIds(): Promise<string[]> {
  const all = await getAllOwnedDungeonDecks()
  return all.filter(d => d.status === 'beaten').map(d => d.deckId)
}

// ============================================
// MODIFIER FUNCTIONS (AI-Generated Storage)
// ============================================

export async function saveModifier(
  definition: ModifierDefinition,
  model?: string
): Promise<number> {
  const record: Omit<ModifierRecord, 'id'> = {
    modifierId: definition.id,
    definition,
    generatedAt: new Date(),
    model,
  }
  const id = await db.modifiers.add(record)
  return id as number
}

export async function getModifier(
  modifierId: string
): Promise<ModifierDefinition | undefined> {
  const record = await db.modifiers.where('modifierId').equals(modifierId).first()
  return record?.definition
}

export async function getAllSavedModifiers(): Promise<ModifierRecord[]> {
  return db.modifiers.orderBy('generatedAt').reverse().toArray()
}

export async function deleteModifier(modifierId: string): Promise<void> {
  await db.modifiers.where('modifierId').equals(modifierId).delete()
}

export async function clearModifiers(): Promise<void> {
  await db.modifiers.clear()
}

// ============================================
// OWNED MODIFIER FUNCTIONS (Player Collection)
// ============================================

export async function addOwnedModifier(
  modifierId: string,
  quantity: number = 1,
  source: OwnedModifierRecord['source'] = 'reward'
): Promise<void> {
  const existing = await db.ownedModifiers.where('modifierId').equals(modifierId).first()

  if (existing) {
    await db.ownedModifiers.where('modifierId').equals(modifierId).modify({
      quantity: existing.quantity + quantity,
    })
  } else {
    await db.ownedModifiers.add({
      modifierId,
      quantity,
      obtainedAt: new Date(),
      source,
    })
  }
}

export async function removeOwnedModifier(
  modifierId: string,
  quantity: number = 1
): Promise<boolean> {
  const existing = await db.ownedModifiers.where('modifierId').equals(modifierId).first()

  if (!existing || existing.quantity < quantity) {
    return false
  }

  if (existing.quantity === quantity) {
    await db.ownedModifiers.where('modifierId').equals(modifierId).delete()
  } else {
    await db.ownedModifiers.where('modifierId').equals(modifierId).modify({
      quantity: existing.quantity - quantity,
    })
  }

  return true
}

export async function getOwnedModifiers(): Promise<OwnedModifierRecord[]> {
  return db.ownedModifiers.toArray()
}

export async function getOwnedModifierQuantity(modifierId: string): Promise<number> {
  const record = await db.ownedModifiers.where('modifierId').equals(modifierId).first()
  return record?.quantity ?? 0
}

export async function ownsModifier(modifierId: string): Promise<boolean> {
  const qty = await getOwnedModifierQuantity(modifierId)
  return qty > 0
}

export async function clearOwnedModifiers(): Promise<void> {
  await db.ownedModifiers.clear()
}

// ============================================
// STREAK HISTORY FUNCTIONS
// ============================================

export async function recordStreakBroken(
  streak: number,
  runsInStreak: number,
  totalGoldEarned: number,
  modifiersUsed: string[]
): Promise<number> {
  const record: Omit<StreakHistoryRecord, 'id'> = {
    streak,
    brokenAt: new Date(),
    runsInStreak,
    totalGoldEarned,
    modifiersUsed,
  }
  const id = await db.streakHistory.add(record)
  return id as number
}

export async function getStreakHistory(limit: number = 20): Promise<StreakHistoryRecord[]> {
  return db.streakHistory.orderBy('brokenAt').reverse().limit(limit).toArray()
}

export async function getBestStreak(): Promise<number> {
  const records = await db.streakHistory.toArray()
  if (records.length === 0) return 0
  return Math.max(...records.map(r => r.streak))
}

export async function clearStreakHistory(): Promise<void> {
  await db.streakHistory.clear()
}

// ============================================
// COLLECTION UNLOCK FUNCTIONS
// ============================================

export async function unlockCollectionCard(
  cardId: string,
  unlockSource: CollectionUnlockRecord['unlockSource'],
  unlockValue?: string
): Promise<number> {
  // Check if already unlocked
  const existing = await db.collectionUnlocks.where('cardId').equals(cardId).first()
  if (existing) {
    return existing.id!
  }

  const record: Omit<CollectionUnlockRecord, 'id'> = {
    cardId,
    unlockedAt: new Date(),
    unlockSource,
    unlockValue,
  }
  const id = await db.collectionUnlocks.add(record)
  return id as number
}

export async function isCollectionCardUnlocked(cardId: string): Promise<boolean> {
  const record = await db.collectionUnlocks.where('cardId').equals(cardId).first()
  return !!record
}

export async function getUnlockedCollectionCardIds(): Promise<string[]> {
  const records = await db.collectionUnlocks.toArray()
  return records.map((r) => r.cardId)
}

export async function getCollectionUnlocks(): Promise<CollectionUnlockRecord[]> {
  return db.collectionUnlocks.orderBy('unlockedAt').reverse().toArray()
}

export async function getCollectionUnlocksBySource(
  source: CollectionUnlockRecord['unlockSource']
): Promise<CollectionUnlockRecord[]> {
  return db.collectionUnlocks.where('unlockSource').equals(source).toArray()
}

export async function clearCollectionUnlocks(): Promise<void> {
  await db.collectionUnlocks.clear()
}

// ============================================
// CARRY SLOT FUNCTIONS
// ============================================

export async function setCarrySlot(
  slotIndex: 0 | 1 | 2,
  cardId: string,
  source: CarrySlotSource,
  isProtected: boolean = false
): Promise<number> {
  // Remove existing card in this slot if any
  await db.carrySlots.where('slotIndex').equals(slotIndex).delete()

  const record: Omit<CarrySlotRecord, 'id'> = {
    slotIndex,
    cardId,
    protected: isProtected,
    source,
    acquiredAt: new Date(),
  }
  const id = await db.carrySlots.add(record)
  return id as number
}

export async function getCarrySlot(slotIndex: 0 | 1 | 2): Promise<CarrySlotRecord | undefined> {
  return db.carrySlots.where('slotIndex').equals(slotIndex).first()
}

export async function getAllCarrySlots(): Promise<CarrySlotRecord[]> {
  return db.carrySlots.orderBy('slotIndex').toArray()
}

export async function clearCarrySlot(slotIndex: 0 | 1 | 2): Promise<boolean> {
  const existing = await db.carrySlots.where('slotIndex').equals(slotIndex).first()
  if (!existing) return false

  // Protected slots can't be cleared normally
  if (existing.protected) return false

  await db.carrySlots.where('slotIndex').equals(slotIndex).delete()
  return true
}

export async function forceCleanCarrySlot(slotIndex: 0 | 1 | 2): Promise<void> {
  // Force clear even protected slots (for admin/debug)
  await db.carrySlots.where('slotIndex').equals(slotIndex).delete()
}

export async function clearAllCarrySlots(): Promise<void> {
  await db.carrySlots.clear()
}

export async function clearUnprotectedCarrySlots(): Promise<void> {
  const slots = await db.carrySlots.toArray()
  for (const slot of slots) {
    if (!slot.protected) {
      await db.carrySlots.where('slotIndex').equals(slot.slotIndex).delete()
    }
  }
}

export async function getCarrySlotCardIds(): Promise<string[]> {
  const slots = await db.carrySlots.toArray()
  return slots.map((s) => s.cardId)
}
