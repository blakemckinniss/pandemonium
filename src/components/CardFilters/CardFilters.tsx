import { Icon } from '@iconify/react'
import type {
  CardFilters,
  CardTheme,
  CardRarity,
  Element,
  SortOption,
  SortDirection,
} from '../../types'

// Display constants
const THEME_OPTIONS: { value: CardTheme; label: string; icon: string }[] = [
  { value: 'attack', label: 'Attack', icon: 'mdi:sword' },
  { value: 'skill', label: 'Skill', icon: 'mdi:shield' },
  { value: 'power', label: 'Power', icon: 'mdi:flash' },
  { value: 'curse', label: 'Curse', icon: 'mdi:skull' },
  { value: 'status', label: 'Status', icon: 'mdi:alert-circle' },
]

const RARITY_OPTIONS: { value: CardRarity; label: string; color: string }[] = [
  { value: 'common', label: 'Common', color: 'text-warm-400' },
  { value: 'uncommon', label: 'Uncommon', color: 'text-blue-400' },
  { value: 'rare', label: 'Rare', color: 'text-yellow-400' },
  { value: 'ultra-rare', label: 'Ultra Rare', color: 'text-purple-400' },
  { value: 'legendary', label: 'Legendary', color: 'text-orange-400' },
  { value: 'mythic', label: 'Mythic', color: 'text-pink-400' },
  { value: 'ancient', label: 'Ancient', color: 'text-emerald-400' },
]

const ELEMENT_OPTIONS: { value: Element; label: string; color: string; icon: string }[] = [
  { value: 'physical', label: 'Physical', color: 'text-warm-300', icon: 'mdi:fist' },
  { value: 'fire', label: 'Fire', color: 'text-orange-400', icon: 'mdi:fire' },
  { value: 'ice', label: 'Ice', color: 'text-cyan-400', icon: 'mdi:snowflake' },
  { value: 'lightning', label: 'Lightning', color: 'text-yellow-300', icon: 'mdi:lightning-bolt' },
  { value: 'void', label: 'Void', color: 'text-purple-400', icon: 'mdi:circle-off-outline' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'energy', label: 'Energy' },
  { value: 'theme', label: 'Theme' },
  { value: 'element', label: 'Element' },
]

interface CardFiltersProps {
  filters: CardFilters
  onFiltersChange: (filters: CardFilters) => void
  sortBy: SortOption
  sortDirection: SortDirection
  onSortChange: (sort: SortOption, direction: SortDirection) => void
  totalCards: number
  filteredCount: number
}

