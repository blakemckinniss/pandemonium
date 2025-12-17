// ============================================
// CARD ART GENERATION
// ============================================

import type { CardDefinition } from '../../types'
import {
  generateFromCardDef,
  checkServiceHealth,
  getImageUrl,
  type GenerateResponse,
} from '../../lib/image-gen'
import { logger } from '../../lib/logger'

/**
 * Generate card art if the image service is available.
 * Non-blocking - returns null if service unavailable.
 */
export async function generateCardArtIfAvailable(
  card: CardDefinition,
  customHint?: string
): Promise<GenerateResponse | null> {
  try {
    const serviceAvailable = await checkServiceHealth()
    if (!serviceAvailable) {
      logger.warn('CardGen', 'Image service unavailable, skipping art generation')
      return null
    }

    const result = await generateFromCardDef(card, { customHint })
    // Convert relative URL to full URL
    result.url = getImageUrl(result.filename)
    return result
  } catch (error) {
    logger.error('CardGen', 'Art generation failed:', error)
    return null
  }
}
