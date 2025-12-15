import { createDebugAPI, type DebugAPI } from './api'
import type { RunState } from '../../types'

let debugAPI: DebugAPI | null = null

type SetStateFn = (updater: RunState | ((prev: RunState | null) => RunState | null)) => void

/**
 * Register debug API on window.__GAME__
 * Call this from GameScreen component in useEffect
 *
 * @example
 * useEffect(() => {
 *   registerDebugAPI(() => state, setState)
 *   return () => unregisterDebugAPI()
 * }, [state])
 */
export function registerDebugAPI(
  getState: () => RunState | null,
  setState: SetStateFn
): void {
  // Only register in development
  if (import.meta.env.DEV) {
    debugAPI = createDebugAPI(getState, setState)
    window.__GAME__ = debugAPI
    console.log(
      '%c🎮 Pandemonium Debug API ready! Type __GAME__.help() for usage.',
      'color: #22c55e; font-weight: bold; font-size: 14px;'
    )
  }
}

/**
 * Unregister debug API (call in cleanup)
 */
export function unregisterDebugAPI(): void {
  if (window.__GAME__) {
    delete window.__GAME__
    debugAPI = null
  }
}

/**
 * Check if debug API is registered
 */
export function isDebugAPIRegistered(): boolean {
  return debugAPI !== null
}

export { type DebugAPI }
