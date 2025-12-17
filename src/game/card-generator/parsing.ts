// ============================================
// JSON RESPONSE PARSERS
// ============================================

import type { CardDefinition } from '../../types'

export function parseCardResponse(response: string): Partial<CardDefinition> {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned) as Partial<CardDefinition>
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Partial<CardDefinition>
    }
    throw new Error(`Failed to parse card response: ${response}`)
  }
}

export function parseHeroResponse(response: string): Partial<CardDefinition> {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned) as Partial<CardDefinition>
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Partial<CardDefinition>
    }
    throw new Error(`Failed to parse hero response: ${response}`)
  }
}

export function parseEnemyResponse(response: string): Record<string, unknown> {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>
    }
    throw new Error(`Failed to parse enemy response: ${response}`)
  }
}
