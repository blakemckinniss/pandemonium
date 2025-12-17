// ============================================
// META STATE (persisted across runs)
// ============================================

export interface MetaState {
  unlockedCards: string[]
  unlockedHeroes: string[]
  totalRuns: number
  totalWins: number
  highestFloor: number
}
