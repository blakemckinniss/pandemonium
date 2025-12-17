// ============================================
// HELPER FUNCTIONS
// ============================================

import type { AtomicEffect } from '../../types'

export function generateDescription(effects: AtomicEffect[]): string {
  return effects
    .map((e) => {
      // Helper to get numeric value from EffectValue
      const getAmount = (val: unknown): number | string => {
        if (typeof val === 'number') return val
        if (typeof val === 'object' && val && 'value' in val) return (val as { value: number }).value
        return 'X'
      }

      switch (e.type) {
        case 'damage':
          return `Deal ${getAmount(e.amount)} damage.`
        case 'block':
          return `Gain ${getAmount(e.amount)} Block.`
        case 'heal':
          return `Heal ${getAmount(e.amount)} HP.`
        case 'draw':
          return `Draw ${getAmount(e.amount)} card(s).`
        case 'applyPower':
          return `Apply ${getAmount(e.amount)} ${e.powerId}.`
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join(' ')
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function rarityToNum(rarity: string): number {
  return { common: 1, uncommon: 2, rare: 3 }[rarity] ?? 1
}

export function themeToNum(theme: string): number {
  return { attack: 1, skill: 2, power: 3 }[theme] ?? 1
}