export function CardFiltersBar({
  filters,
  onFiltersChange,
  sortBy,
  sortDirection,
  onSortChange,
  totalCards,
  filteredCount,
}: CardFiltersProps) {
  const updateFilter = <K extends keyof CardFilters>(key: K, value: CardFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = <T,>(array: T[], value: T): T[] => {
    return array.includes(value) ? array.filter((v) => v !== value) : [...array, value]
  }

  const clearFilters = () => {
    onFiltersChange({
      themes: [],
      rarities: [],
      elements: [],
      energyRange: [0, 10],
      owned: null,
      searchQuery: '',
    })
  }

  const hasActiveFilters =
    filters.themes.length > 0 ||
    filters.rarities.length > 0 ||
    filters.elements.length > 0 ||
    filters.searchQuery.length > 0 ||
    filters.owned !== null

  return (
    <div className="space-y-3 p-4 bg-warm-800/50 rounded-lg">
      {/* Search & Sort Row */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-500"
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-10 pr-4 py-2 bg-warm-800 border border-warm-700 rounded-lg text-sm text-warm-200 placeholder-warm-500 focus:border-energy focus:outline-none"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter('searchQuery', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-500 hover:text-warm-300"
            >
              <Icon icon="mdi:close" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption, sortDirection)}
            className="px-3 py-2 bg-warm-800 border border-warm-700 rounded-lg text-sm text-warm-200"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSortChange(sortBy, sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-warm-800 border border-warm-700 rounded-lg text-warm-400 hover:text-white"
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            <Icon icon={sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} />
          </button>
        </div>
      </div>

      {/* Filter Pills Row */}
      <div className="flex flex-wrap gap-2">
        {/* Theme Filters */}
        <FilterDropdown
          label="Theme"
          icon="mdi:cards"
          selectedCount={filters.themes.length}
        >
          <div className="p-2 space-y-1">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter('themes', toggleArrayFilter(filters.themes, opt.value))}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  filters.themes.includes(opt.value)
                    ? 'bg-energy/20 text-energy'
                    : 'hover:bg-warm-700 text-warm-300'
                }`}
              >
                <Icon icon={opt.icon} />
                {opt.label}
                {filters.themes.includes(opt.value) && (
                  <Icon icon="mdi:check" className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Rarity Filters */}
        <FilterDropdown
          label="Rarity"
          icon="mdi:star"
          selectedCount={filters.rarities.length}
        >
          <div className="p-2 space-y-1">
            {RARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  updateFilter('rarities', toggleArrayFilter(filters.rarities, opt.value))
                }
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  filters.rarities.includes(opt.value)
                    ? 'bg-energy/20 text-energy'
                    : 'hover:bg-warm-700'
                }`}
              >
                <span className={opt.color}>{opt.label}</span>
                {filters.rarities.includes(opt.value) && (
                  <Icon icon="mdi:check" className="ml-auto text-energy" />
                )}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Element Filters */}
        <FilterDropdown
          label="Element"
          icon="mdi:fire"
          selectedCount={filters.elements.length}
        >
          <div className="p-2 space-y-1">
            {ELEMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  updateFilter('elements', toggleArrayFilter(filters.elements, opt.value))
                }
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  filters.elements.includes(opt.value)
                    ? 'bg-energy/20 text-energy'
                    : 'hover:bg-warm-700'
                }`}
              >
                <Icon icon={opt.icon} className={opt.color} />
                <span className={opt.color}>{opt.label}</span>
                {filters.elements.includes(opt.value) && (
                  <Icon icon="mdi:check" className="ml-auto text-energy" />
                )}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Energy Range */}
        <FilterDropdown
          label={`Energy ${filters.energyRange[0]}-${filters.energyRange[1]}`}
          icon="mdi:lightning-bolt"
          selectedCount={filters.energyRange[0] > 0 || filters.energyRange[1] < 10 ? 1 : 0}
        >
          <div className="p-4 w-48">
            <div className="flex justify-between text-xs text-warm-400 mb-2">
              <span>Min: {filters.energyRange[0]}</span>
              <span>Max: {filters.energyRange[1]}</span>
            </div>
            <div className="space-y-3">
              <input
                type="range"
                min={0}
                max={10}
                value={filters.energyRange[0]}
                onChange={(e) =>
                  updateFilter('energyRange', [
                    Math.min(Number(e.target.value), filters.energyRange[1]),
                    filters.energyRange[1],
                  ])
                }
                className="w-full accent-energy"
              />
              <input
                type="range"
                min={0}
                max={10}
                value={filters.energyRange[1]}
                onChange={(e) =>
                  updateFilter('energyRange', [
                    filters.energyRange[0],
                    Math.max(Number(e.target.value), filters.energyRange[0]),
                  ])
                }
                className="w-full accent-energy"
              />
            </div>
          </div>
        </FilterDropdown>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-warm-400 hover:text-white border border-warm-700 rounded-lg hover:border-warm-600"
          >
            <Icon icon="mdi:filter-off" />
            Clear
          </button>
        )}

        {/* Count Display */}
        <div className="ml-auto text-sm text-warm-500 self-center">
          {filteredCount === totalCards ? (
            <span>{totalCards} cards</span>
          ) : (
            <span>
              {filteredCount} / {totalCards} cards
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Dropdown component for filter groups
function FilterDropdown({
  label,
  icon,
  selectedCount,
  children,
}: {
  label: string
  icon: string
  selectedCount: number
  children: React.ReactNode
}) {
  return (
    <div className="relative group">
      <button
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          selectedCount > 0
            ? 'border-energy bg-energy/10 text-energy'
            : 'border-warm-700 text-warm-400 hover:text-white hover:border-warm-600'
        }`}
      >
        <Icon icon={icon} />
        {label}
        {selectedCount > 0 && (
          <span className="bg-energy text-warm-900 text-xs px-1.5 rounded-full font-medium">
            {selectedCount}
          </span>
        )}
        <Icon icon="mdi:chevron-down" className="text-xs" />
      </button>
      <div className="absolute top-full left-0 mt-1 bg-warm-800 border border-warm-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
        {children}
      </div>
    </div>
  )
}

export default CardFiltersBar
