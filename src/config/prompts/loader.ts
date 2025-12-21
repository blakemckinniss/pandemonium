/**
 * YAML Prompt Loader with Hot-Reload Support
 *
 * Loads AI generation prompts from YAML config files.
 * In development mode, watches for file changes and reloads automatically.
 */

import { parse as parseYaml } from 'yaml'

// Cache for loaded prompts
const promptCache = new Map<string, string>()
const lastModified = new Map<string, number>()

// Available prompt types
export type PromptType =
  | 'card'
  | 'hero'
  | 'enemy'
  | 'relic'
  | 'dungeon'
  | 'modifier'

// Prompt file URLs (relative to public directory in Vite)
const PROMPT_FILES: Record<PromptType, string> = {
  card: '/prompts/card.yaml',
  hero: '/prompts/hero.yaml',
  enemy: '/prompts/enemy.yaml',
  relic: '/prompts/relic.yaml',
  dungeon: '/prompts/dungeon.yaml',
  modifier: '/prompts/modifier.yaml',
}

/**
 * Load a prompt from YAML config file.
 * Caches result and checks for updates in dev mode.
 */
export async function loadPrompt(type: PromptType): Promise<string> {
  const cached = promptCache.get(type)

  // In production, always use cache if available
  if (cached && import.meta.env.PROD) {
    return cached
  }

  // In dev mode, check if we should reload (every 5 seconds max)
  const now = Date.now()
  const lastCheck = lastModified.get(type) ?? 0
  if (cached && now - lastCheck < 5000) {
    return cached
  }

  try {
    const url = PROMPT_FILES[type]
    const response = await fetch(url, {
      cache: import.meta.env.DEV ? 'no-cache' : 'default'
    })

    if (!response.ok) {
      throw new Error(`Failed to load prompt: ${response.statusText}`)
    }

    const yamlText = await response.text()
    const parsed = parseYaml(yamlText) as { system_prompt: string }

    if (!parsed.system_prompt || typeof parsed.system_prompt !== 'string') {
      throw new Error(`Invalid prompt file: missing system_prompt field`)
    }

    promptCache.set(type, parsed.system_prompt)
    lastModified.set(type, now)

    if (import.meta.env.DEV) {
      console.log(`[PromptLoader] Loaded ${type} prompt (${parsed.system_prompt.length} chars)`)
    }

    return parsed.system_prompt
  } catch (error) {
    // If fetch fails, try to use cached value
    if (cached) {
      console.warn(`[PromptLoader] Failed to reload ${type}, using cached version:`, error)
      return cached
    }
    throw error
  }
}

/**
 * Preload all prompts into cache.
 * Call this at app startup for faster generation.
 */
export async function preloadAllPrompts(): Promise<void> {
  const types: PromptType[] = ['card', 'hero', 'enemy', 'relic', 'dungeon', 'modifier']

  await Promise.all(types.map(type =>
    loadPrompt(type).catch(err => {
      console.warn(`[PromptLoader] Failed to preload ${type}:`, err)
    })
  ))
}

/**
 * Clear the prompt cache.
 * Useful for forcing a reload in dev mode.
 */
export function clearPromptCache(): void {
  promptCache.clear()
  lastModified.clear()
}

/**
 * Get all cached prompts (for debugging).
 */
export function getCachedPrompts(): Record<string, string> {
  return Object.fromEntries(promptCache.entries())
}
