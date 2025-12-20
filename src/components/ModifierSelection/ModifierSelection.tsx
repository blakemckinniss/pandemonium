import { memo, useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'
import { ModifierCard } from '../ModifierCard/ModifierCard'
import type { ModifierDefinition } from '../../types'
import { calculateModifierHeat } from '../../game/heat'

// Extended type for selection UI - combines owned data with definition
interface SelectableModifier {
  definitionId: string
  definition: ModifierDefinition
  quantity: number
}

interface ModifierSelectionProps {
  availableModifiers: SelectableModifier[]
  selectedIds: string[]
  maxSelections?: number
  currentHeat?: number
  onToggle: (modifierId: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export const ModifierSelection = memo(function ModifierSelection({
  availableModifiers,
  selectedIds,
  maxSelections = 3,
  currentHeat = 0,
  onToggle,
  onConfirm,
  onCancel,
}: ModifierSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [previewModifier, setPreviewModifier] = useState<ModifierDefinition | null>(null)

  // Calculate projected heat for selected modifiers
  const selectedModifiers = availableModifiers.filter(m => selectedIds.includes(m.definitionId))
  const projectedHeat = selectedModifiers.reduce((sum, mod) => {
    return sum + calculateModifierHeat(mod.definition)
  }, currentHeat)

  // Heat warning thresholds
  const heatWarning = projectedHeat > 40 ? 'high' : projectedHeat > 20 ? 'medium' : 'low'

  // Animate cards on mount
  useEffect(() => {
    if (!containerRef.current) return

    const cards = containerRef.current.querySelectorAll('.ModifierCard')
    gsap.fromTo(cards,
      { y: 50, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.2)' }
    )
  }, [])

  // Group modifiers by category for organization
  const byCategory = availableModifiers.reduce((acc, mod) => {
    const cat = mod.definition.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(mod)
    return acc
  }, {} as Record<string, SelectableModifier[]>)

  const categoryOrder = ['catalyst', 'omen', 'edict', 'seal']
  const sortedCategories = categoryOrder.filter(cat => byCategory[cat]?.length > 0)

  return (
    <div className="ModifierSelection fixed inset-0 z-50 flex items-center justify-center bg-warm-950/90">
      <div
        ref={containerRef}
        className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-surface rounded-2xl border border-warm-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-alt border-b border-warm-700">
          <div>
            <h2 className="text-xl font-bold text-warm-100">Select Modifiers</h2>
            <p className="text-sm text-warm-400">
              Choose up to {maxSelections} modifiers for this run
            </p>
          </div>

          {/* Selection Counter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-warm-600">
              <Icon icon="game-icons:stack" className="w-5 h-5 text-energy" />
              <span className="font-medium text-warm-200">
                {selectedIds.length} / {maxSelections}
              </span>
            </div>

            {/* Heat Indicator */}
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border
              ${heatWarning === 'high' ? 'bg-damage/20 border-damage/50' :
                heatWarning === 'medium' ? 'bg-orange-500/20 border-orange-500/50' :
                'bg-surface border-warm-600'}
            `}>
              <Icon
                icon="game-icons:thermometer-hot"
                className={`w-5 h-5 ${heatWarning === 'high' ? 'text-damage' : heatWarning === 'medium' ? 'text-orange-400' : 'text-warm-400'}`}
              />
              <span className={`font-medium ${heatWarning === 'high' ? 'text-damage' : heatWarning === 'medium' ? 'text-orange-300' : 'text-warm-300'}`}>
                Heat: {projectedHeat.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Modifier Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-warm-500">
              <Icon icon="game-icons:empty-hourglass" className="w-12 h-12 mb-4" />
              <p className="text-lg">No modifiers available</p>
              <p className="text-sm">Visit the shop to purchase modifiers</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedCategories.map(category => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-warm-400 uppercase tracking-wider mb-3 capitalize">
                    {category}s
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {byCategory[category].map(selectable => (
                      <ModifierCard
                        key={selectable.definitionId}
                        modifier={selectable.definition}
                        variant="selection"
                        isSelected={selectedIds.includes(selectable.definitionId)}
                        isDisabled={!selectedIds.includes(selectable.definitionId) && selectedIds.length >= maxSelections}
                        onClick={() => onToggle(selectable.definitionId)}
                        onPreview={() => setPreviewModifier(selectable.definition)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-alt border-t border-warm-700">
          {/* Heat Warning */}
          {heatWarning !== 'low' && (
            <div className={`flex items-center gap-2 text-sm ${heatWarning === 'high' ? 'text-damage' : 'text-orange-400'}`}>
              <Icon icon="game-icons:warning-sign" className="w-4 h-4" />
              {heatWarning === 'high'
                ? 'High heat will significantly increase difficulty!'
                : 'Moderate heat will increase difficulty'}
            </div>
          )}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg bg-surface border border-warm-600 text-warm-300 hover:text-warm-100 hover:border-warm-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-energy text-warm-900 font-medium hover:bg-energy/90 transition-colors"
            >
              <Icon icon="game-icons:check-mark" className="w-5 h-5" />
              Start Run ({selectedIds.length} modifier{selectedIds.length !== 1 ? 's' : ''})
            </button>
          </div>
        </div>

        {/* Preview Modal */}
        {previewModifier && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-warm-950/80"
            onClick={() => setPreviewModifier(null)}
          >
            <div
              className="p-6 rounded-xl bg-surface border border-warm-600"
              onClick={e => e.stopPropagation()}
            >
              <ModifierCard modifier={previewModifier} variant="preview" />
              <button
                onClick={() => setPreviewModifier(null)}
                className="mt-4 w-full py-2 rounded-lg bg-surface-alt text-warm-300 hover:text-warm-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ModifierSelection
