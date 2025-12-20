/**
 * Client for the card art generation service.
 *
 * Communicates with the Python FastAPI service running on port 8420.
 */

import type { CardDefinition, CardTheme, CardRarity } from '../types'

// Service configuration
const IMAGE_GEN_URL = (import.meta.env.VITE_IMAGE_GEN_URL as string) || 'http://localhost:8420'

// Retry configuration
const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

// Types
export interface HealthResponse {
  status: 'ok' | 'comfyui_down'
  queue_depth: number
  busy: boolean
}

export interface GenerateRequest {
  card_id: string
  name: string
  description: string
  theme: CardTheme
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  rarity?: CardRarity
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
 * Check if the image generation service is available and get queue status.
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${IMAGE_GEN_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return false
    const data = (await res.json()) as HealthResponse
    return data.status === 'ok'
  } catch {
    return false
  }
}

/**
 * Get detailed health status including queue depth.
 */
export async function getHealthStatus(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${IMAGE_GEN_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    return (await res.json()) as HealthResponse
  } catch {
    return null
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate backoff delay with jitter.
 */
function getBackoffDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS)
  // Add 10-30% jitter to prevent thundering herd
  const jitter = delay * (0.1 + Math.random() * 0.2)
  return Math.floor(delay + jitter)
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
 * Generate card art for a single card with retry logic.
 * Retries on 503 (service busy) with exponential backoff.
 */
export async function generateCardArt(request: GenerateRequest): Promise<GenerateResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${IMAGE_GEN_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (res.ok) {
        return (await res.json()) as GenerateResponse
      }

      const error = (await res.json().catch((): ErrorResponse => ({ detail: res.statusText }))) as ErrorResponse

      // Retry on 503 (service busy/unavailable)
      if (res.status === 503 && attempt < MAX_RETRIES - 1) {
        const delay = getBackoffDelay(attempt)
        console.log(`[ImageGen] Service busy, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
        continue
      }

      throw new ImageGenError(error.detail ?? 'Generation failed', res.status)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't retry ImageGenError (non-retryable errors)
      if (err instanceof ImageGenError) {
        throw err
      }

      // Retry network errors
      if (attempt < MAX_RETRIES - 1) {
        const delay = getBackoffDelay(attempt)
        console.log(`[ImageGen] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
        continue
      }
    }
  }

  throw lastError ?? new ImageGenError('Generation failed after retries')
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
