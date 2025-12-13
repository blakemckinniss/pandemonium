let uidCounter = 0

export function generateUid(): string {
  return `${Date.now().toString(36)}-${(uidCounter++).toString(36)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}
