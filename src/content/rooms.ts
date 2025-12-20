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
    image: '/cards/room_slime_pit.webp',
    monsters: ['slime', 'slime'],
  },
  cultist_lair: {
    id: 'cultist_lair',
    type: 'combat',
    name: 'Cultist Lair',
    description: 'Dark worshippers lurk here.',
    icon: '🔮',
    image: '/cards/room_cultist_lair.webp',
    monsters: ['cultist'],
  },
  jaw_worm_nest: {
    id: 'jaw_worm_nest',
    type: 'combat',
    name: 'Worm Nest',
    description: 'Writhing tunnels ahead.',
    icon: '🪱',
    image: '/cards/room_worm_nest.webp',
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
    image: '/cards/room_infernal_pit.webp',
    monsters: ['fire_imp', 'fire_imp'],
  },
  frozen_cavern: {
    id: 'frozen_cavern',
    type: 'combat',
    name: 'Frozen Cavern',
    description: 'Ice crystals line the walls.',
    icon: '❄️',
    image: '/cards/room_frozen_cavern.webp',
    monsters: ['frost_elemental'],
  },
  storm_nexus: {
    id: 'storm_nexus',
    type: 'combat',
    name: 'Storm Nexus',
    description: 'Lightning crackles in the air.',
    icon: '⚡',
    image: '/cards/room_storm_nexus.webp',
    monsters: ['storm_sprite', 'storm_sprite', 'storm_sprite'],
  },
  void_shrine: {
    id: 'void_shrine',
    type: 'combat',
    name: 'Void Shrine',
    description: 'Reality warps around you.',
    icon: '🌀',
    image: '/cards/room_void_shrine.webp',
    monsters: ['void_cultist'],
  },

  // --- SHADOW CRYPT (Void Element) ---

  bone_yard: {
    id: 'bone_yard',
    type: 'combat',
    name: 'Bone Yard',
    description: 'Skeletons rise from ancient graves.',
    icon: '💀',
    image: '/cards/room_bone_yard.webp',
    monsters: ['skeleton_warrior', 'skeleton_warrior'],
  },
  shadow_passage: {
    id: 'shadow_passage',
    type: 'combat',
    name: 'Shadow Passage',
    description: 'Wraiths drift through the darkness.',
    icon: '👻',
    image: '/cards/room_shadow_passage.webp',
    monsters: ['shadow_wraith', 'shadow_wraith', 'shadow_wraith'],
  },
  crypt_depths: {
    id: 'crypt_depths',
    type: 'combat',
    name: 'Crypt Depths',
    description: 'Ancient bones guard forbidden secrets.',
    icon: '🦴',
    image: '/cards/room_crypt_depths.webp',
    monsters: ['skeleton_warrior', 'shadow_wraith'],
  },
  necropolis: {
    id: 'necropolis',
    type: 'elite',
    name: 'Necropolis',
    description: 'A bone golem guards the crypt entrance.',
    icon: '🏛️',
    image: '/cards/room_necropolis.webp',
    monsters: ['bone_golem'],
  },
  dark_sanctum: {
    id: 'dark_sanctum',
    type: 'elite',
    name: 'Dark Sanctum',
    description: 'A necromancer performs dark rituals.',
    icon: '📿',
    image: '/cards/room_dark_sanctum.webp',
    monsters: ['necromancer', 'skeleton_warrior'],
  },
  shadow_throne: {
    id: 'shadow_throne',
    type: 'boss',
    name: 'Shadow Throne',
    description: 'The master of death awaits.',
    icon: '👑',
    image: '/cards/room_shadow_throne.webp',
    monsters: ['boss_necromancer', 'bone_golem', 'shadow_wraith'], // boss_necromancer has ultimate at 50% HP
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
    monsters: ['gremlin_nob'],
  },
  elite_inferno: {
    id: 'elite_inferno',
    type: 'elite',
    name: 'Inferno Depths',
    description: 'Demons of pure flame await.',
    icon: '🔥',
    monsters: ['elite_fire_imp', 'fire_imp', 'fire_imp'],
  },
  elite_void_sanctum: {
    id: 'elite_void_sanctum',
    type: 'elite',
    name: 'Void Sanctum',
    description: 'The high priestess channels dark power.',
    icon: '🌀',
    monsters: ['elite_cultist', 'void_cultist'],
  },
  elite_frozen_throne: {
    id: 'elite_frozen_throne',
    type: 'elite',
    name: 'Frozen Throne',
    description: 'An ancient ice colossus awaits.',
    icon: '🧊',
    monsters: ['elite_frost_elemental'],
  },
  elite_phantom_court: {
    id: 'elite_phantom_court',
    type: 'elite',
    name: 'Phantom Court',
    description: 'Spectral lords hold court in darkness.',
    icon: '👻',
    monsters: ['elite_shadow_wraith', 'shadow_wraith', 'shadow_wraith'],
  },

  // Boss room
  boss_heart: {
    id: 'boss_heart',
    type: 'boss',
    name: 'Heart of Chaos',
    description: 'The source of corruption.',
    icon: '💀',
    image: '/cards/room_boss_heart.webp',
    monsters: ['boss_heart', 'void_cultist'], // boss_heart has ability (Chaos Pulse) + ultimate at 30% HP
  },

  // Campfire
  campfire: {
    id: 'campfire',
    type: 'campfire',
    name: 'Campfire',
    description: 'Rest and recover.',
    icon: '🔥',
    image: '/cards/room_campfire.webp',
  },

  // Treasure rooms
  treasure_small: {
    id: 'treasure_small',
    type: 'treasure',
    name: 'Treasure Cache',
    description: 'A small stash of valuables.',
    icon: '💎',
    image: '/cards/room_treasure.webp',
  },
  treasure_large: {
    id: 'treasure_large',
    type: 'treasure',
    name: 'Treasure Vault',
    description: 'A vault filled with ancient relics.',
    icon: '👑',
    image: '/cards/room_treasure.webp',
  },

  // Shop rooms
  wandering_merchant: {
    id: 'wandering_merchant',
    type: 'shop',
    name: 'Wandering Merchant',
    description: 'A mysterious trader offers rare wares.',
    icon: '🛒',
    image: '/cards/room_shop.webp',
  },
  black_market: {
    id: 'black_market',
    type: 'shop',
    name: 'Black Market',
    description: 'Illicit goods at premium prices.',
    icon: '🏪',
    image: '/cards/room_shop.webp',
  },

  // Event rooms
  mysterious_encounter: {
    id: 'mysterious_encounter',
    type: 'event',
    name: 'Strange Occurrence',
    description: 'Something unusual awaits.',
    icon: '❓',
    image: '/cards/room_event.webp',
  },
  ancient_shrine: {
    id: 'ancient_shrine',
    type: 'event',
    name: 'Ancient Shrine',
    description: 'An altar to forgotten gods.',
    icon: '🏛️',
    image: '/cards/room_shrine.webp',
  },
  wandering_spirit: {
    id: 'wandering_spirit',
    type: 'event',
    name: 'Wandering Spirit',
    description: 'A ghostly presence beckons.',
    icon: '👻',
    image: '/cards/room_spirit.webp',
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
