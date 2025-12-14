import type { RoomDefinition, RoomType } from '../types'

// Room definitions
export const ROOMS: Record<string, RoomDefinition> = {
  // Combat rooms
  slime_pit: {
    id: 'slime_pit',
    type: 'combat',
    name: 'Slime Pit',
    description: 'A den of acidic slimes.',
    icon: '🟢',
    monsters: ['slime', 'slime'],
  },
  cultist_lair: {
    id: 'cultist_lair',
    type: 'combat',
    name: 'Cultist Lair',
    description: 'Dark worshippers lurk here.',
    icon: '🔮',
    monsters: ['cultist'],
  },
  jaw_worm_nest: {
    id: 'jaw_worm_nest',
    type: 'combat',
    name: 'Worm Nest',
    description: 'Writhing tunnels ahead.',
    icon: '🪱',
    monsters: ['jaw_worm'],
  },
  mixed_combat: {
    id: 'mixed_combat',
    type: 'combat',
    name: 'Ambush',
    description: 'Multiple foes await.',
    icon: '⚔️',
    monsters: ['slime', 'cultist'],
  },

  // Elemental combat rooms
  infernal_pit: {
    id: 'infernal_pit',
    type: 'combat',
    name: 'Infernal Pit',
    description: 'Flames dance in the darkness.',
    icon: '🔥',
    monsters: ['fire_imp', 'fire_imp'],
  },
  frozen_cavern: {
    id: 'frozen_cavern',
    type: 'combat',
    name: 'Frozen Cavern',
    description: 'Ice crystals line the walls.',
    icon: '❄️',
    monsters: ['frost_elemental'],
  },
  storm_nexus: {
    id: 'storm_nexus',
    type: 'combat',
    name: 'Storm Nexus',
    description: 'Lightning crackles in the air.',
    icon: '⚡',
    monsters: ['storm_sprite', 'storm_sprite', 'storm_sprite'],
  },
  void_shrine: {
    id: 'void_shrine',
    type: 'combat',
    name: 'Void Shrine',
    description: 'Reality warps around you.',
    icon: '🌀',
    monsters: ['void_cultist'],
  },
  flooded_chamber: {
    id: 'flooded_chamber',
    type: 'combat',
    name: 'Flooded Chamber',
    description: 'Water drips from everywhere.',
    icon: '💧',
    monsters: ['water_slime', 'water_slime'],
  },
  elemental_convergence: {
    id: 'elemental_convergence',
    type: 'combat',
    name: 'Elemental Convergence',
    description: 'All elements clash here.',
    icon: '🌈',
    monsters: ['fire_imp', 'frost_elemental', 'storm_sprite'],
  },

  // Elite rooms
  elite_guardian: {
    id: 'elite_guardian',
    type: 'elite',
    name: 'Guardian Chamber',
    description: 'A powerful guardian blocks the path.',
    icon: '👹',
    monsters: ['jaw_worm', 'jaw_worm'],
  },

  // Boss room
  boss_heart: {
    id: 'boss_heart',
    type: 'boss',
    name: 'Heart of Chaos',
    description: 'The source of corruption.',
    icon: '💀',
    monsters: ['cultist', 'cultist', 'jaw_worm'],
  },

  // Campfire
  campfire: {
    id: 'campfire',
    type: 'campfire',
    name: 'Campfire',
    description: 'Rest and recover.',
    icon: '🔥',
  },

  // Treasure rooms
  treasure_small: {
    id: 'treasure_small',
    type: 'treasure',
    name: 'Treasure Cache',
    description: 'A small stash of valuables.',
    icon: '💎',
  },
  treasure_large: {
    id: 'treasure_large',
    type: 'treasure',
    name: 'Treasure Vault',
    description: 'A vault filled with ancient relics.',
    icon: '👑',
  },
}

// Get rooms by type
export function getRoomsByType(type: RoomType): RoomDefinition[] {
  return Object.values(ROOMS).filter((r) => r.type === type)
}

// Get room definition
export function getRoomDefinition(id: string): RoomDefinition | undefined {
  return ROOMS[id]
}
