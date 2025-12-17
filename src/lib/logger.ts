// ============================================
// LOGGER UTILITY
// ============================================
// Structured logging with levels that auto-disable in production

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// In production, only show warnings and errors
// In development, show everything
const MIN_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL]
}

function formatPrefix(_level: LogLevel, context?: string): string {
  const tag = context ? `[${context}]` : ''
  return tag
}

/**
 * Logger with automatic level filtering based on environment.
 * DEBUG/INFO are disabled in production builds.
 *
 * Usage:
 *   logger.debug('CardGenerator', 'Generated card:', card)
 *   logger.info('Combat', 'Turn started')
 *   logger.warn('Powers', `Unknown power: ${id}`)
 *   logger.error('API', 'Request failed:', error)
 */
export const logger = {
  /** Debug-level logging - disabled in production */
  debug(context: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(formatPrefix('debug', context), ...args)
    }
  },

  /** Info-level logging - disabled in production */
  info(context: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.log(formatPrefix('info', context), ...args)
    }
  },

  /** Warning-level logging - always enabled */
  warn(context: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatPrefix('warn', context), ...args)
    }
  },

  /** Error-level logging - always enabled */
  error(context: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(formatPrefix('error', context), ...args)
    }
  },
}

export default logger
