import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  StreakState,
  HeatState,
  OwnedModifier,
  ModifierDefinition,
  HeroAffection,
} from '../types'
import {
  createDefaultAffection,
  getAffectionLevel,
  calculateAffectionGain,
} from '../types'
import {
  DEFAULT_STREAK_STATE,
  DEFAULT_HEAT_STATE,
} from '../types'
import {
  incrementStreak,
  breakStreak,
} from '../game/streak'

interface RunResult {
  won: boolean
  floor: number
  gold: number
  enemiesKilled: number
  heroId: string
}

interface MetaState {
  // Unlocks (cards now tracked in IndexedDB via collectionUnlocks)
  unlockedHeroes: string[]

  // Stats
  totalRuns: number
  totalWins: number
  totalDeaths: number
  highestFloor: number
  totalGoldEarned: number
  totalEnemiesKilled: number

  // Economy
  gold: number

  // Dungeon Deck State
  streak: StreakState
  heat: HeatState
  ownedModifiers: OwnedModifier[]

  // Modifier Definitions (AI-generated, cached)
  modifierDefinitions: ModifierDefinition[]

  // Affection & Outfits
  heroAffection: Record<string, HeroAffection>
  unlockedOutfits: Record<string, string[]>
  equippedOutfits: Record<string, string>

  // Actions - Unlocks (cards now tracked in IndexedDB via collectionUnlocks)
  unlockHero: (heroId: string) => void
  recordRun: (result: RunResult) => void
  isHeroUnlocked: (heroId: string) => boolean

  // Actions - Economy
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  canAfford: (amount: number) => boolean

  // Actions - Streak
  incrementStreak: () => void
  breakStreak: () => void

  // Actions - Heat
  setHeat: (heat: number) => void
  addHeat: (amount: number) => void
  resetHeat: () => void

  // Actions - Modifiers
  addModifier: (modifier: OwnedModifier) => void
  consumeModifier: (definitionId: string) => boolean
  hasModifier: (definitionId: string) => boolean
  getModifierQuantity: (definitionId: string) => number

  // Actions - Modifier Definitions
  addModifierDefinition: (definition: ModifierDefinition) => void
  getModifierDefinition: (id: string) => ModifierDefinition | undefined

  // Actions - Affection
  addAffection: (heroId: string, points: number) => void
  recordHeroRun: (heroId: string, won: boolean, floorsCleared: number, enemiesKilled: number) => void
  getHeroAffection: (heroId: string) => HeroAffection

  // Actions - Outfits
  unlockOutfit: (heroId: string, outfitId: string) => void
  equipOutfit: (heroId: string, outfitId: string) => void
  isOutfitUnlocked: (heroId: string, outfitId: string) => boolean
  getEquippedOutfit: (heroId: string) => string

  // Reset
  reset: () => void
}

// Default unlocks - starter content (cards now tracked in IndexedDB)
const DEFAULT_HEROES = ['warrior']

const initialState = {
  unlockedHeroes: DEFAULT_HEROES,
  totalRuns: 0,
  totalWins: 0,
  totalDeaths: 0,
  highestFloor: 0,
  totalGoldEarned: 0,
  totalEnemiesKilled: 0,
  // Economy
  gold: 100, // Starting gold
  // Dungeon Deck
  streak: { ...DEFAULT_STREAK_STATE },
  heat: { ...DEFAULT_HEAT_STATE },
  ownedModifiers: [] as OwnedModifier[],
  modifierDefinitions: [] as ModifierDefinition[],
  // Affection & Outfits
  heroAffection: {} as Record<string, HeroAffection>,
  unlockedOutfits: {
    sakura: ['default'],
    luna: ['default'],
    aria: ['default'],
  } as Record<string, string[]>,
  equippedOutfits: {
    sakura: 'default',
    luna: 'default',
    aria: 'default',
  } as Record<string, string>,
}

