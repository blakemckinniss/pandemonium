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

  // Campfire (future)
  campfire: {
    id: 'campfire',
    type: 'campfire',
    name: 'Campfire',
    description: 'Rest and recover.',
    icon: '🔥',
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
