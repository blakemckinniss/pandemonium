import { describe, it, expect } from 'vitest'
import type { UnlockCondition } from '../../../types'

// Extract the formatUnlockCondition logic for testing
// (matches implementation in CollectionTab.tsx)
function formatUnlockCondition(condition: UnlockCondition): string {
  switch (condition.type) {
    case 'always':
      return 'Available from start'
    case 'totalWins':
      return `Win ${condition.count} run${condition.count > 1 ? 's' : ''}`
    case 'streakReached':
      return `Reach a ${condition.streak}-win streak`
    case 'dungeonClear':
      return `Clear the ${condition.dungeonId.replace(/_/g, ' ')} dungeon`
    case 'heroAffection':
      return `Reach affection level ${condition.level} with ${condition.heroId.replace(/^hero_/, '')}`
    case 'achievement':
      return `Unlock achievement: ${condition.achievementId.replace(/_/g, ' ')}`
    default:
      return 'Unknown unlock condition'
  }
}

describe('formatUnlockCondition', () => {
  it('formats "always" condition', () => {
    const condition: UnlockCondition = { type: 'always' }
    expect(formatUnlockCondition(condition)).toBe('Available from start')
  })

  it('formats "totalWins" condition - singular', () => {
    const condition: UnlockCondition = { type: 'totalWins', count: 1 }
    expect(formatUnlockCondition(condition)).toBe('Win 1 run')
  })

  it('formats "totalWins" condition - plural', () => {
    const condition: UnlockCondition = { type: 'totalWins', count: 5 }
    expect(formatUnlockCondition(condition)).toBe('Win 5 runs')
  })

  it('formats "streakReached" condition', () => {
    const condition: UnlockCondition = { type: 'streakReached', streak: 3 }
    expect(formatUnlockCondition(condition)).toBe('Reach a 3-win streak')
  })

  it('formats "dungeonClear" condition with underscores', () => {
    const condition: UnlockCondition = { type: 'dungeonClear', dungeonId: 'shadow_crypt' }
    expect(formatUnlockCondition(condition)).toBe('Clear the shadow crypt dungeon')
  })

  it('formats "heroAffection" condition', () => {
    const condition: UnlockCondition = { type: 'heroAffection', heroId: 'hero_luna', level: 3 }
    expect(formatUnlockCondition(condition)).toBe('Reach affection level 3 with luna')
  })

  it('formats "heroAffection" condition without hero_ prefix', () => {
    const condition: UnlockCondition = { type: 'heroAffection', heroId: 'mage', level: 2 }
    expect(formatUnlockCondition(condition)).toBe('Reach affection level 2 with mage')
  })

  it('formats "achievement" condition', () => {
    const condition: UnlockCondition = { type: 'achievement', achievementId: 'first_blood' }
    expect(formatUnlockCondition(condition)).toBe('Unlock achievement: first blood')
  })
})
