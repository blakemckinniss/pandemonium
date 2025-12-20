import { memo, useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'
import { ModifierCard } from '../ModifierCard/ModifierCard'
import type { ModifierDefinition, ModifierRarity } from '../../types'
import { generateModifier, generateModifierSet } from '../../game/modifier-generator'

// Base prices by rarity
const RARITY_PRICES: Record<ModifierRarity, number> = {
  common: 25,
  uncommon: 120,
  rare: 360,
  legendary: 800,
}

// Pack configurations
const PACKS = [
  { id: 'starter', name: 'Starter Pack', price: 50, description: '3 Common modifiers', contents: { common: 3 } },
  { id: 'explorer', name: 'Explorer Pack', price: 150, description: '2 Common, 1 Uncommon', contents: { common: 2, uncommon: 1 } },
  { id: 'architect', name: 'Architect Pack', price: 400, description: '1 Uncommon, 1 Rare, 2 Random', contents: { uncommon: 1, rare: 1, random: 2 } },
  { id: 'legendary', name: 'Legendary Pack', price: 1000, description: 'Guaranteed Legendary', contents: { legendary: 1, rare: 1 } },
]

interface ModifierShopProps {
  gold: number
  onPurchase: (modifier: ModifierDefinition, price: number) => void
  onPurchasePack: (modifiers: ModifierDefinition[], price: number) => void
  onClose: () => void
}

export const ModifierShop = memo(function ModifierShop({
  gold,
  onPurchase,
  onPurchasePack,
  onClose,
}: ModifierShopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'singles' | 'packs' | 'generate'>('singles')
  const [stockModifiers, setStockModifiers] = useState<ModifierDefinition[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<ModifierRarity>('common')
  const [previewModifier, setPreviewModifier] = useState<ModifierDefinition | null>(null)

  // Generate initial stock
  useEffect(() => {
    async function loadStock() {
      setIsGenerating(true)
      try {
        const modifiers = await generateModifierSet({ count: 6 })
        setStockModifiers(modifiers)
      } catch (err) {
        setGenerationError(err instanceof Error ? err.message : 'Failed to generate shop stock')
      } finally {
        setIsGenerating(false)
      }
    }
    void loadStock()
  }, [])

  // Animate entrance
  useEffect(() => {
    if (!containerRef.current) return

    gsap.fromTo(containerRef.current,
      { scale: 0.9, opacity: 0, y: 50 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }
    )
  }, [])

  // Handle single purchase
  function handleBuySingle(modifier: ModifierDefinition) {
    const price = RARITY_PRICES[modifier.rarity]
    if (gold < price) return
    onPurchase(modifier, price)
    setStockModifiers(prev => prev.filter(m => m.id !== modifier.id))
  }

  // Handle pack purchase
  async function handleBuyPack(packId: string) {
    const pack = PACKS.find(p => p.id === packId)
    if (!pack || gold < pack.price) return

    setIsGenerating(true)
    setGenerationError(null)

    try {
      const modifiers: ModifierDefinition[] = []
      const { contents } = pack

      for (const [rarity, count] of Object.entries(contents)) {
        for (let i = 0; i < count; i++) {
          const mod = await generateModifier({
            rarity: rarity === 'random'
              ? (['common', 'uncommon', 'rare'] as ModifierRarity[])[Math.floor(Math.random() * 3)]
              : rarity as ModifierRarity
          })
          modifiers.push(mod)
        }
      }

      onPurchasePack(modifiers, pack.price)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate pack')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle custom generation
  async function handleGenerateCustom() {
    const price = RARITY_PRICES[selectedRarity]
    if (gold < price) return

    setIsGenerating(true)
    setGenerationError(null)

    try {
      const modifier = await generateModifier({ rarity: selectedRarity })
      onPurchase(modifier, price)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate modifier')
    } finally {
      setIsGenerating(false)
    }
  }

  // Refresh shop stock
  async function handleRefreshStock() {
    setIsGenerating(true)
    setGenerationError(null)
    try {
      const modifiers = await generateModifierSet({ count: 6 })
      setStockModifiers(modifiers)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to refresh stock')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="ModifierShop fixed inset-0 z-50 flex items-center justify-center bg-warm-950/90">
      <div
        ref={containerRef}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-surface rounded-2xl border border-warm-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-alt border-b border-warm-700">
          <div className="flex items-center gap-3">
            <Icon icon="game-icons:shop" className="w-7 h-7 text-energy" />
            <h2 className="text-xl font-bold text-warm-100">Modifier Shop</h2>
          </div>

          {/* Gold Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-energy/20 border border-energy/30">
              <Icon icon="game-icons:two-coins" className="w-5 h-5 text-energy" />
              <span className="font-bold text-energy">{gold}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface text-warm-400 hover:text-warm-100 transition-colors"
            >
              <Icon icon="game-icons:cross-mark" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-warm-700">
          {[
            { id: 'singles', label: 'Single Modifiers', icon: 'game-icons:card-pickup' },
            { id: 'packs', label: 'Packs', icon: 'game-icons:card-deck' },
            { id: 'generate', label: 'Generate', icon: 'game-icons:magic-swirl' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'singles' | 'packs' | 'generate')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3
                ${activeTab === tab.id
                  ? 'bg-surface-alt border-b-2 border-energy text-energy'
                  : 'text-warm-400 hover:text-warm-200 hover:bg-surface/50'}
                transition-colors
              `}
            >
              <Icon icon={tab.icon} className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Singles Tab */}
          {activeTab === 'singles' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-warm-400">Available modifiers in stock</p>
                <button
                  onClick={() => void handleRefreshStock()}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt text-warm-400 hover:text-warm-200 disabled:opacity-50 transition-colors"
                >
                  <Icon icon={isGenerating ? 'game-icons:spinning-sword' : 'game-icons:cycle'} className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Refresh Stock
                </button>
              </div>

              {stockModifiers.length === 0 && !isGenerating ? (
                <div className="flex flex-col items-center justify-center h-48 text-warm-500">
                  <Icon icon="game-icons:empty-hourglass" className="w-10 h-10 mb-3" />
                  <p>Shop is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {stockModifiers.map(modifier => (
                    <ModifierCard
                      key={modifier.id}
                      modifier={modifier}
                      variant="shop"
                      showPrice
                      price={RARITY_PRICES[modifier.rarity]}
                      isDisabled={gold < RARITY_PRICES[modifier.rarity]}
                      onClick={() => handleBuySingle(modifier)}
                      onPreview={() => setPreviewModifier(modifier)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Packs Tab */}
          {activeTab === 'packs' && (
            <div className="grid grid-cols-2 gap-4">
              {PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => void handleBuyPack(pack.id)}
                  disabled={gold < pack.price || isGenerating}
                  className={`
                    p-5 rounded-xl border-2 text-left transition-all
                    ${gold >= pack.price
                      ? 'border-energy/50 hover:border-energy hover:bg-energy/10'
                      : 'border-warm-700 opacity-50 cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon icon="game-icons:card-bundle" className="w-8 h-8 text-purple-400" />
                    <div className="flex items-center gap-1 text-energy font-bold">
                      <Icon icon="game-icons:two-coins" className="w-4 h-4" />
                      {pack.price}
                    </div>
                  </div>
                  <h3 className="font-medium text-warm-100 mb-1">{pack.name}</h3>
                  <p className="text-sm text-warm-400">{pack.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="max-w-md mx-auto">
              <p className="text-warm-400 mb-6 text-center">
                Generate a custom AI-created modifier of your chosen rarity
              </p>

              {/* Rarity Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['common', 'uncommon', 'rare', 'legendary'] as ModifierRarity[]).map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`
                      flex items-center justify-between p-4 rounded-xl border-2 transition-all
                      ${selectedRarity === rarity
                        ? 'border-energy bg-energy/10'
                        : 'border-warm-700 hover:border-warm-600'}
                    `}
                  >
                    <span className="capitalize text-warm-200">{rarity}</span>
                    <span className="flex items-center gap-1 text-energy text-sm">
                      <Icon icon="game-icons:two-coins" className="w-3.5 h-3.5" />
                      {RARITY_PRICES[rarity]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <button
                onClick={() => void handleGenerateCustom()}
                disabled={gold < RARITY_PRICES[selectedRarity] || isGenerating}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-energy text-warm-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-energy/90 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Icon icon="game-icons:spinning-sword" className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon icon="game-icons:magic-swirl" className="w-6 h-6" />
                    Generate {selectedRarity.charAt(0).toUpperCase() + selectedRarity.slice(1)}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Display */}
          {generationError && (
            <div className="mt-4 p-4 rounded-lg bg-damage/20 border border-damage/50 text-damage text-sm">
              <Icon icon="game-icons:warning-sign" className="inline w-4 h-4 mr-2" />
              {generationError}
            </div>
          )}
        </div>

        {/* Price Guide Footer */}
        <div className="px-6 py-3 bg-surface-alt border-t border-warm-700">
          <div className="flex items-center justify-center gap-6 text-xs text-warm-500">
            {Object.entries(RARITY_PRICES).map(([rarity, price]) => (
              <span key={rarity} className="flex items-center gap-1">
                <span className="capitalize">{rarity}:</span>
                <Icon icon="game-icons:two-coins" className="w-3 h-3 text-energy" />
                <span className="text-warm-400">{price}</span>
              </span>
            ))}
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

export default ModifierShop
