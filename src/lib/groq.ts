import Groq from 'groq-sdk'
import { logger } from './logger'

// Initialize Groq client with API key from environment
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY as string,
  dangerouslyAllowBrowser: true, // Required for browser usage
})

// Model to use for card generation
export const GROQ_MODEL = 'moonshotai/kimi-k2-instruct'

/**
 * Make a chat completion request to Groq
 */
export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.7,
    max_completion_tokens: options?.maxTokens ?? 1024,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response content from Groq')
  }

  return content
}

/**
 * Test connection to Groq API
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await chatCompletion(
      'You are a helpful assistant.',
      'Say "connected" and nothing else.',
      { maxTokens: 10 }
    )
    return response.toLowerCase().includes('connected')
  } catch (error) {
    logger.error('Groq', 'Connection test failed:', error)
    return false
  }
}

export { groq }
