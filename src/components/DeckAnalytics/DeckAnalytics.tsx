import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import { getCardDefinition } from '../../game/cards'
import type { CardDefinition, Element } from '../../types'

interface DeckAnalyticsProps {
  cardIds: string[]
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

interface DeckStats {
  totalCards: number
  avgEnergy: number
  energyCurve: Record<number, number> // cost -> count
  themeDistribution: Record<string, number>
  elementDistribution: Record<string, number>
}

const THEME_COLORS: Record<string, string> = {
  attack: '#ef4444', // red
  skill: '#3b82f6', // blue
  power: '#a855f7', // purple
  curse: '#6b7280', // gray
  status: '#f59e0b', // amber
}

const THEME_ICONS: Record<string, string> = {
  attack: 'mdi:sword',
  skill: 'mdi:shield',
  power: 'mdi:lightning-bolt',
  curse: 'mdi:skull',
  status: 'mdi:alert-circle',
}

const ELEMENT_COLORS: Record<string, string> = {
  physical: '#9ca3af', // gray
  fire: '#f97316', // orange
  ice: '#06b6d4', // cyan
  lightning: '#eab308', // yellow
  void: '#8b5cf6', // violet
}

const ELEMENT_ICONS: Record<string, string> = {
  physical: 'mdi:sword-cross',
  fire: 'mdi:fire',
  ice: 'mdi:snowflake',
  lightning: 'mdi:flash',
  void: 'mdi:circle-off-outline',
}

function calculateStats(cardIds: string[]): DeckStats {
  const cards = cardIds
    .map((id) => getCardDefinition(id))
    .filter((c): c is CardDefinition => c !== null)

  const energyCurve: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const themeDistribution: Record<string, number> = {}
  const elementDistribution: Record<string, number> = {}

  let totalEnergy = 0

  for (const card of cards) {
    // Energy curve (bucket 5+ together)
    // Handle energy as number (EffectValue objects resolved by getEnergyCost in Card)
    const energyCost = typeof card.energy === 'number' ? card.energy : 0
    const costBucket = Math.min(energyCost, 5)
    energyCurve[costBucket] = (energyCurve[costBucket] || 0) + 1
    totalEnergy += energyCost

    // Theme distribution (only count playable themes)
    if (['attack', 'skill', 'power'].includes(card.theme)) {
      themeDistribution[card.theme] = (themeDistribution[card.theme] || 0) + 1
    }

    // Element distribution
    if (card.element) {
      elementDistribution[card.element] = (elementDistribution[card.element] || 0) + 1
    }
  }

  return {
    totalCards: cards.length,
    avgEnergy: cards.length > 0 ? totalEnergy / cards.length : 0,
    energyCurve,
    themeDistribution,
    elementDistribution,
  }
}

export function DeckAnalytics({ cardIds, collapsed = false, onToggleCollapsed }: DeckAnalyticsProps) {
  const stats = useMemo(() => calculateStats(cardIds), [cardIds])

  if (cardIds.length === 0) {
    return null
  }

  const maxEnergyCurve = Math.max(...Object.values(stats.energyCurve), 1)

  return (
    <div className="DeckAnalytics border-t border-border pt-3 relative">
      {/* Top ornamental line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-filigree/20 to-transparent" />

      {/* Header */}
      <button
        onClick={onToggleCollapsed}
        className="w-full flex items-center justify-between text-xs font-display tracking-widest text-warm-500 mb-3 hover:text-warm-300 transition-colors group"
      >
        <span className="flex items-center gap-2">
          <Icon icon="mdi:chart-bar" className="text-filigree/60 group-hover:text-filigree transition-colors" />
          Deck Analytics
        </span>
        <Icon
          icon={collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}
          className="text-base text-filigree/40"
        />
      </button>

      {!collapsed && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="flex items-center justify-between text-xs font-ui p-2 bg-surface-alt/30 rounded border border-border/50">
            <span className="text-warm-500 font-display tracking-wide">Avg Cost</span>
            <span className="text-energy font-bold">
              {stats.avgEnergy.toFixed(1)} <Icon icon="mdi:lightning-bolt" className="inline text-xs" />
            </span>
          </div>

          {/* Energy Curve */}
          <div>
            <div className="text-xs text-warm-500 mb-2 font-display tracking-wide flex items-center gap-2">
              <span className="w-3 h-px bg-filigree/30" />
              Energy Curve
            </div>
            <div className="flex items-end gap-1 h-12 p-2 bg-surface-alt/20 rounded border border-border/30">
              {[0, 1, 2, 3, 4, 5].map((cost) => {
                const count = stats.energyCurve[cost] || 0
                const height = maxEnergyCurve > 0 ? (count / maxEnergyCurve) * 100 : 0
                return (
                  <div key={cost} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-energy/60 to-energy/90 rounded-t transition-all duration-200 border-t border-x border-energy/30"
                      style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      title={`${cost === 5 ? '5+' : cost} cost: ${count} cards`}
                    />
                    <span className="text-[10px] text-warm-500 mt-1 font-ui">
                      {cost === 5 ? '5+' : cost}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Count labels */}
            <div className="flex gap-1 mt-0.5 px-2">
              {[0, 1, 2, 3, 4, 5].map((cost) => (
                <div key={cost} className="flex-1 text-center">
                  <span className="text-[9px] text-warm-600 font-ui">
                    {stats.energyCurve[cost] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Distribution */}
          {Object.keys(stats.themeDistribution).length > 0 && (
            <div>
              <div className="text-xs text-warm-500 mb-2 font-display tracking-wide flex items-center gap-2">
                <span className="w-3 h-px bg-filigree/30" />
                Card Types
              </div>
              <div className="space-y-1.5">
                {(['attack', 'skill', 'power'] as const).map((theme) => {
                  const count = stats.themeDistribution[theme] || 0
                  if (count === 0) return null
                  const pct = (count / stats.totalCards) * 100
                  return (
                    <div key={theme} className="flex items-center gap-2">
                      <Icon
                        icon={THEME_ICONS[theme]}
                        className="text-sm"
                        style={{ color: THEME_COLORS[theme] }}
                      />
                      <div className="flex-1 h-2 bg-surface-alt rounded overflow-hidden border border-border/30">
                        <div
                          className="h-full rounded transition-all duration-200"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${THEME_COLORS[theme]}cc, ${THEME_COLORS[theme]})`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-warm-400 w-8 text-right font-ui font-medium">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Element Distribution */}
          {Object.keys(stats.elementDistribution).length > 0 && (
            <div>
              <div className="text-xs text-warm-500 mb-2 font-display tracking-wide flex items-center gap-2">
                <span className="w-3 h-px bg-filigree/30" />
                Elements
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(stats.elementDistribution) as [Element, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([element, count]) => (
                    <div
                      key={element}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs border font-ui"
                      style={{
                        backgroundColor: `${ELEMENT_COLORS[element]}15`,
                        borderColor: `${ELEMENT_COLORS[element]}40`,
                        color: ELEMENT_COLORS[element],
                      }}
                    >
                      <Icon icon={ELEMENT_ICONS[element]} className="text-sm" />
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Synergy Hints */}
          <SynergyHints cardIds={cardIds} />
        </div>
      )}
    </div>
  )
}

// Simple synergy detection
function SynergyHints({ cardIds }: { cardIds: string[] }) {
  const synergies = useMemo(() => {
    const cards = cardIds
      .map((id) => getCardDefinition(id))
      .filter((c): c is CardDefinition => c !== null)

    const hints: { icon: string; text: string; color: string }[] = []

    // Count elements
    const elementCounts: Record<string, number> = {}
    const themeCounts: Record<string, number> = {}

    for (const card of cards) {
      if (card.element) {
        elementCounts[card.element] = (elementCounts[card.element] || 0) + 1
      }
      themeCounts[card.theme] = (themeCounts[card.theme] || 0) + 1
    }

    // Elemental focus (3+ of same element)
    for (const [element, count] of Object.entries(elementCounts)) {
      if (count >= 3) {
        hints.push({
          icon: ELEMENT_ICONS[element],
          text: `${element.charAt(0).toUpperCase() + element.slice(1)} focus (${count})`,
          color: ELEMENT_COLORS[element],
        })
      }
    }

    // Theme synergies
    const attacks = themeCounts['attack'] || 0
    const skills = themeCounts['skill'] || 0
    const powers = themeCounts['power'] || 0

    if (attacks >= 5 && attacks > skills + powers) {
      hints.push({
        icon: 'mdi:sword-cross',
        text: 'Aggro deck - heavy attack focus',
        color: '#ef4444',
      })
    }

    if (skills >= 5 && skills > attacks) {
      hints.push({
        icon: 'mdi:shield-check',
        text: 'Defensive deck - skill heavy',
        color: '#3b82f6',
      })
    }

    if (powers >= 3) {
      hints.push({
        icon: 'mdi:lightning-bolt-circle',
        text: 'Power build - sustained buffs',
        color: '#a855f7',
      })
    }

    // Combo potential (fire + ice)
    if ((elementCounts['fire'] || 0) >= 2 && (elementCounts['ice'] || 0) >= 2) {
      hints.push({
        icon: 'mdi:weather-partly-snowy-rainy',
        text: 'Steam combo potential',
        color: '#06b6d4',
      })
    }

    // Lightning + wet combo potential
    if ((elementCounts['lightning'] || 0) >= 2) {
      hints.push({
        icon: 'mdi:flash-alert',
        text: 'Electrocute combo ready',
        color: '#eab308',
      })
    }

    return hints
  }, [cardIds])

  if (synergies.length === 0) {
    return null
  }

  return (
    <div>
      <div className="text-xs text-warm-500 mb-2 font-display tracking-wide flex items-center gap-2">
        <span className="w-3 h-px bg-filigree/30" />
        Synergies
      </div>
      <div className="space-y-1.5">
        {synergies.map((synergy, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded border font-ui"
            style={{
              backgroundColor: `${synergy.color}12`,
              borderColor: `${synergy.color}30`,
              color: synergy.color,
            }}
          >
            <Icon icon={synergy.icon} className="text-sm" />
            <span className="font-medium">{synergy.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeckAnalytics
