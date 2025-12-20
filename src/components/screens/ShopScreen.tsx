import { useState, useEffect, useRef } from 'react'
import type { RunState, CardDefinition, RelicDefinition, CardRarity, RelicRarity } from '../../types'
import { getAllCards, getCardDefinition } from '../../game/cards'
import { getAllRelics, getRelicDefinition, getRelicsByRarity } from '../../game/relics'
import { generateUid } from '../../lib/utils'
import { gsap } from '../../lib/animations'

// Shop pricing by rarity
const CARD_PRICES: Record<CardRarity, number> = {
  common: 50,
  uncommon: 100,
  rare: 200,
  epic: 300,
  'ultra-rare': 400,
  legendary: 500,
  mythic: 750,
  ancient: 1000,
}

const RELIC_PRICES: Record<RelicRarity, number> = {
  common: 150,
  uncommon: 250,
  rare: 400,
  boss: 500,
}

const CARD_REMOVAL_COST = 75

// Unified rarity styling (matches TreasureScreen pattern)
const RARITY_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-warm-600', bg: 'bg-warm-900/30', text: 'text-warm-400' },
  uncommon: { border: 'border-energy-500', bg: 'bg-energy-900/30', text: 'text-energy-400' },
  rare: { border: 'border-heal-400', bg: 'bg-heal-900/30', text: 'text-heal-400' },
  epic: { border: 'border-purple-400', bg: 'bg-purple-900/30', text: 'text-purple-400' },
  legendary: { border: 'border-amber-400', bg: 'bg-amber-900/30', text: 'text-amber-400' },
}

interface ShopItem {
  id: string
  type: 'card' | 'relic'
  definition: CardDefinition | RelicDefinition
  price: number
  sold: boolean
}

interface ShopScreenProps {
  runState: RunState
  onBuyCard: (cardId: string, price: number) => void
  onBuyRelic: (relicId: string, price: number) => void
  onRemoveCard: (cardUid: string) => void
  onLeave: () => void
  gold: number
}

function generateShopInventory(): ShopItem[] {
  const items: ShopItem[] = []

  // Get 3 random cards for sale (weighted by rarity)
  const allCards = getAllCards().filter(c =>
    c.theme === 'attack' || c.theme === 'skill' || c.theme === 'power'
  )
  const shuffledCards = [...allCards].sort(() => Math.random() - 0.5)
  const shopCards = shuffledCards.slice(0, 3)

  for (const card of shopCards) {
    const rarity = card.rarity ?? 'common'
    items.push({
      id: generateUid(),
      type: 'card',
      definition: card,
      price: CARD_PRICES[rarity],
      sold: false,
    })
  }

  // Get 2 random relics for sale
  const commonRelics = getRelicsByRarity('common')
  const uncommonRelics = getRelicsByRarity('uncommon')
  const availableRelics = [...commonRelics, ...uncommonRelics]
  const shuffledRelics = [...availableRelics].sort(() => Math.random() - 0.5)
  const shopRelics = shuffledRelics.slice(0, 2)

  for (const relic of shopRelics) {
    items.push({
      id: generateUid(),
      type: 'relic',
      definition: relic,
      price: RELIC_PRICES[relic.rarity],
      sold: false,
    })
  }

  return items
}

