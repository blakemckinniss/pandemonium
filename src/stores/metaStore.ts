import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface MetaState {
  // Unlocks
  unlockedCards: string[]
  unlockedHeroes: string[]

  // Stats
  totalRuns: number
  totalWins: number
  totalDeaths: number
  highestFloor: number
  totalGoldEarned: number
  totalEnemiesKilled: number

  // Actions
  unlockCard: (cardId: string) => void
  unlockHero: (heroId: string) => void
  recordRun: (result: RunResult) => void
  isCardUnlocked: (cardId: string) => boolean
  isHeroUnlocked: (heroId: string) => boolean
  reset: () => void
}

interface RunResult {
  won: boolean
  floor: number
  gold: number
  enemiesKilled: number
  heroId: string
}

// Default unlocks - starter content
const DEFAULT_CARDS = ['strike', 'defend', 'bash', 'cleave', 'pommel_strike', 'shrug_it_off']
const DEFAULT_HEROES = ['warrior']

const initialState = {
  unlockedCards: DEFAULT_CARDS,
  unlockedHeroes: DEFAULT_HEROES,
  totalRuns: 0,
  totalWins: 0,
  totalDeaths: 0,
  highestFloor: 0,
  totalGoldEarned: 0,
  totalEnemiesKilled: 0,
}

export const useMetaStore = create<MetaState>()(
  persist(
    (set, get) => ({
      ...initialState,

      unlockCard: (cardId) =>
        set((state) => ({
          unlockedCards: state.unlockedCards.includes(cardId)
            ? state.unlockedCards
            : [...state.unlockedCards, cardId],
        })),

      unlockHero: (heroId) =>
        set((state) => ({
          unlockedHeroes: state.unlockedHeroes.includes(heroId)
            ? state.unlockedHeroes
            : [...state.unlockedHeroes, heroId],
        })),

      recordRun: (result) =>
        set((state) => ({
          totalRuns: state.totalRuns + 1,
          totalWins: result.won ? state.totalWins + 1 : state.totalWins,
          totalDeaths: result.won ? state.totalDeaths : state.totalDeaths + 1,
          highestFloor: Math.max(state.highestFloor, result.floor),
          totalGoldEarned: state.totalGoldEarned + result.gold,
          totalEnemiesKilled: state.totalEnemiesKilled + result.enemiesKilled,
        })),

      isCardUnlocked: (cardId) => get().unlockedCards.includes(cardId),

      isHeroUnlocked: (heroId) => get().unlockedHeroes.includes(heroId),

      reset: () => set(initialState),
    }),
    {
      name: 'pandemonium-meta',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Unlock conditions - check after each run
export function checkUnlocks(result: RunResult, store: MetaState): string[] {
  const newUnlocks: string[] = []

  // Win first run → unlock second hero
  if (result.won && store.totalWins === 0) {
    store.unlockHero('mage')
    newUnlocks.push('Hero: Mage')
  }

  // Reach floor 5 → unlock Whirlwind
  if (result.floor >= 5 && !store.isCardUnlocked('whirlwind')) {
    store.unlockCard('whirlwind')
    newUnlocks.push('Card: Whirlwind')
  }

  // Kill 50 enemies → unlock Heavy Blade
  if (
    store.totalEnemiesKilled + result.enemiesKilled >= 50 &&
    !store.isCardUnlocked('heavy_blade')
  ) {
    store.unlockCard('heavy_blade')
    newUnlocks.push('Card: Heavy Blade')
  }

  // 10 total runs → unlock Armaments
  if (store.totalRuns + 1 >= 10 && !store.isCardUnlocked('armaments')) {
    store.unlockCard('armaments')
    newUnlocks.push('Card: Armaments')
  }

  return newUnlocks
}
