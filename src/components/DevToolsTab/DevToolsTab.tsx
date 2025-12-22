import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { CardDefinition, CardTheme, Element, Rarity, AtomicEffect } from '../../types'
import { generateUid } from '../../lib/utils'
import { Card } from '../Card/Card'
import { getCardDefProps } from '../Card/utils'

type DevTool = 'card-generator' | 'effect-tester' | 'debug-info'

interface CardFormData {
  name: string
  energy: number
  theme: CardTheme
  element: Element | ''
  rarity: Rarity
  description: string
  effectsJson: string
}

const INITIAL_FORM: CardFormData = {
  name: 'Test Card',
  energy: 1,
  theme: 'attack',
  element: 'physical',
  rarity: 'common',
  description: 'Deal 6 damage.',
  effectsJson: '[{"type": "damage", "amount": 6}]',
}

const EFFECT_PRESETS: Record<string, AtomicEffect[]> = {
  'damage-6': [{ type: 'damage', amount: 6 }],
  'damage-12': [{ type: 'damage', amount: 12 }],
  'block-5': [{ type: 'block', amount: 5 }],
  'block-8': [{ type: 'block', amount: 8 }],
  'damage-block': [{ type: 'damage', amount: 6 }, { type: 'block', amount: 4 }],
  'draw-2': [{ type: 'draw', amount: 2 }],
  'aoe-4': [{ type: 'damage', amount: 4, target: 'all_enemies' }],
  'poison-3': [{ type: 'applyPower', powerId: 'poison', stacks: 3 }],
  'strength-2': [{ type: 'applyPower', powerId: 'strength', stacks: 2, target: 'self' }],
  'vulnerable-2': [{ type: 'applyPower', powerId: 'vulnerable', stacks: 2 }],
}

interface DevToolsTabProps {
  onTestCard?: (card: CardDefinition) => void
}

