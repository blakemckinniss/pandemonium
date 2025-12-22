import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { CardDefinition, CardTheme, Element, Rarity } from '../../types'
import { generateRandomCard, type GenerationOptions } from '../../game/card-generator'
import { Card } from '../Card/Card'
import { getCardDefProps } from '../Card/utils'

type DevTool = 'card-generator' | 'effect-tester' | 'debug-info'

const INITIAL_FORM: CardFormData = {
  theme: '',
  element: '',
  rarity: '',
  hint: '',
}

interface DevToolsTabProps {
  onTestCard?: (card: CardDefinition) => void
}

export function DevToolsTab({ onTestCard }: DevToolsTabProps) {
  const [activeTool, setActiveTool] = useState<DevTool>('card-generator')
  const [form, setForm] = useState<CardFormData>(INITIAL_FORM)
  const [generatedCard, setGeneratedCard] = useState<CardDefinition | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate card using LIVE Groq API + ComfyUI (NO MOCK DATA)
  const handleGenerateCard = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Build options from form - only include non-empty values
      const options: GenerationOptions = {}
      if (form.theme) options.theme = form.theme
      if (form.element) options.element = form.element
      if (form.rarity) options.rarity = form.rarity
      if (form.hint) options.hint = form.hint

      // Call real Groq API for card generation + ComfyUI for art
      const card = await generateRandomCard(options)
      setGeneratedCard(card)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
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
              {/* Form - Constraints for AI generation */}
              <div className="space-y-4">
                <p className="text-sm text-gray-500 italic">
                  Leave fields empty to let AI decide. Fill in to constrain generation.
                </p>

                {/* Theme + Rarity row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Theme (optional)</label>
                    <select
                      value={form.theme}
                      onChange={e => setForm(prev => ({ ...prev, theme: e.target.value as CardTheme | '' }))}
                      className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                    >
                      <option value="">Random</option>
                      <option value="attack">Attack</option>
                      <option value="skill">Skill</option>
                      <option value="power">Power</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rarity (optional)</label>
                    <select
                      value={form.rarity}
                      onChange={e => setForm(prev => ({ ...prev, rarity: e.target.value as Rarity | '' }))}
                      className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                    >
                      <option value="">Random</option>
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                    </select>
                  </div>
                </div>

                {/* Element */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Element (optional)</label>
                  <select
                    value={form.element}
                    onChange={e => setForm(prev => ({ ...prev, element: e.target.value as Element | '' }))}
                    className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white focus:border-amber-500/60 focus:outline-none"
                  >
                    <option value="">Random</option>
                    <option value="physical">Physical</option>
                    <option value="fire">Fire</option>
                    <option value="ice">Ice</option>
                    <option value="lightning">Lightning</option>
                    <option value="void">Void</option>
                  </select>
                </div>

                {/* Hint - natural language guidance */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Theme Hint (optional)</label>
                  <input
                    type="text"
                    value={form.hint}
                    onChange={e => setForm(prev => ({ ...prev, hint: e.target.value }))}
                    placeholder="e.g. 'vampiric drain', 'explosive damage', 'defensive stance'"
                    className="w-full px-3 py-2 bg-black/40 border border-amber-900/40 rounded text-white placeholder:text-gray-600 focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={() => void handleGenerateCard()}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-amber-900 disabled:to-orange-900 disabled:text-amber-400 text-black font-bold rounded transition-all flex items-center justify-center gap-2"
                >
                  <Icon icon={isGenerating ? 'mdi:loading' : 'mdi:auto-fix'} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? 'Generating with Groq + ComfyUI...' : 'Generate Card (AI)'}
                </button>

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded px-3 py-2">
                    <Icon icon="mdi:alert" className="inline mr-1" />
                    {error}
                  </div>
                )}

                {/* Generation info */}
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Card metadata generated via <span className="text-amber-500">Groq API</span></p>
                  <p>• Card art generated via <span className="text-purple-400">ComfyUI</span></p>
                  <p>• Same pipeline as in-game rewards</p>
                </div>
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
