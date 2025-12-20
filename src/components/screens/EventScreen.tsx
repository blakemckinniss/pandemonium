import { useState, useEffect, useRef } from 'react'
import type { RunState } from '../../types'
import type { EventDefinition, EventChoice, EventEffect } from '../../content/events'
import { getRandomEvent } from '../../content/events'
import { gsap } from '../../lib/animations'

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
      const currentHP = runState.combat?.player.currentHealth ?? runState.hero.currentHealth
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [event] = useState<EventDefinition | undefined>(() => getRandomEvent())
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [resolved, setResolved] = useState(false)
  const [resultText, setResultText] = useState<string>('')

  // GSAP entrance animation
  useEffect(() => {
    if (!containerRef.current || !event) return

    const ctx = gsap.context(() => {
      // Animate event card
      gsap.from('.event-card', {
        y: 60,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.2)',
      })

      // Animate choices with stagger
      gsap.from('.event-choice', {
        x: -40,
        opacity: 0,
        duration: 0.4,
        stagger: 0.12,
        ease: 'power2.out',
        delay: 0.3,
      })

      // Animate stats bar
      gsap.from('.event-stats', {
        y: 20,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        delay: 0.5,
      })
    }, containerRef)

    return () => ctx.revert()
  }, [event])

  if (!event) {
    // No events available, just leave
    return (
      <div className="min-h-screen bg-gradient-to-b from-void-950 via-void-900 to-void-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-400 mb-4">Nothing of interest here...</p>
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-surface hover:bg-surface-alt text-warm-100 rounded-lg transition-colors"
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
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-void-950 via-void-900 to-void-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Event Card */}
        <div className="event-card bg-surface rounded-2xl border border-warm-700/30 overflow-hidden shadow-2xl">
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
            <h1 className="text-4xl font-display font-bold text-warm-200 mb-4 drop-shadow-lg">
              {event.title}
            </h1>
            <p className="text-lg font-prose text-warm-300/80 leading-relaxed mb-8 italic">
              "{event.description}"
            </p>

            {/* Result Display */}
            {resolved && resultText && (
              <div className="mb-8 p-4 bg-energy-900/30 rounded-lg border border-energy-500/30">
                <p className="text-energy-200 text-center font-medium">
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
                      event-choice w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                      ${isSelected
                        ? 'border-energy-400 bg-energy-900/50 scale-[1.02]'
                        : isDisabled
                          ? 'border-warm-800 bg-surface/50 opacity-50 cursor-not-allowed'
                          : 'border-warm-700 bg-surface-alt hover:border-energy-500 hover:bg-surface cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${isSelected ? 'text-energy-300' : 'text-warm-100'}`}>
                          {choice.text}
                        </h3>
                        <p className={`text-sm font-prose mt-1 ${isSelected ? 'text-energy-200' : 'text-warm-400'}`}>
                          {choice.description}
                        </p>
                      </div>
                      {!meetsCondition && choice.condition && (
                        <span className="text-xs text-damage bg-damage/20 px-2 py-1 rounded ml-2 shrink-0">
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
                  className="px-8 py-3 bg-energy-600 hover:bg-energy-500 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  Continue Your Journey
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Player Stats Bar */}
        <div className="event-stats mt-6 flex justify-center gap-6">
          <div className="bg-surface rounded-lg px-4 py-2 border border-warm-700">
            <span className="text-damage">❤️ {runState.hero.currentHealth}/{runState.hero.maxHealth}</span>
          </div>
          <div className="bg-surface rounded-lg px-4 py-2 border border-warm-700">
            <span className="text-warm-300">💰 {runState.gold}</span>
          </div>
          <div className="bg-surface rounded-lg px-4 py-2 border border-warm-700">
            <span className="text-energy-400">🃏 {runState.deck.length} cards</span>
          </div>
        </div>
      </div>
    </div>
  )
}