export const useMetaStore = create<MetaState>()(
  persist(
    (set, get) => ({
      ...initialState,

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

      isHeroUnlocked: (heroId) => get().unlockedHeroes.includes(heroId),

      // Economy Actions
      addGold: (amount) =>
        set((state) => ({
          gold: state.gold + amount,
        })),

      spendGold: (amount) => {
        const state = get()
        if (state.gold < amount) return false
        set({ gold: state.gold - amount })
        return true
      },

      canAfford: (amount) => get().gold >= amount,

      // Streak Actions
      incrementStreak: () =>
        set((state) => ({
          streak: incrementStreak(state.streak),
        })),

      breakStreak: () =>
        set((state) => ({
          streak: breakStreak(state.streak),
        })),

      // Heat Actions
      setHeat: (heat) =>
        set((state) => ({
          heat: {
            ...state.heat,
            current: Math.max(0, Math.min(100, heat)),
            maxReached: Math.max(state.heat.maxReached, heat),
          },
        })),

      addHeat: (amount) =>
        set((state) => {
          const newHeat = Math.max(0, Math.min(100, state.heat.current + amount))
          return {
            heat: {
              ...state.heat,
              current: newHeat,
              maxReached: Math.max(state.heat.maxReached, newHeat),
            },
          }
        }),

      resetHeat: () =>
        set({
          heat: { ...DEFAULT_HEAT_STATE },
        }),

      // Modifier Actions
      addModifier: (modifier) =>
        set((state) => {
          const existing = state.ownedModifiers.find(
            (m) => m.definitionId === modifier.definitionId
          )
          if (existing) {
            return {
              ownedModifiers: state.ownedModifiers.map((m) =>
                m.definitionId === modifier.definitionId
                  ? { ...m, quantity: m.quantity + modifier.quantity }
                  : m
              ),
            }
          }
          return {
            ownedModifiers: [...state.ownedModifiers, modifier],
          }
        }),

      consumeModifier: (definitionId) => {
        const state = get()
        const modifier = state.ownedModifiers.find(
          (m) => m.definitionId === definitionId
        )
        if (!modifier || modifier.quantity <= 0) return false

        set({
          ownedModifiers: state.ownedModifiers
            .map((m) =>
              m.definitionId === definitionId
                ? { ...m, quantity: m.quantity - 1 }
                : m
            )
            .filter((m) => m.quantity > 0),
        })
        return true
      },

      hasModifier: (definitionId) => {
        const modifier = get().ownedModifiers.find(
          (m) => m.definitionId === definitionId
        )
        return modifier ? modifier.quantity > 0 : false
      },

      getModifierQuantity: (definitionId) => {
        const modifier = get().ownedModifiers.find(
          (m) => m.definitionId === definitionId
        )
        return modifier?.quantity ?? 0
      },

      // Modifier Definition Actions
      addModifierDefinition: (definition) =>
        set((state) => {
          const exists = state.modifierDefinitions.some(
            (d) => d.id === definition.id
          )
          if (exists) return state
          return {
            modifierDefinitions: [...state.modifierDefinitions, definition],
          }
        }),

      getModifierDefinition: (id) =>
        get().modifierDefinitions.find((d) => d.id === id),

      // Affection Actions
      addAffection: (heroId, points) =>
        set((state) => {
          const current = state.heroAffection[heroId] ?? createDefaultAffection(heroId)
          const newPoints = current.points + points
          return {
            heroAffection: {
              ...state.heroAffection,
              [heroId]: {
                ...current,
                points: newPoints,
                level: getAffectionLevel(newPoints),
              },
            },
          }
        }),

      recordHeroRun: (heroId, won, floorsCleared, enemiesKilled) =>
        set((state) => {
          const current = state.heroAffection[heroId] ?? createDefaultAffection(heroId)
          const affectionGain = calculateAffectionGain({ won, floorsCleared, enemiesKilled })
          const newPoints = current.points + affectionGain
          return {
            heroAffection: {
              ...state.heroAffection,
              [heroId]: {
                ...current,
                points: newPoints,
                level: getAffectionLevel(newPoints),
                runsCompleted: current.runsCompleted + 1,
                winsWithHero: won ? current.winsWithHero + 1 : current.winsWithHero,
              },
            },
          }
        }),

      getHeroAffection: (heroId) => {
        const state = get()
        return state.heroAffection[heroId] ?? createDefaultAffection(heroId)
      },

      // Outfit Actions
      unlockOutfit: (heroId, outfitId) =>
        set((state) => {
          const current = state.unlockedOutfits[heroId] ?? ['default']
          if (current.includes(outfitId)) return state
          return {
            unlockedOutfits: {
              ...state.unlockedOutfits,
              [heroId]: [...current, outfitId],
            },
          }
        }),

      equipOutfit: (heroId, outfitId) =>
        set((state) => {
          const unlocked = state.unlockedOutfits[heroId] ?? ['default']
          if (!unlocked.includes(outfitId)) return state
          return {
            equippedOutfits: {
              ...state.equippedOutfits,
              [heroId]: outfitId,
            },
          }
        }),

      isOutfitUnlocked: (heroId, outfitId) => {
        const unlocked = get().unlockedOutfits[heroId] ?? ['default']
        return unlocked.includes(outfitId)
      },

      getEquippedOutfit: (heroId) => {
        return get().equippedOutfits[heroId] ?? 'default'
      },

      reset: () => set(initialState),
    }),
    {
      name: 'pandemonium-meta',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Unlock conditions - check after each run
// All cards are now AI-generated, so only hero unlocks matter
export async function checkUnlocks(result: RunResult, store: MetaState): Promise<string[]> {
  const newUnlocks: string[] = []

  // Win first run → unlock second hero
  if (result.won && store.totalWins === 0) {
    store.unlockHero('mage')
    newUnlocks.push('Hero: Mage')
  }

  return newUnlocks
}
