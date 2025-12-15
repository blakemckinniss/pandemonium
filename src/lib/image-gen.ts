/**
 * Client for the card art generation service.
 *
 * Communicates with the Python FastAPI service running on port 8420.
 */

import type { CardDefinition, CardTheme } from '../types'

// Service configuration
const IMAGE_GEN_URL = (import.meta.env.VITE_IMAGE_GEN_URL as string) || 'http://localhost:8420'

// Types
export interface GenerateRequest {
  card_id: string
  name: string
  description: string
  theme: CardTheme
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  rarity?: 'starter' | 'common' | 'uncommon' | 'rare'
  custom_hint?: string
  use_xml?: boolean
  seed?: number
  format?: 'png' | 'webp'
}

export interface GenerateResponse {
  card_id: string
  filename: string
  url: string
  prompt: string
  seed: number | null
}

export interface ServiceStatus {
  status: string
  model_loaded: boolean
  model_id: string
  output_dir: string
}

export interface BatchJob {
  job_id: string
  status: 'started' | 'in_progress' | 'completed'
  total_cards?: number
  results?: Array<{
    card_id: string
    status: 'success' | 'error'
    path?: string
    error?: string
  }>
}

interface ErrorResponse {
  detail?: string
}

// Error class
export class ImageGenError extends Error {
  statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'ImageGenError'
    this.statusCode = statusCode
  }
}

/**
 * Check if the image generation service is available.
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${IMAGE_GEN_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Get detailed service status including model state.
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  const res = await fetch(`${IMAGE_GEN_URL}/status`)
  if (!res.ok) {
    throw new ImageGenError(`Status check failed: ${res.status}`, res.status)
  }
  return (await res.json()) as ServiceStatus
}

/**
 * Generate card art for a single card.
 */
export async function generateCardArt(request: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${IMAGE_GEN_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const error = await res.json().catch((): ErrorResponse => ({ detail: res.statusText })) as ErrorResponse
    throw new ImageGenError(error.detail ?? 'Generation failed', res.status)
  }

  return (await res.json()) as GenerateResponse
}

/**
 * Generate card art from a CardDefinition.
 */
export async function generateFromCardDef(
  cardDef: CardDefinition,
  options?: {
    customHint?: string
    useXml?: boolean
    seed?: number
  }
): Promise<GenerateResponse> {
  return generateCardArt({
    card_id: cardDef.id,
    name: cardDef.name,
    description: cardDef.description,
    theme: cardDef.theme,
    element: cardDef.element,
    rarity: cardDef.rarity,
    custom_hint: options?.customHint,
    use_xml: options?.useXml,
    seed: options?.seed,
  })
}

/**
 * Get the full URL for a generated image.
 */
export function getImageUrl(filename: string): string {
  return `${IMAGE_GEN_URL}/images/${filename}`
}

/**
 * Start batch generation for multiple cards.
 */
export async function startBatchGeneration(
  cards: Array<Partial<CardDefinition>>,
  format: 'png' | 'webp' = 'webp'
): Promise<BatchJob> {
  const res = await fetch(`${IMAGE_GEN_URL}/batch/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards, format }),
  })

  if (!res.ok) {
    const error = await res.json().catch((): ErrorResponse => ({ detail: res.statusText })) as ErrorResponse
    throw new ImageGenError(error.detail ?? 'Batch start failed', res.status)
  }

  return (await res.json()) as BatchJob
}

/**
 * Check batch job status.
 */
export async function getBatchStatus(jobId: string): Promise<BatchJob> {
  const res = await fetch(`${IMAGE_GEN_URL}/batch/${jobId}`)

  if (!res.ok) {
    throw new ImageGenError(`Batch status check failed: ${res.status}`, res.status)
  }

  return (await res.json()) as BatchJob
}

/**
 * Poll batch job until completion.
 */
export async function waitForBatch(
  jobId: string,
  pollInterval: number = 2000,
  onProgress?: (job: BatchJob) => void
): Promise<BatchJob> {
  while (true) {
    const job = await getBatchStatus(jobId)

    if (onProgress) {
      onProgress(job)
    }

    if (job.status === 'completed') {
      return job
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }
}

/**
 * Manually trigger model loading.
 */
export async function loadModel(): Promise<{ status: string }> {
  const res = await fetch(`${IMAGE_GEN_URL}/load-model`, { method: 'POST' })

  if (!res.ok) {
    const error = await res.json().catch((): ErrorResponse => ({ detail: res.statusText })) as ErrorResponse
    throw new ImageGenError(error.detail ?? 'Model load failed', res.status)
  }

  return (await res.json()) as { status: string }
}

/**
 * Unload model to free VRAM.
 */
export async function unloadModel(): Promise<{ status: string }> {
  const res = await fetch(`${IMAGE_GEN_URL}/unload-model`, { method: 'POST' })

  if (!res.ok) {
    throw new ImageGenError(`Model unload failed: ${res.status}`, res.status)
  }

  return (await res.json()) as { status: string }
}