export function ShopScreen({ runState, onBuyCard, onBuyRelic, onRemoveCard, onLeave, gold }: ShopScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inventory, setInventory] = useState<ShopItem[]>(() => generateShopInventory())
  const [selectedForRemoval, setSelectedForRemoval] = useState<string | null>(null)
  const [showRemovalModal, setShowRemovalModal] = useState(false)

  const canAfford = (price: number) => gold >= price

  // GSAP entrance animation for shop items
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Animate cards section
      gsap.from('.shop-card', {
        y: 60,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'back.out(1.4)',
      })

      // Animate relics section with delay
      gsap.from('.shop-relic', {
        y: 40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: 'back.out(1.4)',
        delay: 0.3,
      })

      // Animate removal service last
      gsap.from('.shop-removal', {
        y: 30,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        delay: 0.6,
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const handleBuy = (item: ShopItem) => {
    if (item.sold || !canAfford(item.price)) return

    if (item.type === 'card') {
      onBuyCard((item.definition as CardDefinition).id, item.price)
    } else {
      onBuyRelic((item.definition as RelicDefinition).id, item.price)
    }

    setInventory(prev => prev.map(i =>
      i.id === item.id ? { ...i, sold: true } : i
    ))
  }

  const handleRemoveCard = () => {
    if (!selectedForRemoval || !canAfford(CARD_REMOVAL_COST)) return
    onRemoveCard(selectedForRemoval)
    setShowRemovalModal(false)
    setSelectedForRemoval(null)
  }

  const removableCards = runState.deck.filter(card => {
    const def = getCardDefinition(card.definitionId)
    return def && def.theme !== 'curse' && def.theme !== 'status'
  })

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-void-950 via-void-900 to-void-950 p-8">
      {/* Atmospheric vignette overlay */}
      <div className="fixed inset-0 pointer-events-none bg-radial-vignette opacity-60" />

      {/* Header */}
      <div className="max-w-6xl mx-auto relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-warm-200 drop-shadow-lg">
              Merchant's Emporium
            </h1>
            <p className="text-warm-500 font-prose italic mt-1">
              Browse rare wares from across the realm
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-surface/80 rounded-lg px-6 py-3 border border-energy/30 backdrop-blur-sm">
              <span className="text-energy text-2xl font-bold">{gold}</span>
              <span className="text-energy/70 ml-2">Gold</span>
            </div>
            <button
              onClick={onLeave}
              className="px-6 py-3 bg-surface hover:bg-surface-alt text-warm-200 rounded-lg transition-colors border border-warm-700 hover:border-warm-500"
            >
              Leave Shop
            </button>
          </div>
        </div>

        {/* Cards Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-semibold text-warm-300 mb-4 flex items-center gap-2">
            <span className="text-3xl">🃏</span> Cards
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {inventory.filter(i => i.type === 'card').map(item => {
              const card = item.definition as CardDefinition
              const affordable = canAfford(item.price)
              const rarity = card.rarity ?? 'common'
              const rarityStyle = RARITY_STYLES[rarity] ?? RARITY_STYLES.common
              return (
                <div
                  key={item.id}
                  className={`
                    shop-card relative rounded-xl overflow-hidden border-2 transition-all duration-300
                    ${item.sold
                      ? 'border-warm-800 opacity-50'
                      : affordable
                        ? `${rarityStyle.border} hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl`
                        : 'border-damage/50 opacity-75'
                    }
                  `}
                  onClick={() => !item.sold && affordable && handleBuy(item)}
                >
                  {/* Card Display */}
                  <div className="bg-gradient-to-b from-surface to-surface-alt p-4">
                    <div className="aspect-[3/4] bg-warm-900/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {card.image ? (
                        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">{card.theme === 'attack' ? '⚔️' : card.theme === 'skill' ? '🛡️' : '✨'}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-warm-100">{card.name}</h3>
                    <p className="text-sm text-warm-400 font-prose line-clamp-2">{card.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className={`text-xs px-2 py-1 rounded ${rarityStyle.bg} ${rarityStyle.text}`}>
                        {rarity}
                      </span>
                      <span className="text-energy">{card.energy} ⚡</span>
                    </div>
                  </div>

                  {/* Price Tag */}
                  <div className={`
                    py-3 px-4 flex justify-between items-center
                    ${item.sold
                      ? 'bg-surface-alt'
                      : affordable
                        ? 'bg-gradient-to-r from-energy/20 to-energy/5'
                        : 'bg-damage/20'
                    }
                  `}>
                    {item.sold ? (
                      <span className="text-warm-600 font-semibold">SOLD</span>
                    ) : (
                      <>
                        <span className={`font-bold text-lg ${affordable ? 'text-energy' : 'text-damage'}`}>
                          {item.price} Gold
                        </span>
                        {affordable && <span className="text-heal text-sm">Click to Buy</span>}
                        {!affordable && <span className="text-damage text-sm">Not enough gold</span>}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Relics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-semibold text-warm-300 mb-4 flex items-center gap-2">
            <span className="text-3xl">🏺</span> Relics
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {inventory.filter(i => i.type === 'relic').map(item => {
              const relic = item.definition as RelicDefinition
              const affordable = canAfford(item.price)
              const rarityStyle = RARITY_STYLES[relic.rarity] ?? RARITY_STYLES.common
              return (
                <div
                  key={item.id}
                  className={`
                    shop-relic relative rounded-xl overflow-hidden border-2 transition-all duration-300
                    ${item.sold
                      ? 'border-warm-800 opacity-50'
                      : affordable
                        ? `${rarityStyle.border} hover:scale-[1.02] cursor-pointer shadow-lg hover:shadow-xl`
                        : 'border-damage/50 opacity-75'
                    }
                  `}
                  onClick={() => !item.sold && affordable && handleBuy(item)}
                >
                  <div className="bg-gradient-to-b from-surface to-surface-alt p-6 flex gap-4">
                    <div className="w-20 h-20 bg-warm-900/50 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-4xl">🏺</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-warm-100">{relic.name}</h3>
                      <p className="text-sm text-warm-400 font-prose mt-1">{relic.description}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${rarityStyle.bg} ${rarityStyle.text}`}>
                        {relic.rarity}
                      </span>
                    </div>
                  </div>

                  {/* Price Tag */}
                  <div className={`
                    py-3 px-4 flex justify-between items-center
                    ${item.sold
                      ? 'bg-surface-alt'
                      : affordable
                        ? 'bg-gradient-to-r from-energy/20 to-energy/5'
                        : 'bg-damage/20'
                    }
                  `}>
                    {item.sold ? (
                      <span className="text-warm-600 font-semibold">SOLD</span>
                    ) : (
                      <>
                        <span className={`font-bold text-lg ${affordable ? 'text-energy' : 'text-damage'}`}>
                          {item.price} Gold
                        </span>
                        {affordable && <span className="text-heal text-sm">Click to Buy</span>}
                        {!affordable && <span className="text-damage text-sm">Not enough gold</span>}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card Removal Service */}
        <div className="shop-removal mt-8">
          <h2 className="text-2xl font-display font-semibold text-damage mb-4 flex items-center gap-2">
            <span className="text-3xl">🗑️</span> Card Removal Service
          </h2>
          <div className="bg-surface/60 rounded-xl border border-damage/30 p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-warm-300">
                  Remove a card from your deck permanently.
                </p>
                <p className="text-warm-500 text-sm mt-1">
                  Deck size: {runState.deck.length} cards
                </p>
              </div>
              <button
                onClick={() => setShowRemovalModal(true)}
                disabled={!canAfford(CARD_REMOVAL_COST) || removableCards.length === 0}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-all
                  ${canAfford(CARD_REMOVAL_COST) && removableCards.length > 0
                    ? 'bg-damage hover:bg-damage/80 text-white cursor-pointer'
                    : 'bg-surface-alt text-warm-600 cursor-not-allowed'
                  }
                `}
              >
                Remove Card ({CARD_REMOVAL_COST} Gold)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Removal Modal */}
      {showRemovalModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-damage/50 p-6 max-w-4xl max-h-[80vh] overflow-auto shadow-2xl">
            <h3 className="text-2xl font-display font-bold text-damage mb-4">Select a Card to Remove</h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {removableCards.map(card => {
                const def = getCardDefinition(card.definitionId)
                if (!def) return null
                return (
                  <div
                    key={card.uid}
                    onClick={() => setSelectedForRemoval(card.uid)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all border-2
                      ${selectedForRemoval === card.uid
                        ? 'border-damage bg-damage/20'
                        : 'border-warm-700 bg-surface-alt hover:border-warm-500'
                      }
                    `}
                  >
                    <div className="text-center">
                      {def.image ? (
                        <img src={def.image} alt={def.name} className="w-full aspect-[3/4] object-cover rounded mb-2" />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-warm-900 rounded mb-2 flex items-center justify-center">
                          <span className="text-3xl">{def.theme === 'attack' ? '⚔️' : def.theme === 'skill' ? '🛡️' : '✨'}</span>
                        </div>
                      )}
                      <p className="text-sm text-warm-100 font-medium truncate">{def.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowRemovalModal(false)
                  setSelectedForRemoval(null)
                }}
                className="px-6 py-2 bg-surface-alt hover:bg-warm-800 text-warm-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveCard}
                disabled={!selectedForRemoval}
                className={`
                  px-6 py-2 rounded-lg font-semibold transition-colors
                  ${selectedForRemoval
                    ? 'bg-damage hover:bg-damage/80 text-white'
                    : 'bg-surface-alt text-warm-600 cursor-not-allowed'
                  }
                `}
              >
                Remove Card ({CARD_REMOVAL_COST} Gold)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
