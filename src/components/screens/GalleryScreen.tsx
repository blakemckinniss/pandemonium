import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useMetaStore } from '../../stores/metaStore'
import { HEROES } from '../../game/new-game'
import {
  AFFECTION_LEVELS,
  getAffectionProgress,
} from '../../types'
import type { HeroAffection, AffectionLevel } from '../../types'

interface GalleryScreenProps {
  onBack: () => void
}

const AFFECTION_COLORS: Record<AffectionLevel, string> = {
  stranger: 'text-warm-500',
  acquaintance: 'text-warm-400',
  friend: 'text-green-400',
  close: 'text-cyan-400',
  intimate: 'text-pink-400',
  devoted: 'text-purple-400',
  soulbound: 'text-amber-400',
}

const AFFECTION_ICONS: Record<AffectionLevel, string> = {
  stranger: 'game-icons:person',
  acquaintance: 'game-icons:handshake',
  friend: 'game-icons:two-hearts',
  close: 'game-icons:heart-wings',
  intimate: 'game-icons:love-letter',
  devoted: 'game-icons:hearts',
  soulbound: 'game-icons:eternal-love',
}

export function GalleryScreen({ onBack }: GalleryScreenProps) {
  const [selectedHero, setSelectedHero] = useState<string | null>(null)
  const {
    getHeroAffection,
    unlockedOutfits,
    equippedOutfits,
    equipOutfit,
  } = useMetaStore()

  const heroIds = Object.keys(HEROES)

  const renderHeroCard = (heroId: string) => {
    const hero = HEROES[heroId]
    const affection = getHeroAffection(heroId)
    const progress = getAffectionProgress(affection.points)
    const levelData = AFFECTION_LEVELS[affection.level]
    const outfitCount = unlockedOutfits[heroId]?.length ?? 1

    return (
      <button
        key={heroId}
        onClick={() => setSelectedHero(heroId)}
        className={`
          relative p-4 rounded-2xl border-2 transition-all duration-300
          ${selectedHero === heroId
            ? 'border-pink-500 bg-pink-500/10 scale-105'
            : 'border-warm-700 bg-surface/50 hover:border-warm-500 hover:bg-surface/80'
          }
        `}
      >
        {/* Hero Image */}
        <div className="w-32 h-40 mb-3 rounded-xl overflow-hidden bg-warm-800">
          {hero.image ? (
            <img
              src={hero.image}
              alt={hero.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon icon="game-icons:woman-elf-face" className="w-16 h-16 text-warm-600" />
            </div>
          )}
        </div>

        {/* Hero Name */}
        <h3 className="text-lg font-bold text-white mb-1">{hero.name}</h3>

        {/* Affection Level */}
        <div className={`flex items-center gap-1.5 text-sm ${AFFECTION_COLORS[affection.level]}`}>
          <Icon icon={AFFECTION_ICONS[affection.level]} className="w-4 h-4" />
          <span>{levelData.label}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-1.5 bg-warm-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Outfit Count Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-xs">
          {outfitCount} outfit{outfitCount !== 1 ? 's' : ''}
        </div>
      </button>
    )
  }

  const renderHeroDetail = (heroId: string) => {
    const hero = HEROES[heroId]
    const affection = getHeroAffection(heroId)
    const progress = getAffectionProgress(affection.points)
    const levelData = AFFECTION_LEVELS[affection.level]
    const heroOutfits = unlockedOutfits[heroId] ?? ['default']
    const equipped = equippedOutfits[heroId] ?? 'default'

    return (
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          {/* Large Portrait */}
          <div className="w-48 h-64 rounded-2xl overflow-hidden bg-warm-800 border-2 border-pink-500/50">
            {hero.image ? (
              <img
                src={hero.image}
                alt={hero.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon icon="game-icons:woman-elf-face" className="w-24 h-24 text-warm-600" />
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{hero.name}</h2>

            {/* Affection */}
            <div className={`flex items-center gap-2 mb-4 ${AFFECTION_COLORS[affection.level]}`}>
              <Icon icon={AFFECTION_ICONS[affection.level]} className="w-6 h-6" />
              <span className="text-xl font-medium">{levelData.label}</span>
              <span className="text-warm-500 text-sm">({affection.points} pts)</span>
            </div>

            {/* Progress to next level */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-warm-400 mb-1">
                <span>Progress to next level</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-3 bg-warm-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-warm-800/50 border border-warm-700">
                <div className="text-2xl font-bold text-pink-400">{affection.runsCompleted}</div>
                <div className="text-xs text-warm-500">Runs Together</div>
              </div>
              <div className="p-3 rounded-xl bg-warm-800/50 border border-warm-700">
                <div className="text-2xl font-bold text-heal">{affection.winsWithHero}</div>
                <div className="text-xs text-warm-500">Victories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Outfits Section */}
        <div>
          <h3 className="text-lg font-medium text-warm-300 mb-4 flex items-center gap-2">
            <Icon icon="game-icons:hanger" className="w-5 h-5 text-purple-400" />
            Outfits
          </h3>

          <div className="grid grid-cols-4 gap-4">
            {heroOutfits.map((outfitId) => (
              <button
                key={outfitId}
                onClick={() => equipOutfit(heroId, outfitId)}
                className={`
                  p-3 rounded-xl border-2 transition-all
                  ${equipped === outfitId
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-warm-700 bg-warm-800/50 hover:border-warm-500'
                  }
                `}
              >
                <div className="w-full aspect-[3/4] rounded-lg bg-warm-700 mb-2 flex items-center justify-center">
                  <Icon
                    icon={outfitId === 'default' ? 'game-icons:dress' : 'game-icons:corset'}
                    className="w-12 h-12 text-warm-500"
                  />
                </div>
                <div className="text-sm text-warm-300 capitalize">
                  {outfitId === 'default' ? 'Default' : outfitId.replace(/_/g, ' ')}
                </div>
                {equipped === outfitId && (
                  <div className="text-xs text-pink-400 mt-1">Equipped</div>
                )}
              </button>
            ))}

            {/* Locked outfit placeholder */}
            <div className="p-3 rounded-xl border-2 border-dashed border-warm-700/50 opacity-50">
              <div className="w-full aspect-[3/4] rounded-lg bg-warm-800/30 mb-2 flex items-center justify-center">
                <Icon icon="game-icons:padlock" className="w-12 h-12 text-warm-600" />
              </div>
              <div className="text-sm text-warm-500">Locked</div>
              <div className="text-xs text-warm-600">Reach Intimate</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="GalleryScreen fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-warm-950 via-warm-900 to-warm-950">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-warm-800">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-warm-800 hover:bg-warm-700 transition-colors"
        >
          <Icon icon="mdi:arrow-left" className="w-6 h-6 text-warm-300" />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Icon icon="game-icons:love-howl" className="w-8 h-8 text-pink-400" />
          Character Gallery
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hero List */}
        <div className="w-80 p-6 border-r border-warm-800 overflow-y-auto">
          <h2 className="text-sm font-medium text-warm-500 uppercase tracking-wide mb-4">
            Your Companions
          </h2>
          <div className="flex flex-col gap-4">
            {heroIds.map(renderHeroCard)}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedHero ? (
          renderHeroDetail(selectedHero)
        ) : (
          <div className="flex-1 flex items-center justify-center text-warm-600">
            <div className="text-center">
              <Icon icon="game-icons:love-letter" className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a companion to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GalleryScreen
