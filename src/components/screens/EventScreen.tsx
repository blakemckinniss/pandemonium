import { useState } from 'react'
import type { RunState } from '../../types'
import type { EventDefinition, EventChoice, EventEffect } from '../../content/events'
import { getRandomEvent } from '../../content/events'

interface EventScreenProps {
  runState: RunState
  onChoiceSelected: (effects: EventEffect[]) => void
  onLeave: () => void
}

function checkCondition(choice: EventChoice, runState: RunState): boolean {
  if (!choice.condition) return true

  const { type, value, comparison = 'gte' } = choice.condition

  switch (type) {
    case 'hasGold': {
      const required = typeof value === 'number' ? value : parseInt(value, 10)
      if (comparison === 'gte') return runState.gold >= required
      if (comparison === 'lte') return runState.gold <= required
      return runState.gold === required
    }
    case 'hasHP': {
      const required = typeof value === 'number' ? value : parseInt(value, 10)
      const currentHP = runState.combat?.player.hp ?? runState.hero.hp
      if (comparison === 'gte') return currentHP >= required
      if (comparison === 'lte') return currentHP <= required
      return currentHP === required
    }
    case 'hasDeckSize': {
      const required = typeof value === 'number' ? value : parseInt(value, 10)
      if (comparison === 'gte') return runState.deck.length >= required
      if (comparison === 'lte') return runState.deck.length <= required
      return runState.deck.length === required
    }
    case 'hasRelic': {
      const relicId = typeof value === 'string' ? value : String(value)
      return runState.relics.some(r => r.definitionId === relicId)
    }
    default:
      return true
  }
}

export function EventScreen({ runState, onChoiceSelected, onLeave }: EventScreenProps) {
  const [event] = useState<EventDefinition | undefined>(() => getRandomEvent())
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [resolved, setResolved] = useState(false)
  const [resultText, setResultText] = useState<string>('')

  if (!event) {
    // No events available, just leave
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Nothing of interest here...</p>
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  const handleChoiceClick = (choice: EventChoice) => {
    if (resolved) return

    setSelectedChoice(choice.id)
    setResolved(true)

    // Generate result text based on effects
    const results: string[] = []
    for (const effect of choice.effects) {
      switch (effect.type) {
        case 'gainGold':
          results.push(`Gained ${effect.amount} gold`)
          break
        case 'loseGold':
          results.push(`Lost ${effect.amount} gold`)
          break
        case 'heal':
          results.push(`Healed ${effect.amount} HP`)
          break
        case 'damage':
          results.push(`Took ${effect.amount} damage`)
          break
        case 'gainMaxHP':
          results.push(`Gained ${effect.amount} Max HP`)
          break
        case 'loseMaxHP':
          results.push(`Lost ${effect.amount} Max HP`)
          break
        case 'addCard':
          results.push(`Added a card to your deck`)
          break
        case 'removeRandomCard':
          results.push(`A card was removed from your deck`)
          break
        case 'upgradeRandomCard':
          results.push(`A card was upgraded`)
          break
        case 'addRelic':
          results.push(`Obtained a relic`)
          break
        case 'addRandomRelic':
          results.push(`Obtained a ${effect.rarity ?? 'random'} relic`)
          break
        case 'addCurse':
          results.push(`A curse was added to your deck`)
          break
        case 'gainStrength':
          results.push(`Gained ${effect.amount} permanent Strength`)
          break
        case 'gainDexterity':
          results.push(`Gained ${effect.amount} permanent Dexterity`)
          break
      }
    }

    if (results.length === 0) {
      setResultText('You leave without incident.')
    } else {
      setResultText(results.join('. ') + '.')
    }

    // Apply effects
    onChoiceSelected(choice.effects)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Event Card */}
        <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl">
          {/* Event Image */}
          {event.image && (
            <div className="h-64 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Content */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-indigo-300 mb-4 drop-shadow-lg">
              {event.title}
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 italic">
              "{event.description}"
            </p>

            {/* Result Display */}
            {resolved && resultText && (
              <div className="mb-8 p-4 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                <p className="text-indigo-200 text-center font-medium">
                  {resultText}
                </p>
              </div>
            )}

            {/* Choices */}
            <div className="space-y-4">
              {event.choices.map(choice => {
                const meetsCondition = checkCondition(choice, runState)
                const isSelected = selectedChoice === choice.id
                const isDisabled = resolved || !meetsCondition

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceClick(choice)}
                    disabled={isDisabled}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                      ${isSelected
                        ? 'border-indigo-400 bg-indigo-900/50 scale-[1.02]'
                        : isDisabled
                          ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                          : 'border-slate-600 bg-slate-800/80 hover:border-indigo-500 hover:bg-slate-700/80 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                          {choice.text}
                        </h3>
                        <p className={`text-sm mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {choice.description}
                        </p>
                      </div>
                      {!meetsCondition && choice.condition && (
                        <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded ml-2 shrink-0">
                          {choice.condition.type === 'hasGold' && `Need ${choice.condition.value} gold`}
                          {choice.condition.type === 'hasHP' && `Need ${choice.condition.value} HP`}
                          {choice.condition.type === 'hasDeckSize' && `Need ${choice.condition.value}+ cards`}
                          {choice.condition.type === 'hasRelic' && `Missing required relic`}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Continue Button (after choice made) */}
            {resolved && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={onLeave}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  Continue Your Journey
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Player Stats Bar */}
        <div className="mt-6 flex justify-center gap-6">
          <div className="bg-slate-800/80 rounded-lg px-4 py-2 border border-slate-600">
            <span className="text-red-400">❤️ {runState.hero.hp}/{runState.hero.maxHp}</span>
          </div>
          <div className="bg-slate-800/80 rounded-lg px-4 py-2 border border-slate-600">
            <span className="text-amber-400">💰 {runState.gold}</span>
          </div>
          <div className="bg-slate-800/80 rounded-lg px-4 py-2 border border-slate-600">
            <span className="text-purple-400">🃏 {runState.deck.length} cards</span>
          </div>
        </div>
      </div>
    </div>
  )
}
