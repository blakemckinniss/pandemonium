import Dexie, { type EntityTable } from 'dexie'

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
// DATABASE
// ============================================

class PandemoniumDB extends Dexie {
  runs!: EntityTable<RunRecord, 'id'>

  constructor() {
    super('PandemoniumDB')

    this.version(1).stores({
      runs: '++id, startedAt, heroId, won, floor',
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
