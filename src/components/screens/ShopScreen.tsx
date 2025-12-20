import { useState, useMemo } from 'react'
import type { RunState, CardDefinition, RelicDefinition, CardRarity, RelicRarity } from '../../types'
import { getAllCards, getCardDefinition } from '../../game/cards'
import { getAllRelics, getRelicDefinition, getRelicsByRarity } from '../../game/relics'
import { generateUid } from '../../lib/utils'

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
  const [inventory, setInventory] = useState<ShopItem[]>(() => generateShopInventory())
  const [selectedForRemoval, setSelectedForRemoval] = useState<string | null>(null)
  const [showRemovalModal, setShowRemovalModal] = useState(false)

  const canAfford = (price: number) => gold >= price

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-amber-400 drop-shadow-lg">
              Merchant's Emporium
            </h1>
            <p className="text-slate-400 mt-1">
              Browse rare wares from across the realm
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-800/80 rounded-lg px-6 py-3 border border-amber-500/30">
              <span className="text-amber-400 text-2xl font-bold">{gold}</span>
              <span className="text-amber-500 ml-2">Gold</span>
            </div>
            <button
              onClick={onLeave}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-500"
            >
              Leave Shop
            </button>
          </div>
        </div>

        {/* Cards Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <span className="text-3xl">🃏</span> Cards
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {inventory.filter(i => i.type === 'card').map(item => {
              const card = item.definition as CardDefinition
              const affordable = canAfford(item.price)
              return (
                <div
                  key={item.id}
                  className={`
                    relative rounded-xl overflow-hidden border-2 transition-all duration-300
                    ${item.sold
                      ? 'border-slate-700 opacity-50'
                      : affordable
                        ? 'border-purple-500/50 hover:border-purple-400 hover:scale-105 cursor-pointer'
                        : 'border-red-900/50 opacity-75'
                    }
                  `}
                  onClick={() => !item.sold && affordable && handleBuy(item)}
                >
                  {/* Card Display */}
                  <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-4">
                    <div className="aspect-[3/4] bg-slate-700/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {card.image ? (
                        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">{card.theme === 'attack' ? '⚔️' : card.theme === 'skill' ? '🛡️' : '✨'}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">{card.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{card.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        card.rarity === 'rare' ? 'bg-yellow-500/20 text-yellow-400' :
                        card.rarity === 'uncommon' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {card.rarity ?? 'common'}
                      </span>
                      <span className="text-purple-400">{card.energy} ⚡</span>
                    </div>
                  </div>

                  {/* Price Tag */}
                  <div className={`
                    py-3 px-4 flex justify-between items-center
                    ${item.sold
                      ? 'bg-slate-800'
                      : affordable
                        ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/10'
                        : 'bg-red-900/20'
                    }
                  `}>
                    {item.sold ? (
                      <span className="text-slate-500 font-semibold">SOLD</span>
                    ) : (
                      <>
                        <span className={`font-bold text-lg ${affordable ? 'text-amber-400' : 'text-red-400'}`}>
                          {item.price} Gold
                        </span>
                        {affordable && <span className="text-green-400 text-sm">Click to Buy</span>}
                        {!affordable && <span className="text-red-400 text-sm">Not enough gold</span>}
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
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <span className="text-3xl">🏺</span> Relics
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {inventory.filter(i => i.type === 'relic').map(item => {
              const relic = item.definition as RelicDefinition
              const affordable = canAfford(item.price)
              return (
                <div
                  key={item.id}
                  className={`
                    relative rounded-xl overflow-hidden border-2 transition-all duration-300
                    ${item.sold
                      ? 'border-slate-700 opacity-50'
                      : affordable
                        ? 'border-amber-500/50 hover:border-amber-400 hover:scale-105 cursor-pointer'
                        : 'border-red-900/50 opacity-75'
                    }
                  `}
                  onClick={() => !item.sold && affordable && handleBuy(item)}
                >
                  <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 flex gap-4">
                    <div className="w-20 h-20 bg-slate-700/50 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-4xl">🏺</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{relic.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{relic.description}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                        relic.rarity === 'rare' ? 'bg-yellow-500/20 text-yellow-400' :
                        relic.rarity === 'uncommon' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {relic.rarity}
                      </span>
                    </div>
                  </div>

                  {/* Price Tag */}
                  <div className={`
                    py-3 px-4 flex justify-between items-center
                    ${item.sold
                      ? 'bg-slate-800'
                      : affordable
                        ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/10'
                        : 'bg-red-900/20'
                    }
                  `}>
                    {item.sold ? (
                      <span className="text-slate-500 font-semibold">SOLD</span>
                    ) : (
                      <>
                        <span className={`font-bold text-lg ${affordable ? 'text-amber-400' : 'text-red-400'}`}>
                          {item.price} Gold
                        </span>
                        {affordable && <span className="text-green-400 text-sm">Click to Buy</span>}
                        {!affordable && <span className="text-red-400 text-sm">Not enough gold</span>}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card Removal Service */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-red-300 mb-4 flex items-center gap-2">
            <span className="text-3xl">🗑️</span> Card Removal Service
          </h2>
          <div className="bg-slate-800/60 rounded-xl border border-red-500/30 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-300">
                  Remove a card from your deck permanently.
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Deck size: {runState.deck.length} cards
                </p>
              </div>
              <button
                onClick={() => setShowRemovalModal(true)}
                disabled={!canAfford(CARD_REMOVAL_COST) || removableCards.length === 0}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-all
                  ${canAfford(CARD_REMOVAL_COST) && removableCards.length > 0
                    ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-red-500/50 p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <h3 className="text-2xl font-bold text-red-400 mb-4">Select a Card to Remove</h3>
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
                        ? 'border-red-500 bg-red-900/30'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                      }
                    `}
                  >
                    <div className="text-center">
                      {def.image ? (
                        <img src={def.image} alt={def.name} className="w-full aspect-[3/4] object-cover rounded mb-2" />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-slate-700 rounded mb-2 flex items-center justify-center">
                          <span className="text-3xl">{def.theme === 'attack' ? '⚔️' : def.theme === 'skill' ? '🛡️' : '✨'}</span>
                        </div>
                      )}
                      <p className="text-sm text-white font-medium truncate">{def.name}</p>
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
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveCard}
                disabled={!selectedForRemoval}
                className={`
                  px-6 py-2 rounded-lg font-semibold
                  ${selectedForRemoval
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
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
