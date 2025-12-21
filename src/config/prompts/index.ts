/**
 * AI Generation Prompts - YAML Configuration
 *
 * Prompts are stored in public/prompts/*.yaml for easy editing.
 * This module provides type-safe access to load them.
 *
 * Usage:
 *   import { loadPrompt, preloadAllPrompts } from '@/config/prompts'
 *   const cardPrompt = await loadPrompt('card')
 *
 * Hot-reload:
 *   In dev mode, prompts are reloaded every 5 seconds if modified.
 *   Edit public/prompts/card.yaml and changes take effect immediately.
 */

export {
  loadPrompt,
  preloadAllPrompts,
  clearPromptCache,
  getCachedPrompts,
  type PromptType,
} from './loader'