export function DevToolsTab({ onTestCard }: DevToolsTabProps) {
  const [activeTool, setActiveTool] = useState<DevTool>('card-generator')
  const [form, setForm] = useState<CardFormData>(INITIAL_FORM)
  const [generatedCard, setGeneratedCard] = useState<CardDefinition | null>(null)
  const [isGeneratingArt, setIsGeneratingArt] = useState(false)
  const [artError, setArtError] = useState<string | null>(null)
  const [effectsError, setEffectsError] = useState<string | null>(null)

  // Parse and validate effects JSON
  const parseEffects = (json: string): AtomicEffect[] | null => {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) {
        setEffectsError('Effects must be an array')
        return null
      }
      setEffectsError(null)
      return parsed as AtomicEffect[]
    } catch {
      setEffectsError('Invalid JSON')
      return null
    }
  }

  // Generate card from form
  const handleGenerateCard = () => {
    const effects = parseEffects(form.effectsJson)
    if (!effects) return

    const card: CardDefinition = {
      id: `dev_${generateUid()}`,
      name: form.name,
      energy: form.energy,
      theme: form.theme,
      rarity: form.rarity,
      description: form.description,
      target: form.theme === 'power' ? 'none' : 'enemy',
      effects,
      ...(form.element && { element: form.element as Element }),
    }

    setGeneratedCard(card)
  }

  // Generate AI art for the card
  const handleGenerateArt = async () => {
    if (!generatedCard) return

    setIsGeneratingArt(true)
    setArtError(null)

    try {
      const response = await fetch('http://localhost:8420/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: generatedCard.id,
          name: generatedCard.name,
          description: generatedCard.description,
          theme: generatedCard.theme,
          element: generatedCard.element || 'physical',
          rarity: generatedCard.rarity,
        }),
      })

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`)
      }

      const result = await response.json()

      // Update card with generated image path
      setGeneratedCard(prev => prev ? {
        ...prev,
        image: result.path.replace(/^.*\/public/, ''),
      } : null)
    } catch (err) {
      setArtError(err instanceof Error ? err.message : 'Failed to generate art')
    } finally {
      setIsGeneratingArt(false)
    }
  }

  // Apply effect preset
  const applyPreset = (presetId: string) => {
    const effects = EFFECT_PRESETS[presetId]
    if (effects) {
      setForm(prev => ({
        ...prev,
        effectsJson: JSON.stringify(effects, null, 2),
      }))
    }
  }

  const tools: { id: DevTool; icon: string; label: string }[] = [
    { id: 'card-generator', icon: 'mdi:card-plus', label: 'Card Generator' },
    { id: 'effect-tester', icon: 'mdi:flask', label: 'Effect Tester' },
    { id: 'debug-info', icon: 'mdi:bug', label: 'Debug Info' },
  ]

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Tool Sidebar */}
      <div className="w-48 bg-black/40 border-r border-amber-900/30 p-2 flex flex-col gap-1">
        <div className="text-xs uppercase tracking-wider text-amber-500/60 px-2 py-1 mb-2">
          Dev Tools
        </div>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
              activeTool === tool.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <Icon icon={tool.icon} className="w-4 h-4" />
            {tool.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTool === 'card-generator' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Icon icon="mdi:card-plus" />
              Card Generator
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Card Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                {/* Energy + Theme + Rarity row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Energy</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={form.energy}
                      onChange={e => setForm(prev => ({ ...prev, energy: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Theme</label>
                    <select
                      value={form.theme}
                      onChange={e => setForm(prev => ({ ...prev, theme: e.target.value as CardTheme }))}
                      className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                    >
                      <option value="attack">Attack</option>
                      <option value="skill">Skill</option>
                      <option value="power">Power</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rarity</label>
                    <select
                      value={form.rarity}
                      onChange={e => setForm(prev => ({ ...prev, rarity: e.target.value as Rarity }))}
                      className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                    >
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                    </select>
                  </div>
                </div>

                {/* Element */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Element</label>
                  <select
                    value={form.element}
                    onChange={e => setForm(prev => ({ ...prev, element: e.target.value as Element | '' }))}
                    className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="physical">Physical</option>
                    <option value="fire">Fire</option>
                    <option value="ice">Ice</option>
                    <option value="lightning">Lightning</option>
                    <option value="void">Void</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                {/* Effect Presets */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Effect Presets</label>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(EFFECT_PRESETS).map(preset => (
                      <button
                        key={preset}
                        onClick={() => applyPreset(preset)}
                        className="px-2 py-1 text-xs bg-amber-900/30 hover:bg-amber-900/50 border border-amber-900/40 rounded text-amber-300 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Effects JSON */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Effects JSON
                    {effectsError && <span className="text-red-400 ml-2">{effectsError}</span>}
                  </label>
                  <textarea
                    value={form.effectsJson}
                    onChange={e => setForm(prev => ({ ...prev, effectsJson: e.target.value }))}
                    rows={6}
                    className={`w-full px-3 py-2 bg-black/40 border rounded text-white font-mono text-sm focus:outline-none ${
                      effectsError ? 'border-red-500/60' : 'border-amber-900/40 focus:border-amber-500/60'
                    }`}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateCard}
                    className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-medium rounded transition-colors"
                  >
                    Generate Card
                  </button>
                  {generatedCard && (
                    <button
                      onClick={handleGenerateArt}
                      disabled={isGeneratingArt}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:text-purple-400 text-white font-medium rounded transition-colors flex items-center gap-2"
                    >
                      <Icon icon={isGeneratingArt ? 'mdi:loading' : 'mdi:image-plus'} className={isGeneratingArt ? 'animate-spin' : ''} />
                      {isGeneratingArt ? 'Generating...' : 'Generate Art'}
                    </button>
                  )}
                </div>

                {artError && (
                  <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded px-3 py-2">
                    {artError}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="flex flex-col items-center">
                <label className="block text-sm text-gray-400 mb-2">Preview</label>
                {generatedCard ? (
                  <div className="transform scale-125 origin-top">
                    <Card
                      {...getCardDefProps(generatedCard)}
                      variant="hand"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-72 bg-black/40 border border-amber-900/30 rounded-lg flex items-center justify-center text-gray-500">
                    Generate a card to preview
                  </div>
                )}

                {generatedCard && onTestCard && (
                  <button
                    onClick={() => onTestCard(generatedCard)}
                    className="mt-8 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:sword-cross" />
                    Test in Combat
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTool === 'effect-tester' && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <Icon icon="mdi:flask" className="w-16 h-16 mx-auto text-amber-500/40 mb-4" />
            <h2 className="text-xl font-bold text-amber-400 mb-2">Effect Tester</h2>
            <p className="text-gray-500">Coming soon - test individual effects in isolation</p>
          </div>
        )}

        {activeTool === 'debug-info' && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <Icon icon="mdi:bug" className="w-16 h-16 mx-auto text-amber-500/40 mb-4" />
            <h2 className="text-xl font-bold text-amber-400 mb-2">Debug Info</h2>
            <p className="text-gray-500">Coming soon - runtime debug information</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevToolsTab
