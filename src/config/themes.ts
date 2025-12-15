/**
 * Theme configuration for card generation.
 * Themes provide flavor hints to the AI card generator.
 */

export interface ThemeConfig {
  id: string
  name: string
  description: string
  hints: string[] // Random hints picked for generation
  elementBias?: ('fire' | 'ice' | 'lightning' | 'void' | 'physical')[]
  themeBias?: ('attack' | 'skill' | 'power')[]
}

// ============================================
// THEME DEFINITIONS
// ============================================

export const THEMES: ThemeConfig[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced mix of all card types',
    hints: [
      'balanced combat',
      'versatile tactics',
      'classic fantasy',
      'adventurer toolkit',
    ],
  },
  {
    id: 'inferno',
    name: 'Inferno',
    description: 'Fire and destruction focused',
    hints: [
      'blazing flames',
      'volcanic eruption',
      'burning passion',
      'fire magic',
      'scorched earth',
      'phoenix flame',
    ],
    elementBias: ['fire'],
    themeBias: ['attack'],
  },
  {
    id: 'frost',
    name: 'Frost',
    description: 'Ice and control focused',
    hints: [
      'frozen tundra',
      'glacial power',
      'winter storm',
      'ice magic',
      'frostbite',
      'crystalline ice',
    ],
    elementBias: ['ice'],
    themeBias: ['skill'],
  },
  {
    id: 'storm',
    name: 'Storm',
    description: 'Lightning and speed focused',
    hints: [
      'thunder strike',
      'electric surge',
      'storm caller',
      'lightning magic',
      'chain lightning',
      'static discharge',
    ],
    elementBias: ['lightning'],
    themeBias: ['attack'],
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Void and debuff focused',
    hints: [
      'dark magic',
      'shadow manipulation',
      'void corruption',
      'curse',
      'soul drain',
      'nightmare',
    ],
    elementBias: ['void'],
    themeBias: ['skill', 'power'],
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Defense and protection focused',
    hints: [
      'shield wall',
      'protective barrier',
      'iron defense',
      'fortress',
      'guardian spirit',
      'armor plating',
    ],
    elementBias: ['physical'],
    themeBias: ['skill'],
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'High risk, high reward attacks',
    hints: [
      'reckless assault',
      'blood frenzy',
      'all-out attack',
      'berserker rage',
      'sacrifice for power',
      'glass cannon',
    ],
    elementBias: ['physical', 'fire'],
    themeBias: ['attack'],
  },
  {
    id: 'arcane',
    name: 'Arcane',
    description: 'Card manipulation and combos',
    hints: [
      'arcane knowledge',
      'spell weaving',
      'mana manipulation',
      'card synergy',
      'combo potential',
      'magical insight',
    ],
    themeBias: ['power', 'skill'],
  },
]

// ============================================
// THEME HELPERS
// ============================================

export function getTheme(id: string): ThemeConfig | undefined {
  return THEMES.find((t) => t.id === id)
}

export function getRandomTheme(): ThemeConfig {
  return THEMES[Math.floor(Math.random() * THEMES.length)]
}

export function getRandomHint(theme: ThemeConfig): string {
  return theme.hints[Math.floor(Math.random() * theme.hints.length)]
}

/**
 * Get generation options based on theme.
 * Picks random hint and applies biases.
 */
export function themeToGenerationOptions(theme: ThemeConfig) {
  const options: {
    hint: string
    element?: 'fire' | 'ice' | 'lightning' | 'void' | 'physical'
    theme?: 'attack' | 'skill' | 'power'
  } = {
    hint: getRandomHint(theme),
  }

  // Apply element bias (random from list)
  if (theme.elementBias && theme.elementBias.length > 0 && Math.random() < 0.7) {
    options.element = theme.elementBias[Math.floor(Math.random() * theme.elementBias.length)]
  }

  // Apply theme bias (random from list)
  if (theme.themeBias && theme.themeBias.length > 0 && Math.random() < 0.5) {
    options.theme = theme.themeBias[Math.floor(Math.random() * theme.themeBias.length)]
  }

  return options
}
