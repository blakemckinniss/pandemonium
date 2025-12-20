// ============================================
// CARD ART GENERATION
// ============================================

import type { CardDefinition } from '../../types'
import {
  generateFromCardDef,
  checkServiceHealth,
  getImageUrl,
  type GenerateResponse,
  ImageGenError,
} from '../../lib/image-gen'
import { logger } from '../../lib/logger'

/**
 * Error thrown when card art generation fails and is required.
 */
export class CardArtRequiredError extends Error {
  readonly cardId: string
  readonly reason: string

  constructor(cardId: string, reason: string) {
    super(`Card art generation failed for ${cardId}: ${reason}`)
    this.name = 'CardArtRequiredError'
    this.cardId = cardId
    this.reason = reason
  }
}

/**
 * Generate card art - REQUIRED for card to be valid.
 * Throws CardArtRequiredError if art generation fails.
 * This ensures no cards exist without images.
 */
export async function generateCardArt(
  card: CardDefinition,
  customHint?: string
): Promise<GenerateResponse> {
  // Check service health first
  const serviceAvailable = await checkServiceHealth()
  if (!serviceAvailable) {
    throw new CardArtRequiredError(card.id, 'Image service unavailable')
  }

  try {
    const result = await generateFromCardDef(card, { customHint })
    // Convert relative URL to full URL
    result.url = getImageUrl(result.filename)
    logger.info('CardArt', `Generated art for ${card.name}: ${result.filename}`)
    return result
  } catch (error) {
    const reason = error instanceof ImageGenError
      ? `ComfyUI error: ${error.message}`
      : error instanceof Error
        ? error.message
        : 'Unknown error'
    throw new CardArtRequiredError(card.id, reason)
  }
}

/**
 * @deprecated Use generateCardArt instead - cards MUST have images.
 * Generate card art if the image service is available.
 * Non-blocking - returns null if service unavailable.
 */
export async function generateCardArtIfAvailable(
  card: CardDefinition,
  customHint?: string
): Promise<GenerateResponse | null> {
  try {
    return await generateCardArt(card, customHint)
  } catch (error) {
    logger.error('CardGen', 'Art generation failed:', error)
    return null
  }
}
